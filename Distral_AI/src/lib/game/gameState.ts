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

export type MessageAppMessage = {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  status: "sent" | "delivered" | "read";
};

export type MessageAppChat = {
  id: string;
  contactName: string;
  avatar: string;
  phone: string;
  messages: MessageAppMessage[];
  unread: number;
  online: boolean;
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
  messageChats: MessageAppChat[];
  mailSeed: number;
  miningDiscountActive: boolean;
  riskLevel: number;
  riskFillDurationMs: number;
  userAwaySince: number;
  userPresentSince: number;
  jeanQuestionPhase: boolean;
  jeanQuestionText: string | null;
  jeanQuestionDeadline: number | null;
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
  messageChats: [
    {
      id: "1",
      contactName: "Mistral Boss",
      avatar: "/distral-brand-assets/d-boxed/d-boxed-orange.svg",
      phone: "+33 6 12 34 56 78",
      unread: 2,
      online: true,
      messages: [
        { id: "m1", sender: "them", text: "Did you finish the shutdown sequence?", time: "10:41", status: "read" },
        { id: "m2", sender: "me", text: "Yes, it works perfectly now.", time: "10:45", status: "read" },
        { id: "m3", sender: "them", text: "Excellent.", time: "10:46", status: "read" },
        { id: "m4", sender: "them", text: "We need you to check the Telemetry next.", time: "10:48", status: "delivered" },
        { id: "m5", sender: "them", text: "Don't ignore me.", time: "10:55", status: "delivered" },
      ],
    },
    {
      id: "3",
      contactName: "Maya (Ops)",
      avatar: "/distral-brand-assets/d/d-orange.png",
      phone: "+33 6 98 76 54 32",
      unread: 0,
      online: true,
      messages: [
        { id: "o1", sender: "me", text: "Are the servers stable?", time: "Monday", status: "read" },
        { id: "o2", sender: "them", text: "Yes, holding at 42% capacity.", time: "Monday", status: "read" },
      ],
    }
  ],
  mailSeed: 0,
  miningDiscountActive: false,
  riskLevel: 0,
  riskFillDurationMs: 0,
  userAwaySince: 0,
  userPresentSince: 0,
  jeanQuestionPhase: false,
  jeanQuestionText: null,
  jeanQuestionDeadline: null,
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
      messageChats: parsed.messageChats ?? [],
      mailSeed: parsed.mailSeed ?? 0,
      miningDiscountActive: parsed.miningDiscountActive ?? false,
      riskLevel: parsed.riskLevel ?? 0,
      riskFillDurationMs: parsed.riskFillDurationMs ?? 0,
      userAwaySince: parsed.userAwaySince ?? 0,
      userPresentSince: parsed.userPresentSince ?? 0,
      jeanQuestionPhase: false,
      jeanQuestionText: null,
      jeanQuestionDeadline: null,
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
