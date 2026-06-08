// 일기 1건에 대한 LLM 분석 결과 타입 + 파싱 유틸 (클라이언트/서버 공용 타입).

export type RiskLevel = "none" | "low" | "medium" | "high";

// PHQ-9 9개 도메인에 정렬된 증상축 (각 0~3)
export type SymptomScores = {
  interest: number; // 흥미·즐거움 상실
  mood: number; // 우울·가라앉음
  sleep: number; // 수면 문제
  energy: number; // 피로·기력저하
  appetite: number; // 식욕 변화
  selfworth: number; // 자기비하·죄책감
  concentration: number; // 집중력 저하
  psychomotor: number; // 정신운동 지연/초조
  suicidal: number; // 자해·자살 생각
};

export const SYMPTOM_KEYS: (keyof SymptomScores)[] = [
  "interest",
  "mood",
  "sleep",
  "energy",
  "appetite",
  "selfworth",
  "concentration",
  "psychomotor",
  "suicidal",
];

export const SYMPTOM_LABELS: Record<keyof SymptomScores, string> = {
  interest: "흥미",
  mood: "우울",
  sleep: "수면",
  energy: "기력",
  appetite: "식욕",
  selfworth: "자기비하",
  concentration: "집중",
  psychomotor: "초조/지연",
  suicidal: "자해 생각",
};

export type EntryAnalysis = {
  sentiment: number; // -1.0(부정) ~ 1.0(긍정)
  symptom_scores: SymptomScores;
  activities: string[]; // 글에 언급된 활동
  risk_level: RiskLevel;
  feedback_message: string; // 따뜻한 한국어 피드백
};

export const ZERO_SYMPTOMS: SymptomScores = {
  interest: 0,
  mood: 0,
  sleep: 0,
  energy: 0,
  appetite: 0,
  selfworth: 0,
  concentration: 0,
  psychomotor: 0,
  suicidal: 0,
};

export const DEFAULT_ANALYSIS: EntryAnalysis = {
  sentiment: 0,
  symptom_scores: { ...ZERO_SYMPTOMS },
  activities: [],
  risk_level: "none",
  feedback_message:
    "오늘의 마음을 적어주어 고마워요. 기록을 꾸준히 이어가 볼까요?",
};

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function coerceRisk(v: unknown): RiskLevel {
  return v === "low" || v === "medium" || v === "high" ? v : "none";
}

/**
 * 모델이 돌려준 텍스트에서 JSON을 추출·검증해 EntryAnalysis로 변환.
 * 코드블록/잡텍스트가 섞여 있어도 첫 번째 {...} 블록을 파싱한다.
 * 실패 시 안전한 기본값을 반환해 앱이 깨지지 않게 한다.
 */
export function parseAnalysis(text: string): EntryAnalysis {
  if (!text) return { ...DEFAULT_ANALYSIS };
  let raw: any = null;
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      raw = JSON.parse(text.slice(start, end + 1));
    }
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ANALYSIS };

  const s = raw.symptom_scores ?? {};
  const symptom_scores = {} as SymptomScores;
  for (const k of SYMPTOM_KEYS) {
    symptom_scores[k] = Math.round(clamp(s[k], 0, 3, 0));
  }

  return {
    sentiment: clamp(raw.sentiment, -1, 1, 0),
    symptom_scores,
    activities: Array.isArray(raw.activities)
      ? raw.activities.filter((a: unknown) => typeof a === "string").slice(0, 8)
      : [],
    risk_level: coerceRisk(raw.risk_level),
    feedback_message:
      typeof raw.feedback_message === "string" && raw.feedback_message.trim()
        ? raw.feedback_message.trim()
        : DEFAULT_ANALYSIS.feedback_message,
  };
}

// 위험 신호 노출 여부 (실시간 피드백에서 위기 자원 표시 트리거)
export function isRisky(a: Pick<EntryAnalysis, "risk_level" | "symptom_scores">) {
  return (
    a.risk_level === "high" ||
    a.risk_level === "medium" ||
    a.symptom_scores.suicidal > 0
  );
}
