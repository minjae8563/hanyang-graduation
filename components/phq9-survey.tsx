"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import {
  PHQ9_INTERVAL_DAYS,
  PHQ9_INTRO,
  PHQ9_ITEMS,
  PHQ9_MAX,
  PHQ9_OPTIONS,
  PHQ9_RISK_INDEX,
  severityOf,
} from "@/lib/phq9";
import { CrisisResources } from "@/components/crisis-resources";
import { HeartPulse } from "lucide-react";

const EMPTY = Array<number>(PHQ9_ITEMS.length).fill(-1);

type Result = { total: number; risk: boolean };
type Schedule = { daysSince: number; daysLeft: number; nextDate: string };

function formatKDate(d: Date) {
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

// 직전 PHQ-9(= 그 주기의 첫날) 기준으로 경과/잔여/다음 날짜를 계산
function computeSchedule(lastIso: string): Schedule {
  const lastMs = new Date(lastIso).getTime();
  const daysSince = Math.max(0, Math.floor((Date.now() - lastMs) / 86_400_000));
  const daysLeft = Math.max(0, PHQ9_INTERVAL_DAYS - daysSince);
  const nextDate = formatKDate(
    new Date(lastMs + PHQ9_INTERVAL_DAYS * 86_400_000)
  );
  return { daysSince, daysLeft, nextDate };
}

export function Phq9Survey({ onSubmitted }: { onSubmitted?: () => void }) {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const [loading, setLoading] = useState(true);
  const [isBaseline, setIsBaseline] = useState(true);
  const [due, setDue] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [answers, setAnswers] = useState<number[]>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function ensureSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) await supabase.auth.signInAnonymously();
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      await ensureSession();
      const { data } = await supabase
        .from("phq9_responses")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      const last = data?.[0]?.created_at as string | undefined;
      if (!last) {
        setIsBaseline(true);
        setDue(true);
      } else {
        setIsBaseline(false);
        const sched = computeSchedule(last);
        if (sched.daysSince >= PHQ9_INTERVAL_DAYS) {
          setDue(true);
        } else {
          setDue(false);
          setSchedule(sched);
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answeredCount = answers.filter((a) => a >= 0).length;
  const allAnswered = answeredCount === PHQ9_ITEMS.length;

  async function handleSubmit() {
    if (!supabase || !allAnswered || submitting) return;
    setSubmitting(true);
    await ensureSession();
    const total = answers.reduce((a, b) => a + b, 0);
    const { error } = await supabase
      .from("phq9_responses")
      .insert({ scores: answers, total });
    setSubmitting(false);
    if (error) {
      alert("설문 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setResult({ total, risk: answers[PHQ9_RISK_INDEX] > 0 });
    setSchedule(computeSchedule(new Date().toISOString()));
    setDue(false);
    setAnswers(EMPTY);
    onSubmitted?.();
  }

  if (!SUPABASE_READY || loading) return null;

  // ── 결과 ──
  if (result) {
    const sev = severityOf(result.total);
    const pct = Math.round((result.total / PHQ9_MAX) * 100);
    return (
      <section className="mb-5 rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-sage-500" />
          <h2 className="text-sm font-medium text-dusk">마음 점검 결과</h2>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <span className="text-3xl font-semibold text-dusk">
            {result.total}
            <span className="ml-1 text-base font-normal text-mist">
              / {PHQ9_MAX}
            </span>
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium text-white ${sev.colorClass}`}
          >
            {sev.label}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className={`h-full rounded-full ${sev.colorClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-dusk">{sev.message}</p>

        {result.risk && (
          <div className="mt-4">
            <CrisisResources />
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-mist">
          이 결과는 선별 도구(PHQ-9)에 기반한 참고용이며, 의료적 진단이 아니에요.
          걱정된다면 전문가와 상담해 보세요.
        </p>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setResult(null)}
            className="rounded-full bg-sage-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-sage-700"
          >
            확인
          </button>
        </div>
      </section>
    );
  }

  // ── 아직 받을 때 아님: 일정 안내 카드 ──
  if (!due) {
    if (!schedule) return null;
    const pct = Math.round((schedule.daysSince / PHQ9_INTERVAL_DAYS) * 100);
    return (
      <section className="mb-5 rounded-2xl bg-white/60 p-4 ring-1 ring-clay/30">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-sage-500" />
          <h2 className="text-sm font-medium text-dusk">마음 점검 일정</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-dusk">
          {schedule.daysSince === 0
            ? "오늘 마음 점검을 마쳤어요. "
            : `지난 점검 후 ${schedule.daysSince}일이 지났어요. `}
          PHQ-9는 <b className="font-semibold">14일에 한 번</b> 받아요. 다음
          점검은 <b className="font-semibold">{schedule.nextDate}</b>에 받을
          예정이에요.
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-mist">
          <span>14일 중 {schedule.daysSince}일 지남</span>
          <span>{schedule.daysLeft}일 남음</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-sage-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>
    );
  }

  // ── 설문 (due일 때 항상 펼침) ──
  return (
    <section className="mb-5 rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-medium text-dusk">
          {isBaseline ? "시작 마음 점검" : "2주 마음 점검"}
        </h2>
        <span className="text-xs text-mist">
          {answeredCount} / {PHQ9_ITEMS.length}
        </span>
      </div>
      <p className="mb-3 text-xs text-sage-700">
        {isBaseline
          ? "오늘 받고, 14일 뒤에 한 번 더 받아요"
          : "예정된 2주 점검이에요"}
      </p>
      <p className="mb-4 text-[13px] leading-relaxed text-mist">{PHQ9_INTRO}</p>

      <ol className="space-y-5">
        {PHQ9_ITEMS.map((item, qi) => (
          <li key={qi}>
            <p className="mb-2 text-[14px] leading-relaxed text-dusk">
              <span className="mr-1 text-mist">{qi + 1}.</span>
              {item}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {PHQ9_OPTIONS.map((opt) => {
                const selected = answers[qi] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = opt.value;
                        return next;
                      })
                    }
                    className={`rounded-xl px-1.5 py-2 text-[11px] leading-tight transition ${
                      selected
                        ? "bg-sage-600 text-white shadow-sm"
                        : "bg-sand/60 text-dusk hover:bg-sand"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="rounded-full bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-clay disabled:text-mist"
        >
          {submitting ? "제출 중…" : "제출하기"}
        </button>
      </div>
    </section>
  );
}
