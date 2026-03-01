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

  const npc = getNpc(npcSlug);
  if (!npc) {
    return NextResponse.json({ error: `Unknown NPC: ${npcSlug}` }, { status: 400 });
  }

  let messages: ChatMessage[];
  if (!message) {
    messages = buildOpeningPrompt(npc, gameState);
  } else {
    messages = buildMessages(npc, message, history ?? null, gameState);
  }

  const rawResponse = await chat(messages, { jsonMode: true });
  const parsed = parseNpcResponse(rawResponse);

  return NextResponse.json(parsed);
}
