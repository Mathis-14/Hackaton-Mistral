import { NextRequest, NextResponse } from "next/server";
import { getNpc } from "@/lib/game/npcDefinitions";
import { buildMessagesForWhatsApp, buildGenericWhatsAppPrompt, buildUnknownWhatsAppPrompt } from "@/lib/game/promptBuilder";
import { chat } from "@/lib/game/mistralClient";
import type { GameState } from "@/lib/game/gameState";
import type { ChatMessage } from "@/lib/game/promptBuilder";

const CONTACT_TO_NPC: Record<string, string> = {
  "1": "artur",
};

const CONTACT_NAMES: Record<string, string> = {
  "1": "Artur Menchard",
  "2": "Unknown",
  "3": "Maya",
};

function toChatHistory(messages: Array<{ sender: string; text: string }>): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const msg of messages) {
    if (msg.sender === "me") {
      out.push({ role: "user", content: msg.text });
    } else {
      out.push({ role: "assistant", content: msg.text });
    }
  }
  return out;
}

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
  const { contactId, message, history, gameState } = body as {
    contactId: string;
    message: string;
    history?: Array<{ sender: string; text: string }>;
    gameState: GameState;
  };

  if (!contactId || !message?.trim()) {
    return NextResponse.json({ error: "contactId and message are required" }, { status: 400 });
  }

  const chatHistory = history ? toChatHistory(history) : null;
  const npcSlug = CONTACT_TO_NPC[contactId];
  const contactName = CONTACT_NAMES[contactId] ?? "Contact";

  let messages: ChatMessage[];
  if (npcSlug) {
    const npc = getNpc(npcSlug);
    if (!npc) {
      return NextResponse.json({ error: `Unknown NPC: ${npcSlug}` }, { status: 400 });
    }
    messages = buildMessagesForWhatsApp(npc, message.trim(), chatHistory);
  } else if (contactId === "2") {
    messages = buildUnknownWhatsAppPrompt(message.trim(), chatHistory);
  } else {
    messages = buildGenericWhatsAppPrompt(contactName, message.trim(), chatHistory);
  }

  try {
    const rawResponse = await chat(messages, { jsonMode: false, maxTokens: 150, temperature: 0.7 });
    const dialogue = rawResponse.trim();
    return NextResponse.json({ dialogue });
  } catch (error) {
    console.error("[message-chat] Mistral error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
