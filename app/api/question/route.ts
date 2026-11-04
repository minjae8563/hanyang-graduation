import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { luxiaChat } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// 질문 소재로 삼을 최근 일기 수 / 거슬러 볼 기간
const RECENT_LIMIT = 5;
const LOOKBACK_DAYS = 14;

const SYSTEM = `당신은 사용자의 일기 쓰기를 돕는 따뜻한 동반자입니다.
사용자의 최근 일기를 읽고, 그중 구체적인 사건이나 경험 하나를 골라 오늘 일기를 쓰도록 이끄는 후속 질문을 "딱 하나" 만드세요.

규칙:
- 한국어 존댓말(해요체), 한 문장, 60자 이내.
- 지난 일기 속 구체적인 내용을 자연스럽게 언급하세요. 예: "지난번에 몸이 좋지 않다고 하셨는데, 지금은 좀 괜찮아지셨나요?"
- 진단·평가·조언을 하지 말고, 부담 없이 답할 수 있게 열린 질문으로.
- 자해·자살·폭력 등 민감하고 위험한 주제는 절대 언급하지 마세요.
- 따옴표, 설명, 인사말 없이 질문 문장만 출력하세요.`;

type Row = {
  content: string;
  created_at: string;
  risk_level: string | null;
  symptom_scores: { suicidal?: number } | null;
};

function cleanQuestion(raw: string): string | null {
  const line = String(raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s.length > 0);
  if (!line) return null;
  const q = line.replace(/^["'“”‘’\-\s]+|["'“”‘’\s]+$/g, "").trim();
  if (q.length < 5 || q.length > 120) return null;
  if (q.startsWith("{") || q.includes("죽") || q.includes("자해")) return null;
  return q;
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ question: null });

    const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
    const { data } = await supabase
      .from("entries")
      .select("content, created_at, risk_level, symptom_scores")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT * 2);

    // 위험 신호가 있던 일기는 질문 소재에서 제외 (위기 내용을 다시 꺼내지 않기 위해)
    const safe = ((data as Row[]) ?? [])
      .filter(
        (r) =>
          r.risk_level !== "medium" &&
          r.risk_level !== "high" &&
          !(r.symptom_scores?.suicidal && r.symptom_scores.suicidal > 0)
      )
      .slice(0, RECENT_LIMIT);

    if (safe.length === 0) return NextResponse.json({ question: null });

    const diaries = safe
      .map((r) => {
        const d = new Date(r.created_at).toLocaleDateString("ko-KR", {
          timeZone: "Asia/Seoul",
          month: "long",
          day: "numeric",
        });
        return `[${d}] ${r.content.slice(0, 600)}`;
      })
      .join("\n\n");

    const content = await luxiaChat(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `최근 일기:\n"""\n${diaries}\n"""\n\n후속 질문 한 문장:` },
      ],
      { temperature: 0.7 }
    );

    return NextResponse.json({ question: cleanQuestion(content) });
  } catch (e) {
    console.error("[question] error:", e instanceof Error ? e.message : e);
    // 실패하면 클라이언트가 기본 문구를 그대로 사용
    return NextResponse.json({ question: null });
  }
}
