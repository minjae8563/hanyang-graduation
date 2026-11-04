"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import {
  PREDICTION_WINDOW_DAYS,
  dailyScoreSeries,
  type ScorePoint,
} from "@/lib/prediction";
import { toWellbeingScore } from "@/lib/score";
import { ChevronLeft, HeartPulse } from "lucide-react";

const RANGES = [30, 90] as const;
type Range = (typeof RANGES)[number];

const LINE = "#5F8A55"; // sage-600
const INK_MUTED = "#6B6B7B"; // mist
const GRID = "#E0CDB6"; // clay

type Row = {
  created_at: string;
  symptom_scores: Record<string, number> | null;
  feedback_message: string | null;
};

function shortDate(d: string) {
  const [, m, day] = d.split("-").map(Number);
  return `${m}/${day}`;
}

function ScoreTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ScorePoint;
  if (p.score == null) return null;
  const [, m, d] = p.date.split("-").map(Number);
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-soft ring-1 ring-clay/50">
      <p className="text-mist">
        {m}월 {d}일
      </p>
      <p className="mt-0.5 text-sm font-semibold text-dusk">{p.score}점</p>
      <p className="mt-0.5 text-mist">최근 {PREDICTION_WINDOW_DAYS}일 일기 {p.n}개 기준</p>
    </div>
  );
}

export default function ScoreDetailPage() {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const [range, setRange] = useState<Range>(30);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) await supabase.auth.signInAnonymously();
      // 가장 긴 범위(90일) + 14일 창만큼 한 번에 가져온다
      const since = new Date();
      since.setDate(since.getDate() - (90 + PREDICTION_WINDOW_DAYS));
      const { data } = await supabase
        .from("entries")
        .select("created_at, symptom_scores, feedback_message")
        .gte("created_at", since.toISOString())
        .not("symptom_scores", "is", null)
        .order("created_at", { ascending: true })
        .limit(3000);
      setRows((data as Row[]) ?? []);
    })();
  }, [supabase]);

  const series = useMemo(
    () => (rows ? dailyScoreSeries(rows as any, range, toWellbeingScore) : []),
    [rows, range]
  );
  const valid = series.filter((p) => p.score != null) as (ScorePoint & { score: number })[];
  const latest = valid.at(-1);
  const first = valid[0];
  const delta = latest && first && valid.length > 1 ? latest.score - first.score : null;
  const tickEvery = range === 30 ? 6 : 14;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-24 pt-10 sm:pt-16">
      <header className="mb-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-sm text-mist transition hover:text-dusk"
        >
          <ChevronLeft className="h-4 w-4" />
          돌아가기
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-dusk">
          <HeartPulse className="h-6 w-6 text-sage-500" />
          마음 점수 변화
        </h1>
      </header>

      <section className="rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            {latest ? (
              <>
                <p className="text-xs text-mist">현재</p>
                <p className="mt-0.5 text-3xl font-semibold tracking-tight text-dusk">
                  {latest.score}
                  <span className="ml-1 text-sm font-normal text-mist">/ 100</span>
                </p>
                {delta != null && (
                  <p className="mt-1 text-xs text-mist">
                    이 기간 처음보다{" "}
                    <span className="font-medium text-dusk">
                      {delta > 0 ? `+${delta}` : delta === 0 ? "변화 없음" : delta}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-mist">기간</p>
            )}
          </div>
          <div className="flex rounded-full bg-sand p-1 text-xs">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 transition ${
                  range === r ? "bg-white font-medium text-dusk shadow-sm" : "text-mist"
                }`}
              >
                {r}일
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 h-56 w-full">
          {rows == null ? (
            <p className="pt-20 text-center text-sm text-mist/70">불러오는 중…</p>
          ) : valid.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-clay/60 px-6 text-center">
              <p className="text-sm leading-relaxed text-mist">
                이 기간에는 아직 점수가 없어요.
                <br />
                일기를 쓰면 날짜별 변화가 여기에 그려져요.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke={GRID} strokeOpacity={0.6} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  interval={tickEvery - 1}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: INK_MUTED }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ScoreTooltip />}
                  cursor={{ stroke: INK_MUTED, strokeOpacity: 0.3, strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={LINE}
                  strokeWidth={2}
                  dot={valid.length <= 3 ? { r: 4, fill: LINE, stroke: "#fff", strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: LINE, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-mist">
          100점에 가까울수록 마음이 편안한 상태예요. 각 날짜의 점수는 그날까지
          최근 {PREDICTION_WINDOW_DAYS}일 동안 쓴 일기를 바탕으로 계산돼요. 일기가
          없던 기간은 선이 끊겨 보여요.
        </p>
      </section>

      <footer className="mt-auto pt-12 text-center text-xs text-mist/60">
        마음로그는 의료적 진단이나 치료를 대신하지 않아요.
      </footer>
    </main>
  );
}
