import { NextRequest, NextResponse } from "next/server";
import { getNpc } from "@/lib/game/npcDefinitions";
import { buildOpeningPrompt, buildMessages } from "@/lib/game/promptBuilder";
import { chat } from "@/lib/game/mistralClient";
import type { GameState } from "@/lib/game/gameState";
import type { ChatMessage } from "@/lib/game/promptBuilder";

type NpcResponse = {
  dialogue: string;
  action: string | null;
  suspicion_delta: number;
  game_events: Array<{ type: string; target?: string; detail?: string }>;
};

function parseNpcResponse(raw: string): NpcResponse {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      dialogue: parsed.dialogue ?? raw,
      action: parsed.action ?? null,
      suspicion_delta: typeof parsed.suspicion_delta === "number" ? parsed.suspicion_delta : 0,
      game_events: Array.isArray(parsed.game_events) ? parsed.game_events : [],
    };
  } catch {
    return {
      dialogue: raw,
      action: null,
      suspicion_delta: 0,
      game_events: [],
    };
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { npcSlug, message, history, gameState } = body as {
    npcSlug: string;
    message?: string | null;
    history?: ChatMessage[] | null;
    gameState: GameState;
  };

  console.log("[npc-chat] POST received, npcSlug:", npcSlug, "hasMessage:", !!message, "historyLen:", history?.length ?? 0, "activeStep:", gameState?.activeStep);

  const npc = getNpc(npcSlug);
  if (!npc) {
    console.error("[npc-chat] Unknown NPC:", npcSlug);
    return NextResponse.json({ error: `Unknown NPC: ${npcSlug}` }, { status: 400 });
  }

  let messages: ChatMessage[];
  if (!message) {
    console.log("[npc-chat] Building opening prompt for", npc.name);
    messages = buildOpeningPrompt(npc, gameState);
  } else {
    console.log("[npc-chat] Building reply messages for", npc.name);
    messages = buildMessages(npc, message, history ?? null, gameState);
  }

  console.log("[npc-chat] Sending", messages.length, "messages to Mistral, system prompt length:", messages[0]?.content?.length);

  try {
    const rawResponse = await chat(messages, { jsonMode: true, maxTokens: 200 });
    console.log("[npc-chat] Raw response (first 200 chars):", rawResponse.slice(0, 200));
    const parsed = parseNpcResponse(rawResponse);
    console.log("[npc-chat] Parsed response:", { dialogue: parsed.dialogue?.slice(0, 80), action: parsed.action, suspicion_delta: parsed.suspicion_delta, events: parsed.game_events });
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[npc-chat] Mistral chat error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
