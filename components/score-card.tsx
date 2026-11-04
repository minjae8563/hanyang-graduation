"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import { toWellbeingScore } from "@/lib/score";
import { ChevronRight, HeartPulse } from "lucide-react";

type Prediction = { predicted_total: number; created_at: string };

function barColor(score: number) {
  if (score >= 70) return "bg-sage-500";
  if (score >= 45) return "bg-amber-400";
  return "bg-orange-500";
}

/** 최신 PHQ-9 예측(predictions)을 0~100 마음 점수로 보여준다. */
export function ScoreCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const [pred, setPred] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from("predictions")
        .select("predicted_total, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPred((data as Prediction) ?? null);
      setLoading(false);
    })();
  }, [supabase, refreshKey]);

  if (loading) return null;

  return (
    <Link
      href="/app/score"
      className="fade-in mb-6 block rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40 transition hover:ring-sage-300"
    >
      <div className="flex items-center justify-between text-sm text-mist">
        <span className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-sage-500" />
          나의 마음 점수
        </span>
        <span className="flex items-center text-xs">
          변화 보기
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>

      {pred ? (
        (() => {
          const score = toWellbeingScore(pred.predicted_total);
          return (
            <>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-4xl font-semibold tracking-tight text-dusk">
                  {score}
                </span>
                <span className="mb-1 text-sm text-mist">/ 100</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className={`h-full rounded-full transition-all ${barColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-mist">
                100점에 가까울수록 마음이 편안한 상태예요 ·{" "}
                {new Date(pred.created_at).toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                })}{" "}
                기준
              </p>
            </>
          );
        })()
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-mist">
          아직 마음 점수가 없어요. 일기를 꾸준히 쓰면 기록을 바탕으로 점수를
          알려드릴게요.
        </p>
      )}
    </Link>
  );
}
