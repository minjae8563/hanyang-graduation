"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import { computeStreak, toDaySet, type Streak } from "@/lib/streak";
import { StreakCalendar } from "@/components/streak-calendar";
import { Flame } from "lucide-react";

/** 메인 화면 헤더의 🔥 연속 기록일. 누르면 기록 달력이 열린다. */
export function StreakBadge({ refreshKey = 0 }: { refreshKey?: number }) {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [days, setDays] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      // 작성 시각만 가져온다 (본문 불필요). 달력의 과거 달까지 보여주기 위해 기간 제한 없음.
      const { data } = await supabase
        .from("entries")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (!data) return;
      const ts = data.map((r) => r.created_at as string);
      setStreak(computeStreak(ts));
      setDays(toDaySet(ts));
    })();
  }, [supabase, refreshKey]);

  if (!streak) return null;
  const active = streak.days > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fade-in flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition hover:shadow-soft ${
          active
            ? "bg-orange-50 text-orange-600 ring-orange-200"
            : "bg-white/60 text-mist ring-clay/40"
        }`}
        title={
          active && !streak.wroteToday
            ? "오늘 기록하면 연속 기록이 이어져요"
            : "기록 달력 보기"
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
      </button>
      {open && (
        <StreakCalendar days={days} currentStreak={streak.days} onClose={close} />
      )}
    </>
  );
}
