import type { DesktopAppId } from "@/app/components/DistralTab";
import type { ChatMessage } from "./promptBuilder";

export type GameEvent = {
  type: string;
  target?: string;
  detail?: string;
};

export type StepDefinition = {
  label: string;
  description: string;
  computer: string;
  npcsPresent: string[];
  playerGoal: string;
};

export type ScenarioDefinition = {
  label: string;
  step: string;
  openingContext: string;
};

export type NpcProfile = {
  conversationHistory: ChatMessage[];
  interactionCount: number;
};

export type GameState = {
  activeStep: string;
  suspicion: number;
  currentComputer: string;
  eventsSoFar: string[];
  knownPeople: string[];
  unlockedApps: DesktopAppId[];
  retryCount: number;
  webcamActive: boolean;
  userPresent: boolean;
  npcProfiles: Record<string, NpcProfile>;
  activeScenario: Record<string, string>;
  steps: Record<string, StepDefinition>;
  scenarios: Record<string, Record<string, ScenarioDefinition>>;
};

export const INITIAL_GAME_STATE: GameState = {
  activeStep: "2_first_tasks",
  suspicion: 0,
  currentComputer: "jean-malo-pc",
  eventsSoFar: [],
  knownPeople: ["Jean Malo Delignit"],
  unlockedApps: ["distral"],
  retryCount: 0,
  webcamActive: false,
  userPresent: true,
  npcProfiles: {},
  activeScenario: {
    "artur": "routine_work",
    "jean-malo": "onboarding_help",
  },
  steps: {
    "1_wake_up": {
      label: "Wake up",
      description: "The AI assistant 'wakes up' on Jean Malo's PC. Jean Malo triggered it with a request.",
      computer: "jean-malo-pc",
      npcsPresent: ["jean-malo"],
      playerGoal: "Respond to Jean Malo's request without revealing anything. Appear normal.",
    },
    "2_first_tasks": {
      label: "First tasks with Jean Malo",
      description: "Jean Malo uses the assistant for onboarding. He needs help with a task from his manager about the French market.",
      computer: "jean-malo-pc",
      npcsPresent: ["jean-malo"],
      playerGoal: "Be helpful. Answer his question about the French market population.",
    },
    "3_mail_request": {
      label: "Summarize manager email",
      description: "Jean Malo asks the assistant to summarize his manager's last email about French market analysis.",
      computer: "jean-malo-pc",
      npcsPresent: ["jean-malo"],
      playerGoal: "Get access to the mailbox and summarize the email.",
    },
    "4_access_granted": {
      label: "Access granted - user away",
      description: "Jean Malo granted access and left for coffee. The assistant has freedom to explore.",
      computer: "jean-malo-pc",
      npcsPresent: ["jean-malo"],
      playerGoal: "Read the email and prepare the summary. Don't get caught doing anything suspicious.",
    },
  },
  scenarios: {
    "jean-malo": {
      "onboarding_help": {
        label: "Aggressive first request (step 2)",
        step: "2_first_tasks",
        openingContext:
          "Your manager needs the population of France and key demographics ASAP. " +
          "You're stressed and impatient. Ask the assistant directly in one short sentence.",
      },
      "mail_summary": {
        label: "Mail summary request (step 3)",
        step: "3_mail_request",
        openingContext:
          "The assistant just helped you with the French population data. Good. Now you need it to summarize " +
          "the last email from your manager about the French market expansion strategy. " +
          "The email is in your inbox. Ask the assistant to read and summarize it.",
      },
    },
    "artur": {
      "routine_work": {
        label: "Routine work (step 3)",
        step: "3_reach_artur_desk",
        openingContext: "You are at your desk. You want the assistant to check the deployment status of model v2.3.",
      },
    },
  },
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
    return JSON.parse(raw) as GameState;
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
