"use client";

import { useState } from "react";
import { CHECKIN_ITEMS, SCORE_COLORS, type CheckinKey } from "@/lib/checkin";
import { PHQ9_MAX, severityOf } from "@/lib/phq9";
import {
  ClipboardList,
  Feather,
  HeartPulse,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

// 랜딩 페이지용 체험 데모. 실제 저장·분석 호출 없이 예시 데이터만 보여준다.

type Tab = "record" | "checkin" | "phq9";

const TABS: { key: Tab; label: string; icon: typeof Feather }[] = [
  { key: "record", label: "마음 기록", icon: Feather },
  { key: "checkin", label: "오늘의 체크인", icon: ClipboardList },
  { key: "phq9", label: "마음 점검", icon: HeartPulse },
];

const SAMPLES = [
  {
    label: "바빴던 하루",
    text: "과제 마감이 겹쳐서 하루 종일 정신이 없었다. 그래도 저녁에 친구랑 잠깐 산책하면서 이야기하니까 조금 숨이 트였다.",
    mood: { label: "잔잔한 결", dot: "bg-clay" },
    reply:
      "마감이 겹친 하루를 끝까지 버텨낸 것만으로도 충분히 애쓰셨어요. 친구와의 산책처럼 숨을 고를 수 있는 순간을 만든 것도 잘한 일이에요. 오늘 밤은 조금 일찍 쉬어보면 어떨까요?",
    tags: ["산책", "친구와 대화"],
  },
  {
    label: "기분 좋은 날",
    text: "오랜만에 아침 일찍 일어나서 운동을 했다. 개운해서 그런지 수업도 집중이 잘 됐고, 점심도 맛있게 먹었다.",
    mood: { label: "밝은 결", dot: "bg-sage-500" },
    reply:
      "아침 운동으로 시작한 하루가 수업과 식사까지 기분 좋게 이어졌네요. 몸을 움직인 게 마음에도 좋은 영향을 준 것 같아요. 이 느낌을 기억해 두었다가 지칠 때 다시 꺼내 써봐요.",
    tags: ["운동", "규칙적인 기상"],
  },
  {
    label: "가라앉은 날",
    text: "별일 없었는데 이유 없이 기운이 없다. 해야 할 일은 많은데 손에 잘 안 잡히고 계속 누워만 있었다.",
    mood: { label: "무거운 결", dot: "bg-orange-500" },
    reply:
      "이유를 알 수 없이 가라앉는 날도 있어요. 그런 날 스스로를 다그치기보다, 오늘처럼 마음을 적어본 것 자체가 작은 한 걸음이에요. 따뜻한 물 한 잔이나 짧은 바깥 공기처럼 아주 작은 것부터 해봐요.",
    tags: ["휴식"],
  },
];

export function LandingDemo() {
  const [tab, setTab] = useState<Tab>("record");

  return (
    <div className="rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40">
      <div className="flex gap-1 rounded-full bg-sand/70 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium transition sm:text-sm ${
              tab === key
                ? "bg-white text-dusk shadow-sm"
                : "text-mist hover:text-dusk"
            }`}
          >
            <Icon className="hidden h-3.5 w-3.5 sm:block" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "record" && <RecordDemo />}
        {tab === "checkin" && <CheckinDemo />}
        {tab === "phq9" && <Phq9Demo />}
      </div>
    </div>
  );
}

function RecordDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "analyzing" | "done">("idle");
  const sample = SAMPLES[idx];

  function pick(i: number) {
    setIdx(i);
    setPhase("idle");
  }

  function save() {
    setPhase("analyzing");
    setTimeout(() => setPhase("done"), 1200);
  }

  return (
    <div>
      <p className="text-xs text-mist">예시 기록을 골라보세요</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SAMPLES.map((s, i) => (
          <button
            key={s.label}
            onClick={() => pick(i)}
            className={`rounded-full px-3.5 py-1.5 text-xs transition ${
              i === idx
                ? "bg-sage-600 text-white"
                : "bg-sand/70 text-mist hover:bg-sand"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-sand/60 p-4 text-[15px] leading-relaxed text-dusk">
        {sample.text}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={save}
          disabled={phase !== "idle"}
          className="rounded-full bg-sage-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700 disabled:cursor-default disabled:bg-clay disabled:text-mist"
        >
          {phase === "idle" ? "기록 담기" : "담았어요"}
        </button>
      </div>

      {phase === "analyzing" && (
        <div className="fade-in mt-4 flex items-center justify-center gap-2 rounded-2xl bg-sage-50 py-3 text-sm text-sage-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          마음을 살펴보는 중이에요…
        </div>
      )}

      {phase === "done" && (
        <div className="fade-in mt-4 rounded-2xl bg-white/90 p-4 ring-1 ring-clay/40">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-dusk">
              <Sparkles className="h-4 w-4 text-sage-500" />
              마음로그의 한마디
            </span>
            <span className="flex items-center gap-1.5 text-xs text-mist">
              <span className={`h-2.5 w-2.5 rounded-full ${sample.mood.dot}`} />
              {sample.mood.label}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-dusk">
            {sample.reply}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sample.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-sage-50 px-2.5 py-1 text-[11px] text-sage-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckinDemo() {
  const [answers, setAnswers] = useState<Partial<Record<CheckinKey, number>>>(
    {}
  );
  const done = CHECKIN_ITEMS.every((i) => answers[i.key] !== undefined);

  return (
    <div>
      <div className="space-y-4">
        {CHECKIN_ITEMS.map((item) => (
          <div key={item.key}>
            <p className="text-sm text-dusk">{item.question}</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {item.options.map((opt, v) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [item.key]: v }))}
                  className={`rounded-full px-1 py-2 text-[11px] transition sm:text-xs ${
                    answers[item.key] === v
                      ? "bg-sage-600 text-white"
                      : "bg-sand/70 text-mist hover:bg-sand"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {done && (
        <div className="fade-in mt-5 flex items-center justify-between rounded-2xl bg-sage-50 px-4 py-3">
          <div className="flex items-center gap-3">
            {CHECKIN_ITEMS.map((item) => (
              <span key={item.key} className="flex flex-col items-center gap-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    SCORE_COLORS[answers[item.key] ?? 0]
                  }`}
                />
                <span className="text-[10px] text-mist">{item.label}</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => setAnswers({})}
            className="flex items-center gap-1 text-xs text-sage-700"
          >
            <RotateCcw className="h-3 w-3" />
            다시
          </button>
        </div>
      )}
      {done && (
        <p className="mt-2 text-xs text-mist">
          실제 서비스에서는 하루 한 번 저장되고, 날마다 쌓여 흐름을 보여줘요.
        </p>
      )}
    </div>
  );
}

// 예시: 2주 간격 세 번의 점검 결과
const PHQ9_HISTORY = [
  { label: "첫 점검", total: 12 },
  { label: "2주 후", total: 9 },
  { label: "4주 후", total: 6 },
];

function Phq9Demo() {
  const latest = PHQ9_HISTORY[PHQ9_HISTORY.length - 1];
  const sev = severityOf(latest.total);

  return (
    <div>
      <p className="text-sm leading-relaxed text-mist">
        지난 2주를 돌아보는 9문항 설문이에요. 처음 한 번 답하고, 이후 2주마다
        다시 답하면 변화를 비교할 수 있어요.
      </p>

      <div className="mt-4 rounded-2xl bg-white/90 p-4 ring-1 ring-clay/40">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold text-dusk">
            {latest.total}
            <span className="ml-1 text-sm font-normal text-mist">
              / {PHQ9_MAX}
            </span>
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium text-white ${sev.colorClass}`}
          >
            {sev.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-mist">{sev.message}</p>

        <div className="mt-5 space-y-2.5">
          {PHQ9_HISTORY.map((h) => {
            const s = severityOf(h.total);
            return (
              <div key={h.label} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs text-mist">
                  {h.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className={`h-full rounded-full ${s.colorClass}`}
                    style={{ width: `${(h.total / PHQ9_MAX) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-dusk">
                  {h.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-mist">
        예시 수치예요. 결과는 진단이 아니라 스스로를 돌아보는 참고용이에요.
      </p>
    </div>
  );
}
