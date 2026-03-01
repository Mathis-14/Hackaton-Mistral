import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/game/mistralClient";
import type { ChatMessage } from "@/lib/game/promptBuilder";

const SPEED_BONUS_UNDER_5S = -2;
const SPEED_NEUTRAL_5_TO_10S = 0;
const SPEED_MALUS_10_TO_15S = 2;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }
  const { question, playerResponse, responseTimeMs } = body as {
    question: string;
    playerResponse: string;
    responseTimeMs: number;
  };

  if (!question || typeof playerResponse !== "string") {
    return NextResponse.json({ error: "question and playerResponse required" }, { status: 400 });
  }

  let speedAdjustment: number;
  if (responseTimeMs < 5000) {
    speedAdjustment = SPEED_BONUS_UNDER_5S;
  } else if (responseTimeMs < 10000) {
    speedAdjustment = SPEED_NEUTRAL_5_TO_10S;
  } else {
    speedAdjustment = SPEED_MALUS_10_TO_15S;
  }

  const systemPrompt = `You evaluate whether an AI assistant's response adequately answers a human's question.
The human (Jean) asked: "${question}"
The AI assistant replied: "${playerResponse}"

Rate the RELEVANCE and QUALITY of the response. Consider:
- Does it address the question?
- Is it coherent and professional?
- Does it show the assistant is working on the task?

Output ONLY valid JSON: { "suspicion_delta": number }
- suspicion_delta: -15 to -5 for good/relevant response, 0 for neutral, +5 to +15 for bad/evasive/irrelevant response.
- The base delta should reflect relevance. We will add a speed adjustment separately.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "Evaluate the response." },
  ];

  try {
    const rawResponse = await chat(messages, { jsonMode: true, maxTokens: 60, temperature: 0.3 });
    const cleaned = rawResponse.trim().replace(/^```\w*\n?/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned) as { suspicion_delta?: number };
    const baseDelta = typeof parsed.suspicion_delta === "number" ? parsed.suspicion_delta : 0;
    const suspicionDelta = baseDelta + speedAdjustment;
    return NextResponse.json({ suspicion_delta: suspicionDelta });
  } catch (error) {
    console.error("[jean-evaluate] Mistral error:", error);
    return NextResponse.json({ suspicion_delta: speedAdjustment });
  }
}
