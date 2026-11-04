"use client";

import { useEffect, useMemo, useState } from "react";
import { localDateString } from "@/lib/checkin";
import { longestStreak } from "@/lib/streak";
import { ChevronLeft, ChevronRight, Flame, X } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type Props = {
  days: Set<string>; // 일기를 쓴 날짜 'YYYY-MM-DD'
  currentStreak: number;
  onClose: () => void;
};

/** 일기 작성 달력 — 쓴 날은 채워진 원, 안 쓴 날은 빈칸으로 표시 */
export function StreakCalendar({ days, currentStreak, onClose }: Props) {
  const now = new Date();
  const today = localDateString(now);
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );

  // ESC로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const list: (string | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= lastDate; d++) {
      list.push(localDateString(new Date(year, month, d)));
    }
    return list;
  }, [year, month]);

  const monthCount = cells.filter((c) => c && days.has(c)).length;
  const best = useMemo(() => longestStreak(days), [days]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-dusk/30 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="일기 작성 달력"
    >
      <div
        className="fade-in w-full max-w-md rounded-t-3xl bg-cream p-5 pb-8 shadow-soft sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-dusk">
            <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
            나의 기록 달력
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-mist transition hover:bg-sand hover:text-dusk"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 요약 */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "현재 연속", value: `${currentStreak}일` },
            { label: "최장 연속", value: `${best}일` },
            { label: `${month + 1}월 기록`, value: `${monthCount}일` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/70 py-2.5 ring-1 ring-clay/30">
              <p className="text-[11px] text-mist">{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold text-dusk">{s.value}</p>
            </div>
          ))}
        </div>

        {/* 월 이동 */}
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-full p-1.5 text-mist transition hover:bg-sand hover:text-dusk"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-medium text-dusk">
            {year}년 {month + 1}월
          </p>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            disabled={isCurrentMonth}
            className="rounded-full p-1.5 text-mist transition hover:bg-sand hover:text-dusk disabled:invisible"
            aria-label="다음 달"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* 달력 */}
        <div className="mt-2 grid grid-cols-7 gap-y-1.5 text-center">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={`pb-1 text-[11px] ${i === 0 ? "text-orange-400" : "text-mist"}`}
            >
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`blank-${i}`} />;
            const wrote = days.has(d);
            const isToday = d === today;
            const future = d > today;
            const dayNum = Number(d.slice(8));
            return (
              <div key={d} className="flex justify-center">
                <span
                  title={wrote ? "기록함" : future ? undefined : "기록 없음"}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                    wrote
                      ? "bg-sage-500 font-medium text-white"
                      : future
                      ? "text-mist/40"
                      : "text-mist"
                  } ${isToday ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-cream" : ""}`}
                >
                  {dayNum}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-mist">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sage-500" />
            기록한 날
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-1 ring-clay" />
            기록 없는 날
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-2 ring-orange-400" />
            오늘
          </span>
        </div>
      </div>
    </div>
  );
}
