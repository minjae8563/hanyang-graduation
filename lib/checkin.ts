// 데일리 미니체크 정의.
// 각 문항은 PHQ-9 핵심 증상축을 "오늘" 기준으로 가볍게 묻는다.
// 선택지 index = 증상 점수(0~3, 높을수록 힘듦). 모델의 일별 특징으로 사용된다.

export type CheckinKey = "mood" | "interest" | "energy" | "sleep" | "focus";

export type CheckinScores = Record<CheckinKey, number>;

export const CHECKIN_ITEMS: {
  key: CheckinKey;
  label: string;
  question: string;
  options: [string, string, string, string]; // [0]=괜찮음 ... [3]=많이 힘듦
}[] = [
  {
    key: "mood",
    label: "기분",
    question: "오늘 기분은 어땠나요?",
    options: ["맑음", "보통", "가라앉음", "많이 우울"],
  },
  {
    key: "interest",
    label: "흥미",
    question: "오늘 흥미나 즐거움을 느꼈나요?",
    options: ["충분히", "조금", "거의 없음", "전혀"],
  },
  {
    key: "energy",
    label: "기운",
    question: "오늘 기운은 어땠나요?",
    options: ["활기참", "보통", "지침", "많이 지침"],
  },
  {
    key: "sleep",
    label: "수면",
    question: "지난밤 잠은 어땠나요?",
    options: ["푹 잤어요", "그럭저럭", "자주 뒤척임", "거의 못 잤어요"],
  },
  {
    key: "focus",
    label: "집중",
    question: "오늘 집중은 잘 됐나요?",
    options: ["잘 됨", "보통", "산만함", "거의 안 됨"],
  },
];

export const CHECKIN_KEYS = CHECKIN_ITEMS.map((i) => i.key);

// 점수(0~3)별 색상 — 요약 점 표시에 사용
export const SCORE_COLORS = [
  "bg-sage-500", // 0 좋음
  "bg-sage-300", // 1
  "bg-amber-400", // 2
  "bg-red-400", // 3 힘듦
];

// 로컬(사용자 시간대) 기준 오늘 날짜 'YYYY-MM-DD'
export function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumScores(scores: Partial<CheckinScores>): number {
  return CHECKIN_KEYS.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
}
