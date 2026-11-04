// PHQ-9 예측 점수(0~27, 높을수록 힘듦) → 마음 점수(0~100, 높을수록 양호)
import { PHQ9_MAX } from "@/lib/phq9";

export function toWellbeingScore(phq9: number): number {
  const clamped = Math.min(PHQ9_MAX, Math.max(0, Number(phq9) || 0));
  return Math.round(100 - (clamped / PHQ9_MAX) * 100);
}
