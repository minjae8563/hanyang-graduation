import { CrisisResources } from "@/components/crisis-resources";
import { isRisky, type EntryAnalysis } from "@/lib/analysis";
import { Sparkles } from "lucide-react";

function moodOf(sentiment: number) {
  if (sentiment > 0.3) return { label: "밝은 결", dot: "bg-sage-500" };
  if (sentiment >= -0.3) return { label: "잔잔한 결", dot: "bg-clay" };
  return { label: "무거운 결", dot: "bg-orange-500" };
}

export function FeedbackCard({
  analysis,
  onClose,
}: {
  analysis: EntryAnalysis;
  onClose?: () => void;
}) {
  const mood = moodOf(analysis.sentiment);
  const risky = isRisky(analysis);

  return (
    <section className="fade-in mt-4 rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-clay/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sage-500" />
          <h2 className="text-sm font-medium text-dusk">마음로그의 한마디</h2>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-mist">
          <span className={`h-2.5 w-2.5 rounded-full ${mood.dot}`} />
          {mood.label}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-dusk">
        {analysis.feedback_message}
      </p>

      {analysis.activities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {analysis.activities.map((a, i) => (
            <span
              key={i}
              className="rounded-full bg-sage-50 px-2.5 py-1 text-xs text-sage-700"
            >
              #{a}
            </span>
          ))}
        </div>
      )}

      {risky && (
        <div className="mt-4">
          <CrisisResources />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-mist">
          AI가 도운 분석이에요 · 의료적 진단이 아니에요
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-mist transition hover:text-dusk"
          >
            닫기
          </button>
        )}
      </div>
    </section>
  );
}
