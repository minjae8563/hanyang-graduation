// PHQ-9 (우울증 선별도구) — 한국어판(박승진 등, 2010) 문항.
// 지난 "2주" 회상 기준. 각 문항 0~3, 총점 0~27.

export const PHQ9_INTRO =
  "지난 2주 동안 다음과 같은 문제들로 인해 얼마나 자주 방해를 받았나요?";

export const PHQ9_ITEMS: string[] = [
  "일 또는 여가 활동을 하는 데 흥미나 즐거움을 거의 느끼지 못함",
  "기분이 가라앉거나, 우울하거나, 희망이 없다고 느낌",
  "잠들기 어렵거나 자주 깸, 또는 잠을 너무 많이 잠",
  "피곤하다고 느끼거나 기운이 거의 없음",
  "입맛이 없거나 과식을 함",
  "내가 잘못했거나 실패자라고 느낌 ─ 또는 자신이나 가족을 실망시켰다고 느낌",
  "신문을 읽거나 텔레비전을 보는 것과 같은 일에 집중하기 어려움",
  "다른 사람이 알아챌 만큼 너무 느리게 움직이거나 말함 ─ 또는 반대로 너무 안절부절못해 평소보다 많이 돌아다님",
  "차라리 죽는 것이 낫겠다고 생각하거나, 어떤 식으로든 자신을 해칠 것이라고 생각함",
];

// 자살 사고 관련 문항(9번)의 인덱스 — 응답 시 위기 자원 노출에 사용
export const PHQ9_RISK_INDEX = 8;

export const PHQ9_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "전혀 아니다" },
  { value: 1, label: "여러 날 동안" },
  { value: 2, label: "일주일 이상" },
  { value: 3, label: "거의 매일" },
];

export type Severity = {
  key: "minimal" | "mild" | "moderate" | "moderately_severe" | "severe";
  label: string;
  message: string;
  needsSupport: boolean; // 10점 이상 — 전문적 도움 권유
  colorClass: string; // 배지/막대 색
};

export function severityOf(total: number): Severity {
  if (total <= 4)
    return {
      key: "minimal",
      label: "최소",
      message: "지금은 비교적 안정적인 상태로 보여요.",
      needsSupport: false,
      colorClass: "bg-sage-500",
    };
  if (total <= 9)
    return {
      key: "mild",
      label: "경미",
      message: "약간의 가라앉음이 느껴지는 시기예요. 스스로를 잘 살펴봐 주세요.",
      needsSupport: false,
      colorClass: "bg-sage-300",
    };
  if (total <= 14)
    return {
      key: "moderate",
      label: "중간",
      message: "마음이 꽤 무거운 시기로 보여요. 가까운 사람과 이야기를 나눠보면 어떨까요?",
      needsSupport: true,
      colorClass: "bg-amber-400",
    };
  if (total <= 19)
    return {
      key: "moderately_severe",
      label: "중간~심함",
      message: "상당히 힘든 시기를 지나고 있는 것 같아요. 전문가의 도움을 받아보길 권해요.",
      needsSupport: true,
      colorClass: "bg-orange-500",
    };
  return {
    key: "severe",
    label: "심함",
    message: "지금 많이 힘든 상태일 수 있어요. 혼자 견디지 말고 도움을 받아보세요.",
    needsSupport: true,
    colorClass: "bg-red-500",
  };
}

export const PHQ9_MAX = 27;

// PHQ-9 수집 주기(일). 기준선 이후 이 간격마다 다시 받는다.
export const PHQ9_INTERVAL_DAYS = 14;
