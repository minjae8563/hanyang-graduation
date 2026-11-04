// 연속 일기 작성일(스트릭) 계산.
// - 같은 날 여러 번 써도 하루로 센다.
// - 오늘 아직 안 썼다면 어제까지 이어진 기록을 유지해서 보여준다(오늘 쓰면 +1).
// - 하루라도 비면 끊기고, 이후 작성일부터 다시 센다.
import { localDateString } from "@/lib/checkin";

function prevDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return localDateString(new Date(y, m - 1, d - 1));
}

export type Streak = { days: number; wroteToday: boolean };

/** @param timestamps entries.created_at (ISO) 목록. 순서 무관. */
export function computeStreak(timestamps: string[], now = new Date()): Streak {
  const days = new Set(timestamps.map((t) => localDateString(new Date(t))));
  const today = localDateString(now);
  const wroteToday = days.has(today);

  let cursor = wroteToday ? today : prevDay(today);
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = prevDay(cursor);
  }
  return { days: count, wroteToday };
}
