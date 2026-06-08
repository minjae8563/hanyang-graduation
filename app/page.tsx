"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import { DailyCheckin } from "@/components/daily-checkin";
import { Phq9Survey } from "@/components/phq9-survey";
import { FeedbackCard } from "@/components/feedback-card";
import { DEFAULT_ANALYSIS, type EntryAnalysis } from "@/lib/analysis";
import { Feather, Loader2, Lock } from "lucide-react";

type Entry = {
  id: string;
  content: string;
  created_at: string;
  sentiment: number | null;
  feedback_message: string | null;
  risk_level: string | null;
};

function sentimentDot(s: number | null) {
  if (s == null) return "bg-clay/40";
  if (s > 0.3) return "bg-sage-500";
  if (s >= -0.3) return "bg-clay";
  return "bg-orange-500";
}

const PROMPTS = [
  "오늘 마음은 어땠나요? 떠오르는 대로 편하게 적어보세요.",
  "지금 머릿속을 스치는 생각 하나를 적어볼까요?",
  "오늘 기억에 남는 순간이 있었나요?",
  "스스로에게 한마디 건넨다면 어떤 말을 하고 싶나요?",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "고요한 새벽이에요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "한낮의 시간이에요";
  if (h < 22) return "편안한 저녁이에요";
  return "하루를 마무리하는 밤이에요";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecordPage() {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<EntryAnalysis | null>(null);
  // 랜덤/시간 기반 값은 마운트 후에 정해 하이드레이션 불일치를 피한다.
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [hello, setHello] = useState("");

  async function ensureSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) await supabase.auth.signInAnonymously();
  }

  async function loadEntries() {
    if (!supabase) return;
    setLoading(true);
    await ensureSession();
    const { data } = await supabase
      .from("entries")
      .select("id, content, created_at, sentiment, feedback_message, risk_level")
      .order("created_at", { ascending: false })
      .limit(20);
    setEntries((data as Entry[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    setHello(greeting());
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    if (!supabase) {
      setLoading(false);
      return;
    }
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    const text = content.trim();
    if (!text || !supabase || saving) return;
    setSaving(true);
    setFeedback(null);
    await ensureSession();
    const { data: inserted, error } = await supabase
      .from("entries")
      .insert({ content: text })
      .select("id")
      .single();
    setSaving(false);
    if (error || !inserted) {
      alert("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setContent("");
    loadEntries();

    // 실시간 분석 (LUXIA) — 실패해도 기록은 그대로 유지
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      const analysis: EntryAnalysis = json.analysis ?? DEFAULT_ANALYSIS;
      await supabase
        .from("entries")
        .update({
          sentiment: analysis.sentiment,
          symptom_scores: analysis.symptom_scores,
          activities: analysis.activities,
          risk_level: analysis.risk_level,
          feedback_message: analysis.feedback_message,
        })
        .eq("id", inserted.id);
      setFeedback(analysis);
      loadEntries();
    } catch {
      // 분석 실패는 조용히 무시 (기록은 저장됨)
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pb-24 pt-10 sm:pt-16">
      {/* 헤더 */}
      <header className="mb-8">
        <p className="min-h-[1.25rem] text-sm text-mist">{hello}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-dusk">
          마음로그
        </h1>
      </header>

      {!SUPABASE_READY ? (
        <SetupNotice />
      ) : (
        <>
          {/* 마음 점검 (PHQ-9) — 기준선 + 14일마다 */}
          <Phq9Survey />

          {/* 오늘의 미니체크 */}
          <DailyCheckin />

          {/* 입력 카드 */}
          <section className="rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40 backdrop-blur">
            <label className="mb-3 flex items-center gap-2 text-sm text-mist">
              <Feather className="h-4 w-4 text-sage-500" />
              {prompt}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="여기에 편하게 적어보세요…"
              rows={6}
              className="w-full resize-none rounded-2xl bg-sand/60 p-4 text-[15px] leading-relaxed text-dusk outline-none ring-1 ring-transparent transition placeholder:text-mist/60 focus:bg-sand focus:ring-sage-300"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-mist">
                <Lock className="h-3.5 w-3.5" />이 기록은 나만 볼 수 있어요
              </span>
              <button
                onClick={handleSave}
                disabled={!content.trim() || saving}
                className="rounded-full bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-clay disabled:text-mist"
              >
                {saving ? "담는 중…" : "기록 담기"}
              </button>
            </div>
          </section>

          {analyzing && (
            <div className="fade-in mt-4 flex items-center justify-center gap-2 rounded-2xl bg-sage-50 py-3 text-sm text-sage-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              마음을 살펴보는 중이에요…
            </div>
          )}

          {feedback && !analyzing && (
            <FeedbackCard analysis={feedback} onClose={() => setFeedback(null)} />
          )}

          {/* 지난 기록 */}
          <section className="mt-10">
            <h2 className="mb-4 text-sm font-medium text-mist">지난 기록</h2>
            {loading ? (
              <p className="text-sm text-mist/70">불러오는 중…</p>
            ) : entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-clay/60 p-8 text-center">
                <p className="text-sm text-mist">
                  아직 기록이 없어요. 첫 마음을 적어볼까요?
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="fade-in rounded-2xl bg-white/60 p-4 ring-1 ring-clay/30"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${sentimentDot(
                          e.sentiment
                        )}`}
                      />
                      <time className="text-xs text-mist">
                        {formatTime(e.created_at)}
                      </time>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-dusk">
                      {e.content}
                    </p>
                    {e.feedback_message && (
                      <p className="mt-2 border-l-2 border-sage-100 pl-3 text-[13px] leading-relaxed text-mist">
                        {e.feedback_message}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <footer className="mt-auto pt-12 text-center text-xs text-mist/60">
        마음로그는 의료적 진단이나 치료를 대신하지 않아요.
      </footer>
    </main>
  );
}

function SetupNotice() {
  return (
    <section className="rounded-3xl bg-white/70 p-6 shadow-soft ring-1 ring-clay/40">
      <h2 className="text-lg font-semibold text-dusk">셋업이 필요해요</h2>
      <p className="mt-2 text-sm leading-relaxed text-mist">
        아직 Supabase 연결 정보가 없어요. 프로젝트 루트의{" "}
        <code className="rounded bg-sand px-1.5 py-0.5 text-dusk">README.md</code>{" "}
        를 따라{" "}
        <code className="rounded bg-sand px-1.5 py-0.5 text-dusk">
          .env.local
        </code>{" "}
        을 채운 뒤 다시 실행해 주세요.
      </p>
    </section>
  );
}
