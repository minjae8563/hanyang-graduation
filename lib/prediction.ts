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
  const since = new Date(Date.now() - PREDICTION_WINDOW_DAYS * 86_400_000).toISOString();
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
