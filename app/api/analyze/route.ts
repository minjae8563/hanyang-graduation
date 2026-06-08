import { NextResponse } from "next/server";
import { luxiaChat } from "@/lib/llm";
import { DEFAULT_ANALYSIS, parseAnalysis } from "@/lib/analysis";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `당신은 한국어 일기를 분석하는 따뜻하고 신중한 심리 보조자입니다.
사용자의 일기를 읽고 아래 JSON 형식의 객체 "하나만" 출력하세요. 코드블록, 설명, 인사말 없이 JSON만 출력합니다.

형식:
{
  "sentiment": -1.0~1.0 사이 숫자 (전반적 정서: 부정<0, 긍정>0),
  "symptom_scores": {
    "interest": 0-3, "mood": 0-3, "sleep": 0-3, "energy": 0-3,
    "appetite": 0-3, "selfworth": 0-3, "concentration": 0-3,
    "psychomotor": 0-3, "suicidal": 0-3
  },
  "activities": ["글에 언급된 활동"],
  "risk_level": "none" | "low" | "medium" | "high",
  "feedback_message": "공감적이고 따뜻한 한국어 2~3문장"
}

규칙:
- symptom_scores는 PHQ-9 9개 영역을, 글의 언어적 단서를 근거로 0(전혀 없음)~3(매우 뚜렷)으로 추정합니다.
- interest=흥미상실, mood=우울감, sleep=수면문제, energy=피로, appetite=식욕변화, selfworth=자기비하/죄책감, concentration=집중저하, psychomotor=초조하거나 느려짐, suicidal=자해·자살 생각.
- activities는 기분에 영향을 준 활동 위주로(없으면 빈 배열 []).
- 자해·자살·"죽고 싶다" 등의 신호가 있으면 suicidal>=1, risk_level은 "medium" 이상으로.
- feedback_message는 진단이나 단정을 하지 말고, 비난 없이 곁에 있어주는 말투로. 힘든 신호가 보이면 도움을 권유하세요.
- 반드시 유효한 JSON만 출력합니다.`;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "분석할 텍스트가 없어요." }, { status: 400 });
    }

    const content = await luxiaChat(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `다음 일기를 분석해 JSON으로만 답하세요.\n\n일기:\n"""\n${text.slice(0, 4000)}\n"""`,
        },
      ],
      { temperature: 0.3 }
    );

    if (process.env.NODE_ENV !== "production") {
      console.log("[analyze] LUXIA raw:", String(content).slice(0, 800));
    }

    const analysis = parseAnalysis(content);
    return NextResponse.json({ analysis });
  } catch (e) {
    const message = e instanceof Error ? e.message : "분석에 실패했어요.";
    console.error("[analyze] error:", message);
    // 실패해도 기본 분석을 돌려줘 기록 자체는 지장 없게
    return NextResponse.json({ analysis: DEFAULT_ANALYSIS, error: message }, { status: 200 });
  }
}
