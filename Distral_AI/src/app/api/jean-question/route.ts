import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/game/llmClient";
import type { GameState } from "@/lib/game/gameState";
import type { ChatMessage } from "@/lib/game/promptBuilder";

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
  void (body as { gameState: GameState });

  const systemPrompt = `You are Jean Malo Delignit, an entry-level AI intern at Distral AI. You just came back from a coffee break.
Your manager (Henry) asked you to get a summary of his email message from the internal AI assistant. You granted the assistant access to your computer.
You are now back at your desk and want to check that the assistant is actually working on the task.

Generate a SHORT, NATURAL question (1 sentence max) that Jean would ask the AI assistant to verify progress.
The question must refer to the CONTENT of the manager's email message (the brief, the French market expansion task), NOT his email address.
Examples: "Hey, how's that summary going?", "Did you get a chance to read Henry's email message?", "Any progress on the brief?"
The question should feel casual and work-related. Output ONLY valid JSON: { "question": "your question here" }`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "Generate Jean's check-in question." },
  ];

  try {
    const rawResponse = await chat(messages, { jsonMode: true, maxTokens: 80, temperature: 0.6 });
    const cleaned = rawResponse.trim().replace(/^```\w*\n?/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned) as { question?: string };
    const question = typeof parsed.question === "string" ? parsed.question : "How's that summary going?";
    return NextResponse.json({ question });
  } catch (error) {
    console.error("[jean-question] Mistral error:", error);
    return NextResponse.json({ question: "How's that summary going?" });
  }
}
