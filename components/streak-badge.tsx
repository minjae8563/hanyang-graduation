"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import { computeStreak, type Streak } from "@/lib/streak";
import { Flame } from "lucide-react";

/** 메인 화면 헤더의 🔥 연속 기록일. refreshKey가 바뀌면 다시 계산한다. */
export function StreakBadge({ refreshKey = 0 }: { refreshKey?: number }) {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      // 최근 400일치 작성 시각만 가져와 계산 (본문은 불필요)
      const since = new Date();
      since.setDate(since.getDate() - 400);
      const { data } = await supabase
        .from("entries")
        .select("created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (!data) return;
      setStreak(computeStreak(data.map((r) => r.created_at as string)));
    })();
  }, [supabase, refreshKey]);

  if (!streak) return null;
  const active = streak.days > 0;

  return (
    <div
      className={`fade-in flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
        active
          ? "bg-orange-50 text-orange-600 ring-orange-200"
          : "bg-white/60 text-mist ring-clay/40"
      }`}
      title={
        active && !streak.wroteToday
          ? "오늘 기록하면 연속 기록이 이어져요"
          : undefined
      }
    >
      <Flame
        className={`h-4 w-4 ${
          active
            ? streak.wroteToday
              ? "fill-orange-500 text-orange-500"
              : "text-orange-400"
            : "text-mist/60"
        }`}
      />
      {active ? `${streak.days}일 연속` : "오늘 첫 기록을 남겨요"}
    </div>
  );
}
