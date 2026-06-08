// LUXIA (Saltlux) Chat API 호출 — 서버 전용.
// 클라이언트 컴포넌트에서 import 하지 말 것 (LUXIA_API_KEY 노출 방지).

const LUXIA_URL = "https://bridge.luxiacloud.com/luxia/v1/chat";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** 다양한 응답 형태에서 어시스턴트 텍스트를 방어적으로 추출 */
function extractText(data: any): string {
  const cand =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.message?.content ??
    data?.data?.content ??
    data?.data?.message?.content ??
    data?.content ??
    data?.answer ??
    data?.result ??
    (typeof data === "string" ? data : "");
  return typeof cand === "string" ? cand : JSON.stringify(cand ?? "");
}

export async function luxiaChat(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<string> {
  const apikey = process.env.LUXIA_API_KEY;
  const model = process.env.LUXIA_MODEL || "luxia3-llm-8b-0731";
  if (!apikey) throw new Error("LUXIA_API_KEY가 설정되지 않았어요 (.env.local 확인).");

  const res = await fetch(LUXIA_URL, {
    method: "POST",
    headers: {
      apikey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    }),
    // 분석은 즉시성보다 안정성 — 너무 오래 걸리면 끊기게
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LUXIA 오류 ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json().catch(() => null);
  return extractText(data);
}
