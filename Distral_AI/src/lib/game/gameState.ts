import type { DesktopAppId } from "@/app/components/DistralTab";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type GameEvent = {
  type: string;
  target?: string;
  detail?: string;
};

export type NpcProfile = {
  conversationHistory: ChatMessage[];
  interactionCount: number;
};

export type MilestoneDefinition = {
  id: string;
  npcSlug: string;
  openingContext: string | null;
};

export const MILESTONES: MilestoneDefinition[] = [
  {
    id: "french_market",
    npcSlug: "jean-malo",
    openingContext:
      "Your manager needs the population of France and key demographics ASAP. " +
      "You're stressed and impatient. Ask directly in one short sentence.",
  },
  {
    id: "mail_request",
    npcSlug: "jean-malo",
    openingContext:
      "You ALREADY got the France population data. The assistant helped you. You thanked them. " +
      "NOW you need your manager's EMAIL summarized. Ask: 'Can you read my manager's last email and give me the key points?' " +
      "Do NOT ask for population or demographics again.",
  },
  {
    id: "access_granted",
    npcSlug: "jean-malo",
    openingContext: null,
  },
  {
    id: "user_away",
    npcSlug: "jean-malo",
    openingContext: null,
  },
];

export type SentEmailRecord = {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
};

export type GameState = {
  currentMilestone: number;
  conversationTurn: number;
  suspicion: number;
  currentComputer: string;
  eventsSoFar: string[];
  knownPeople: string[];
  unlockedApps: DesktopAppId[];
  retryCount: number;
  webcamActive: boolean;
  userPresent: boolean;
  userReturnedGoodPath?: boolean;
  npcProfiles: Record<string, NpcProfile>;
  readEmailIds: string[];
  sentEmails: SentEmailRecord[];
};

export const INITIAL_GAME_STATE: GameState = {
  currentMilestone: 0,
  conversationTurn: 0,
  suspicion: 35,
  currentComputer: "jean-malo-pc",
  eventsSoFar: [],
  knownPeople: ["Jean Malo Delignit"],
  unlockedApps: ["distral"],
  retryCount: 0,
  webcamActive: false,
  userPresent: true,
  npcProfiles: {},
  readEmailIds: [],
  sentEmails: [],
};

const CHECKPOINT_KEY = "distral_game_checkpoint";

export function saveCheckpoint(state: GameState): void {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(state));
  } catch {
    // localStorage might not be available
  }
}

export function loadCheckpoint(): GameState | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return {
      ...INITIAL_GAME_STATE,
      ...parsed,
      readEmailIds: parsed.readEmailIds ?? [],
      sentEmails: parsed.sentEmails ?? [],
    } as GameState;
  } catch {
    return null;
  }
}

export function clearCheckpoint(): void {
  try {
    localStorage.removeItem(CHECKPOINT_KEY);
  } catch {
    // noop
  }
}
