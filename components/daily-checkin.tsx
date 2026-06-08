"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_READY } from "@/lib/supabase/env";
import {
  CHECKIN_ITEMS,
  CHECKIN_KEYS,
  SCORE_COLORS,
  localDateString,
  sumScores,
  type CheckinKey,
  type CheckinScores,
} from "@/lib/checkin";
import { Check, ClipboardList, Pencil } from "lucide-react";

export function DailyCheckin({ onSaved }: { onSaved?: () => void }) {
  const supabase = useMemo(() => (SUPABASE_READY ? createClient() : null), []);
  const today = useMemo(() => localDateString(), []);
  const [answers, setAnswers] = useState<Partial<CheckinScores>>({});
  const [saved, setSaved] = useState<CheckinScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

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
        .from("daily_checkins")
        .select("scores")
        .eq("checkin_date", today)
        .maybeSingle();
      if (data?.scores) {
        setSaved(data.scores as CheckinScores);
        setEditing(false);
      } else {
        setEditing(true);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allAnswered = CHECKIN_KEYS.every((k) => answers[k] !== undefined);

  async function handleSave() {
    if (!supabase || !allAnswered || saving) return;
    setSaving(true);
    await ensureSession();
    const scores = answers as CheckinScores;
    const { error } = await supabase
      .from("daily_checkins")
      .upsert(
        { checkin_date: today, scores, total: sumScores(scores) },
        { onConflict: "user_id,checkin_date" }
      );
    setSaving(false);
    if (error) {
      alert("체크인 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setSaved(scores);
    setEditing(false);
    onSaved?.();
  }

  function startEdit() {
    setAnswers(saved ?? {});
    setEditing(true);
  }

  if (!SUPABASE_READY || loading) return null;

  // 완료 상태 — 접힌 요약
  if (!editing && saved) {
    return (
      <section className="mb-5 flex items-center justify-between rounded-2xl bg-sage-50 px-4 py-3 ring-1 ring-sage-100">
        <div className="flex items-center gap-3">
          <Check className="h-4 w-4 text-sage-600" />
          <span className="text-sm text-sage-700">오늘 체크인 완료</span>
          <span className="flex items-center gap-1.5">
            {CHECKIN_KEYS.map((k) => (
              <span
                key={k}
                className={`h-2.5 w-2.5 rounded-full ${
                  SCORE_COLORS[saved[k]] ?? "bg-clay"
                }`}
                title={`${k}: ${saved[k]}`}
              />
            ))}
          </span>
        </div>
        <button
          onClick={startEdit}
          className="flex items-center gap-1 text-xs text-mist transition hover:text-dusk"
        >
          <Pencil className="h-3 w-3" />
          수정
        </button>
      </section>
    );
  }

  // 입력 상태
  return (
    <section className="mb-5 rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-sage-500" />
        <h2 className="text-sm font-medium text-dusk">오늘의 체크인</h2>
        <span className="text-xs text-mist">· 오늘 하루를 가볍게 짚어봐요</span>
      </div>

      <div className="space-y-4">
        {CHECKIN_ITEMS.map((item) => (
          <div key={item.key}>
            <p className="mb-2 text-[13px] text-mist">{item.question}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {item.options.map((opt, idx) => {
                const selected = answers[item.key] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [item.key as CheckinKey]: idx }))
                    }
                    className={`rounded-xl px-2 py-2 text-xs transition ${
                      selected
                        ? "bg-sage-600 text-white shadow-sm"
                        : "bg-sand/60 text-dusk hover:bg-sand"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && (
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-mist transition hover:text-dusk"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!allAnswered || saving}
          className="rounded-full bg-sage-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-clay disabled:text-mist"
        >
          {saving ? "저장 중…" : "체크인 저장"}
        </button>
      </div>
    </section>
  );
}
