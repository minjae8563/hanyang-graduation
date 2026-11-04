// v0 PHQ-9 추정: 최근 14일 일기의 LLM 증상축 점수(9개 × 0~3) 합계를 평균낸다.
// 결과(0~27)를 predictions 테이블에 저장하면 마음 점수 카드가 0~100으로 변환해 보여준다.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_ANALYSIS,
  SYMPTOM_KEYS,
  type SymptomScores,
} from "@/lib/analysis";
import { localDateString } from "@/lib/checkin";
import { PHQ9_MAX } from "@/lib/phq9";

export const PREDICTION_WINDOW_DAYS = 14;
export const PREDICTION_MODEL_VERSION = "v0-avg";

type AnalyzedRow = {
  symptom_scores: Partial<SymptomScores> | null;
  feedback_message: string | null;
};

/** 순수 계산부: 분석된 일기들의 증상 합계 평균 (0~27). 유효한 일기가 없으면 null. */
export function estimatePhq9(rows: AnalyzedRow[]) {
  const valid = rows.filter(
    (r) =>
      r.symptom_scores &&
      // 분석 실패 시 저장된 기본값(전부 0)은 제외
      r.feedback_message !== DEFAULT_ANALYSIS.feedback_message
  );
  if (valid.length === 0) return null;

  const axisAvg = {} as Record<keyof SymptomScores, number>;
  for (const k of SYMPTOM_KEYS) {
    const sum = valid.reduce((acc, r) => acc + (Number(r.symptom_scores![k]) || 0), 0);
    axisAvg[k] = Math.round((sum / valid.length) * 100) / 100;
  }
  const total = SYMPTOM_KEYS.reduce((acc, k) => acc + axisAvg[k], 0);
  return {
    predicted_total: Math.min(PHQ9_MAX, Math.round(total * 10) / 10),
    features: {
      window_days: PREDICTION_WINDOW_DAYS,
      n_entries: valid.length,
      axis_avg: axisAvg,
    },
  };
}

/** 최근 14일 일기로 추정치를 계산해 predictions에 한 행 추가. 저장했으면 true. */
export async function updatePrediction(supabase: SupabaseClient): Promise<boolean> {
  // 그래프(dailyScoreSeries)와 같은 기준: 오늘 포함 14일(로컬 자정 기준)
  const now = new Date();
  const since = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (PREDICTION_WINDOW_DAYS - 1)
  ).toISOString();
  const { data } = await supabase
    .from("entries")
    .select("symptom_scores, feedback_message")
    .gte("created_at", since)
    .not("symptom_scores", "is", null);

  const est = estimatePhq9((data as AnalyzedRow[]) ?? []);
  if (!est) return false;

  const { error } = await supabase.from("predictions").insert({
    target_date: localDateString(),
    predicted_total: est.predicted_total,
    features: est.features,
    model_version: PREDICTION_MODEL_VERSION,
  });
  return !error;
}

/** 예측이 하나도 없는 기존 사용자를 위해, 화면 진입 시 한 번 채워준다. */
export async function ensurePrediction(supabase: SupabaseClient): Promise<boolean> {
  const { count } = await supabase
    .from("predictions")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return false;
  return updatePrediction(supabase);
}

// ---------------------------------------------------------------------
// 점수 추이 그래프용: 과거 일기로 날짜별 점수를 같은 공식으로 재계산
// ---------------------------------------------------------------------
type DatedRow = AnalyzedRow & { created_at: string };

export type ScorePoint = {
  date: string; // YYYY-MM-DD (로컬)
  score: number | null; // 0~100, 그날 기준 직전 14일에 유효 일기가 없으면 null
  n: number; // 계산에 쓰인 일기 수
};

/** 오늘부터 거꾸로 `days`일 동안, 각 날짜 D의 [D-13, D] 구간 평균을 마음 점수로 환산 */
export function dailyScoreSeries(
  rows: DatedRow[],
  days: number,
  toScore: (phq9: number) => number,
  now = new Date()
): ScorePoint[] {
  const byDate = new Map<string, DatedRow[]>();
  for (const r of rows) {
    const d = localDateString(new Date(r.created_at));
    const list = byDate.get(d) ?? [];
    list.push(r);
    byDate.set(d, list);
  }

  const out: ScorePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const windowRows: DatedRow[] = [];
    for (let j = 0; j < PREDICTION_WINDOW_DAYS; j++) {
      const w = new Date(day.getFullYear(), day.getMonth(), day.getDate() - j);
      windowRows.push(...(byDate.get(localDateString(w)) ?? []));
    }
    const est = estimatePhq9(windowRows);
    out.push({
      date: localDateString(day),
      score: est ? toScore(est.predicted_total) : null,
      n: est ? est.features.n_entries : 0,
    });
  }
  return out;
}
