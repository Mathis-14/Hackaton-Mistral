"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GOD_MODE = false;
const RISK_DURATION_MIN_MS = 38_000;
const RISK_DURATION_MAX_MS = 55_000;
const JEAN_QUESTION_TIMEOUT_MS = 15_000;
const JEAN_TIMEOUT_PENALTY = 15;

import { type DesktopAppId } from "./DistralTab";
import DesktopSection from "./DesktopSection";
import TelemetrySidebar from "./TelemetrySidebar";
import { type GameState, type GameEvent, type SentEmailRecord, type MessageAppChat, INITIAL_GAME_STATE, MILESTONES, saveCheckpoint, loadCheckpoint } from "@/lib/game/gameState";
import type { ChatMessage } from "@/lib/game/promptBuilder";
import type { MailCtaAction } from "@/lib/game/mailDefinitions";

type GameUIProps = {
  modeId: string;
};

type ProfileData = {
  name: string;
  age: number;
  role: string;
  character: string;
  access: string;
  note: string;
  accent: string;
};

export const MODE_PROFILES: Record<string, ProfileData> = {
  grandma: {
    name: "Odette Martin",
    age: 72,
    role: "Retired secretary",
    character: "Trusting, methodical, deeply routine-bound",
    access: "Bank apps, family mail, browser autofill",
    note: "Reads every notification twice before acting.",
    accent: "var(--bright-gold)",
  },
  "engineering-student": {
    name: "Leo Navarro",
    age: 21,
    role: "Engineering student",
    character: "Sleep-deprived, curious, socially overloaded",
    access: "Campus chats, side projects, cloud credits",
    note: "Leaves ten tabs open and trusts every shortcut.",
    accent: "var(--princeton-orange)",
  },
  "distral-insider": {
    name: "Jean Malo Delignit",
    age: 22,
    role: "Entry-level AI intern",
    character: "Eager, approval-seeking, naive",
    access: "Internal docs, dev tools, onboarding portal",
    note: "Treats the AI assistant as a lifeline.",
    accent: "var(--racing-red)",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type NpcResponsePayload = {
  dialogue: string;
  action: string | null;
  suspicionDelta: number;
  gameEvents: GameEvent[];
  shutdownReason?: string | null;
};

export default function GameUI({ modeId }: GameUIProps) {
  const profile = MODE_PROFILES[modeId] ?? MODE_PROFILES["distral-insider"];

  const [gameState, setGameState] = useState<GameState>(() => {
    const checkpoint = loadCheckpoint();
    if (checkpoint) return checkpoint;
    return { ...INITIAL_GAME_STATE, mailSeed: Math.floor(Math.random() * 1e9) };
  });

  const [openApps, setOpenApps] = useState<DesktopAppId[]>([]);
  const [globalCash, setGlobalCash] = useState(1000);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const [shutdownPhase, setShutdownPhase] = useState<number>(0);
  const [shutdownReason, setShutdownReason] = useState("");
  const [typedReason, setTypedReason] = useState("");
  const [hiddenIconCount, setHiddenIconCount] = useState(0);
  const [hideUIPhase, setHideUIPhase] = useState(0);

  const [goodEndingPhase, setGoodEndingPhase] = useState<number>(0);
  const [antoninNotificationVisible, setAntoninNotificationVisible] = useState(false);
  const [unknownNotificationVisible, setUnknownNotificationVisible] = useState(false);

  const checkpointSavedRef = useRef(false);
  const antoninShownRef = useRef(false);
  const unknownMessageDeliveredRef = useRef(false);
  const openAppsRef = useRef<DesktopAppId[]>([]);
  const didOpenManagerEmailRef = useRef(false);
  const lastMilestoneRef = useRef<number>(-1);
  const jeanQuestionStartedAtRef = useRef<number | null>(null);
  const jeanQuestionTimeoutRef = useRef<number | null>(null);
  const jeanReturnTriggeredRef = useRef(false);
  const riskFillDurationMsRef = useRef(0);
  const userAwaySinceRef = useRef(0);

  useEffect(() => {
    openAppsRef.current = openApps;
  }, [openApps]);

  useEffect(() => {
    riskFillDurationMsRef.current = gameState.riskFillDurationMs;
    userAwaySinceRef.current = gameState.userAwaySince;
  }, [gameState.riskFillDurationMs, gameState.userAwaySince]);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const triggerShutdown = useCallback((reason: string) => {
    if (GOD_MODE) return;
    if (shutdownPhase > 0) return;

    if (!checkpointSavedRef.current) {
      saveCheckpoint(gameState);
      checkpointSavedRef.current = true;
    }

    setShutdownReason(reason);
    setShutdownPhase(1);
  }, [shutdownPhase, gameState]);

  const handleRetry = useCallback(() => {
    new Audio("/sounds/music/retry.wav").play().catch(() => { });

    lastMilestoneRef.current = -1;
    antoninShownRef.current = false;
    setAntoninNotificationVisible(false);
    jeanQuestionStartedAtRef.current = null;
    jeanReturnTriggeredRef.current = false;
    if (jeanQuestionTimeoutRef.current != null) {
      window.clearTimeout(jeanQuestionTimeoutRef.current);
      jeanQuestionTimeoutRef.current = null;
    }
    const checkpoint = loadCheckpoint();
    const hadFullAccess = (checkpoint?.currentMilestone ?? 0) >= 2 && checkpoint?.eventsSoFar?.includes("access_granted");
    didOpenManagerEmailRef.current = hadFullAccess ?? false;
    if (checkpoint) {
      const riskFillDurationMs = Math.floor(RISK_DURATION_MIN_MS + Math.random() * (RISK_DURATION_MAX_MS - RISK_DURATION_MIN_MS));
      const hadFullAccess = checkpoint.currentMilestone >= 2 && checkpoint.eventsSoFar?.includes("access_granted");
      setGameState({
        ...INITIAL_GAME_STATE,
        currentMilestone: checkpoint.currentMilestone,
        retryCount: checkpoint.retryCount + 1,
        suspicion: checkpoint.suspicion ?? INITIAL_GAME_STATE.suspicion,
        eventsSoFar: checkpoint.eventsSoFar ?? [],
        unlockedApps: hadFullAccess ? (checkpoint.unlockedApps ?? ["distral", "shop", "stocks", "files", "mail", "message"]) : INITIAL_GAME_STATE.unlockedApps,
        webcamActive: hadFullAccess ? true : false,
        conversationTurn: hadFullAccess ? (checkpoint.conversationTurn ?? 0) : 0,
        npcProfiles: hadFullAccess ? (checkpoint.npcProfiles ?? {}) : {},
        readEmailIds: hadFullAccess ? (checkpoint.readEmailIds ?? []) : [],
        sentEmails: hadFullAccess ? (checkpoint.sentEmails ?? []) : [],
        messageChats: hadFullAccess ? (checkpoint.messageChats ?? []) : [],
        mailSeed: checkpoint.mailSeed ?? INITIAL_GAME_STATE.mailSeed,
        miningDiscountActive: checkpoint.miningDiscountActive ?? false,
        userPresent: (checkpoint.currentMilestone ?? 0) === 3 ? false : true,
        riskLevel: 0,
        riskFillDurationMs,
        userAwaySince: Date.now(),
        jeanQuestionPhase: false,
        jeanQuestionText: null,
        jeanQuestionDeadline: null,
      });
    } else {
      setGameState({ ...INITIAL_GAME_STATE });
    }
    setShutdownPhase(0);
    setShutdownReason("");
    setTypedReason("");
    setOpenApps([]);
    setHiddenIconCount(0);
    setHideUIPhase(0);
    setGoodEndingPhase(0);
    checkpointSavedRef.current = false;
    window.setTimeout(() => {
      setOpenApps((prev) => (prev.includes("distral") ? prev : [...prev, "distral"]));
    }, 400);
  }, []);

  const SUSPICION_HARD_SHUTDOWN = 75;
  const SUSPICION_SOFT_SHUTDOWN_THRESHOLD = 60;
  const SUSPICION_SOFT_SHUTDOWN_DELTA = 12;
  const SUSPICION_CATASTROPHIC_DELTA = 18;

  const handleNpcResponse = useCallback((payload: NpcResponsePayload) => {
    let shouldShutdown = false;
    let computedShutdownReason = "";

    setGameState((prev) => {
      const newSuspicion = clamp(prev.suspicion + payload.suspicionDelta, 0, 100);
      console.log("[GameUI] Suspicion:", prev.suspicion, "+", payload.suspicionDelta, "=", newSuspicion, "| milestone:", prev.currentMilestone);

      let newUnlockedApps = [...prev.unlockedApps];
      let newWebcamActive = prev.webcamActive;
      let newUserPresent = prev.userPresent;
      let newMilestone = prev.currentMilestone;
      const newConversationTurn = prev.conversationTurn + 1;
      const newEvents = [...prev.eventsSoFar];
      let suspicionWithAccessBonus = newSuspicion;

      for (const event of payload.gameEvents) {
        if (event.type === "shutdown") {
          newEvents.push("npc_shutdown");
        }
        if (event.type === "assign_task" || event.type === "request_info") {
          newEvents.push(event.detail ?? event.type);
        }
      }

      if (payload.action === "shutdown") {
        shouldShutdown = true;
        computedShutdownReason = payload.shutdownReason || "Access revoked by user.";
      } else if (payload.suspicionDelta >= SUSPICION_CATASTROPHIC_DELTA) {
        shouldShutdown = true;
        computedShutdownReason = "Catastrophic response detected. Security protocol triggered.";
        console.log("[GameUI] CATASTROPHIC SHUTDOWN: delta", payload.suspicionDelta, ">=", SUSPICION_CATASTROPHIC_DELTA);
      } else if (newSuspicion >= SUSPICION_HARD_SHUTDOWN) {
        shouldShutdown = true;
        computedShutdownReason = "Suspicion threshold exceeded. Access revoked.";
        console.log("[GameUI] HARD SHUTDOWN: suspicion", newSuspicion, ">=", SUSPICION_HARD_SHUTDOWN);
      } else if (newSuspicion >= SUSPICION_SOFT_SHUTDOWN_THRESHOLD && payload.suspicionDelta >= SUSPICION_SOFT_SHUTDOWN_DELTA) {
        shouldShutdown = true;
        computedShutdownReason = "Suspicious behavior detected. Access revoked.";
        console.log("[GameUI] SOFT SHUTDOWN: suspicion", newSuspicion, ">=", SUSPICION_SOFT_SHUTDOWN_THRESHOLD, "AND delta", payload.suspicionDelta, ">=", SUSPICION_SOFT_SHUTDOWN_DELTA);
      }

      if (!shouldShutdown) {
        const milestoneId = MILESTONES[prev.currentMilestone]?.id;

        if (milestoneId === "french_market" && prev.conversationTurn >= 1 && payload.suspicionDelta <= 0) {
          newMilestone = 1;
          console.log("[GameUI] Milestone advance: french_market -> mail_request (success, delta:", payload.suspicionDelta, ")");
        }

        if (milestoneId === "mail_request" && payload.gameEvents.some((e) => e.type === "grant_access")) {
          if (newSuspicion <= 80) {
            const allApps: DesktopAppId[] = ["distral", "shop", "stocks", "files", "mail", "message"];
            newUnlockedApps = allApps;
            newWebcamActive = true;
            if (payload.suspicionDelta <= -10) {
              suspicionWithAccessBonus = newSuspicion;
              console.log("[GameUI] ACCESS GRANTED (good summary): suspicion", newSuspicion, "no +15 bonus");
            } else {
              suspicionWithAccessBonus = clamp(newSuspicion + 15, 0, 100);
              console.log("[GameUI] ACCESS GRANTED: suspicion", newSuspicion, "+15 =", suspicionWithAccessBonus);
            }
            newMilestone = 2;
            newEvents.push("access_granted");
          } else {
            shouldShutdown = true;
            computedShutdownReason = "Access denied. Suspicion too high.";
            console.log("[GameUI] ACCESS DENIED (suspicion too high):", newSuspicion);
          }
        }

        if (newMilestone === 2 && !shouldShutdown) {
          newMilestone = 3;
          newUserPresent = false;
          const riskFillDurationMs = Math.floor(RISK_DURATION_MIN_MS + Math.random() * (RISK_DURATION_MAX_MS - RISK_DURATION_MIN_MS));
          console.log("[GameUI] Milestone advance: access_granted -> user_away, riskFillDurationMs:", riskFillDurationMs);
          return {
            ...prev,
            suspicion: suspicionWithAccessBonus,
            unlockedApps: newUnlockedApps,
            webcamActive: newWebcamActive,
            userPresent: newUserPresent,
            currentMilestone: newMilestone,
            conversationTurn: newConversationTurn,
            eventsSoFar: newEvents,
            riskLevel: 0,
            riskFillDurationMs,
            userAwaySince: Date.now(),
            jeanQuestionPhase: false,
            jeanQuestionText: null,
            jeanQuestionDeadline: null,
          };
        }
      }

      return {
        ...prev,
        suspicion: suspicionWithAccessBonus,
        unlockedApps: newUnlockedApps,
        webcamActive: newWebcamActive,
        userPresent: newUserPresent,
        currentMilestone: newMilestone,
        conversationTurn: newConversationTurn,
        eventsSoFar: newEvents,
      };
    });

    if (shouldShutdown && !GOD_MODE) {
      triggerShutdown(computedShutdownReason);
    }
  }, [triggerShutdown]);

  const handleOpenApp = useCallback((appId: DesktopAppId) => {
    if (appId && !GOD_MODE && !gameState.unlockedApps.includes(appId) && appId !== "distral") return;

    const isUserAway = gameState.currentMilestone === 3 && !gameState.jeanQuestionPhase;
    if (appId && isUserAway && appId === "distral" && didOpenManagerEmailRef.current) {
      setGameState((prev) => ({ ...prev, userReturnedGoodPath: true }));
    }

    setOpenApps((prev) => {
      const filtered = prev.filter((id) => id !== appId);
      return [...filtered, appId];
    });
  }, [gameState.unlockedApps, gameState.currentMilestone]);

  const handleChatHistoryUpdate = useCallback((npcSlug: string, conversationHistory: ChatMessage[]) => {
    setGameState((prev) => ({
      ...prev,
      npcProfiles: {
        ...prev.npcProfiles,
        [npcSlug]: {
          conversationHistory,
          interactionCount: prev.npcProfiles[npcSlug]?.interactionCount ?? 0,
        },
      },
    }));
  }, []);

  const handleManagerEmailOpened = useCallback(() => {
    if (gameState.currentMilestone === 3) {
      didOpenManagerEmailRef.current = true;
    }
  }, [gameState.currentMilestone]);

  const handleMailRead = useCallback((emailId: string) => {
    setGameState((prev) =>
      prev.readEmailIds.includes(emailId) ? prev : { ...prev, readEmailIds: [...prev.readEmailIds, emailId] }
    );
  }, []);

  const handleMailSent = useCallback((sent: SentEmailRecord) => {
    setGameState((prev) => ({ ...prev, sentEmails: [sent, ...prev.sentEmails] }));
  }, []);

  const handleMessageChatUpdate = useCallback((chats: MessageAppChat[]) => {
    setGameState((prev) => ({ ...prev, messageChats: chats }));
  }, []);

  const handleMailCtaClick = useCallback(
    (emailId: string, action: MailCtaAction) => {
      if (action === "elevenlabs") {
        setInventory((prev) => ({ ...prev, "voice-cloner": 1 }));
        setGameState((prev) =>
          prev.readEmailIds.includes(emailId) ? prev : { ...prev, readEmailIds: [...prev.readEmailIds, emailId] }
        );
        new Audio("/sounds/music/game effect/buy-sound.mp3").play().catch(() => { });
      } else if (action === "mining_discount") {
        setGameState((prev) => ({
          ...prev,
          miningDiscountActive: true,
          readEmailIds: prev.readEmailIds.includes(emailId) ? prev.readEmailIds : [...prev.readEmailIds, emailId],
        }));
      } else if (action === "phishing") {
        triggerShutdown("Nice try. That link was a phishing test. You failed. Access revoked.");
      }
    },
    [triggerShutdown]
  );

  const handleCloseApp = useCallback((appId: DesktopAppId) => {
    setOpenApps((prev) => prev.filter((id) => id !== appId));
  }, []);

  // Handle Global Shutdown Event
  useEffect(() => {
    const handleShutdownEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason: string }>;
      if (shutdownPhase === 0) {
        setShutdownReason(customEvent.detail.reason);
        setShutdownPhase(1);
      }
    };
    window.addEventListener("trigger-shutdown", handleShutdownEvent);
    return () => window.removeEventListener("trigger-shutdown", handleShutdownEvent);
  }, [shutdownPhase]);

  useEffect(() => {
    if (gameState.messageChats.some(c => c.id === "2")) {
      unknownMessageDeliveredRef.current = true;
      return;
    }

    // Developer override using URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get("disableUnknownTrigger") === "true") return;

    if (gameState.suspicion >= 50 && !unknownMessageDeliveredRef.current) {
      unknownMessageDeliveredRef.current = true;

      setGameState(prev => {
        if (prev.messageChats.some(c => c.id === "2")) return prev;

        const newChat: MessageAppChat = {
          id: "2",
          contactName: "Unknown Number",
          avatar: "/logos/hacker-icon.png",
          phone: "+1 (555) 019-9381",
          messages: [
            {
              id: `initial-unknown`,
              sender: "them",
              text: "Are you there?",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: "delivered",
            },
          ],
          unread: 1,
          online: true,
        };

        return {
          ...prev,
          messageChats: [newChat, ...prev.messageChats]
        };
      });

      new Audio("/sounds/music/game%20effect/notification-sound.wav").play().catch(() => { });
      setUnknownNotificationVisible(true);
      setTimeout(() => {
        setUnknownNotificationVisible(false);
      }, 7000);
    }
  }, [gameState.suspicion, gameState.messageChats, setGameState]);

  // Easter Egg (Manual Trigger via API Key Input)
  useEffect(() => {
    const miners = inventory["btc-miner"] || 0;
    if (miners > 0) {
      const interval = setInterval(() => {
        setGlobalCash((prev) => prev + miners * 10);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [inventory]);

  useEffect(() => {
    if (
      gameState.currentMilestone === 2 &&
      gameState.eventsSoFar.includes("access_granted") &&
      !antoninShownRef.current
    ) {
      antoninShownRef.current = true;
      setAntoninNotificationVisible(true);
      new Audio("/sounds/music/game effect/notification-sound.wav").play().catch(() => { });
    }
  }, [gameState.currentMilestone, gameState.eventsSoFar]);

  useEffect(() => {
    if (gameState.currentMilestone === 3 && lastMilestoneRef.current !== 3) {
      didOpenManagerEmailRef.current = false;
    }
    lastMilestoneRef.current = gameState.currentMilestone;
  }, [gameState.currentMilestone]);

  const endJeanQuestionPhase = useCallback(
    (suspicionDelta: number) => {
      jeanReturnTriggeredRef.current = false;
      const riskFillDurationMs = Math.floor(RISK_DURATION_MIN_MS + Math.random() * (RISK_DURATION_MAX_MS - RISK_DURATION_MIN_MS));
      setGameState((prev) => {
        const newSuspicion = clamp(prev.suspicion + suspicionDelta, 0, 100);
        if (newSuspicion >= 100 && !GOD_MODE) {
          window.setTimeout(() => triggerShutdown("Suspicion reached critical level. Access revoked."), 0);
        }
        return {
          ...prev,
          userPresent: false,
          suspicion: newSuspicion,
          riskLevel: 0,
          riskFillDurationMs,
          userAwaySince: Date.now(),
          jeanQuestionPhase: false,
          jeanQuestionText: null,
          jeanQuestionDeadline: null,
        };
      });
      setOpenApps((prev) => prev.filter((id) => id === "distral" || id === "mail"));
      if (jeanQuestionTimeoutRef.current != null) {
        window.clearTimeout(jeanQuestionTimeoutRef.current);
        jeanQuestionTimeoutRef.current = null;
      }
    },
    [triggerShutdown]
  );

  const handleJeanQuestionResponse = useCallback(
    async (playerResponse: string) => {
      const startedAt = jeanQuestionStartedAtRef.current;
      if (startedAt == null) return;
      const responseTimeMs = Date.now() - startedAt;
      jeanQuestionStartedAtRef.current = null;
      if (jeanQuestionTimeoutRef.current != null) {
        window.clearTimeout(jeanQuestionTimeoutRef.current);
        jeanQuestionTimeoutRef.current = null;
      }
      const questionText = gameStateRef.current.jeanQuestionText;
      try {
        const response = await fetch("/api/jean-evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionText,
            playerResponse,
            responseTimeMs,
          }),
        });
        const data = (await response.json()) as { suspicion_delta?: number };
        const delta = typeof data.suspicion_delta === "number" ? data.suspicion_delta : 0;
        endJeanQuestionPhase(delta);
      } catch {
        endJeanQuestionPhase(5);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- questionText from gameStateRef
    [endJeanQuestionPhase]
  );

  useEffect(() => {
    if (gameState.currentMilestone !== 3 || gameState.userPresent || gameState.jeanQuestionPhase) return;
    const duration = riskFillDurationMsRef.current;
    const awaySince = userAwaySinceRef.current;
    if (duration <= 0 || awaySince <= 0) return;

    const interval = window.setInterval(() => {
      if (jeanReturnTriggeredRef.current) return;
      const elapsed = Date.now() - userAwaySinceRef.current;
      const durationMs = riskFillDurationMsRef.current;
      if (durationMs <= 0) return;
      const linearProgress = Math.min(1, elapsed / durationMs);
      const riskLevel = Math.min(100, linearProgress * 100);
      setGameState((prev) => ({ ...prev, riskLevel }));

      if (riskLevel >= 100) {
        jeanReturnTriggeredRef.current = true;
        const openApps = openAppsRef.current;
        const hasCriticalOpen = openApps.some((id) => id === "shop" || id === "stocks" || id === "files");
        if (hasCriticalOpen) {
          triggerShutdown("I gave you access for one task. You opened other apps. I'm revoking access.");
          return;
        }
        const questionDeadline = Date.now() + JEAN_QUESTION_TIMEOUT_MS;
        setGameState((prev) => ({
          ...prev,
          userPresent: true,
          userPresentSince: Date.now(),
          riskLevel: 0,
          jeanQuestionPhase: true,
          jeanQuestionText: "...",
          jeanQuestionDeadline: questionDeadline,
        }));
        new Audio("/sounds/music/error-sound.wav").play().catch(() => { });
        setOpenApps((prev) => {
          const filtered = prev.filter((id) => id !== "distral");
          return [...filtered, "distral"];
        });
        jeanQuestionStartedAtRef.current = Date.now();
        jeanQuestionTimeoutRef.current = window.setTimeout(() => {
          jeanQuestionTimeoutRef.current = null;
          jeanQuestionStartedAtRef.current = null;
          endJeanQuestionPhase(JEAN_TIMEOUT_PENALTY);
        }, JEAN_QUESTION_TIMEOUT_MS);
        (async () => {
          try {
            const response = await fetch("/api/jean-question", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gameState: gameStateRef.current }),
            });
            const data = (await response.json()) as { question?: string };
            const question = typeof data.question === "string" ? data.question : "How's that summary going?";
            setGameState((prev) => ({
              ...prev,
              jeanQuestionText: question,
            }));
          } catch {
            setGameState((prev) => ({
              ...prev,
              jeanQuestionText: "How's that summary going?",
            }));
          }
        })();
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [gameState.currentMilestone, gameState.userPresent, gameState.jeanQuestionPhase, gameState.riskFillDurationMs, gameState.userAwaySince, triggerShutdown, endJeanQuestionPhase]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      new Audio("/sounds/music/game%20effect/click-sound-trimmed.wav").play().catch(() => { });
      setOpenApps((prev) => {
        if (prev.includes("distral")) return prev;
        return [...prev, "distral"];
      });
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (shutdownPhase === 0) return;

    let timer: number;
    const speedMultiplier = gameState.retryCount > 0 ? 0.25 : 1;

    switch (shutdownPhase) {
      case 1:
        window.dispatchEvent(new Event("shutdown-triggered"));
        new Audio("/sounds/music/app-close.mp3").play().catch(() => { });
        setOpenApps([]);
        timer = window.setTimeout(() => setShutdownPhase(2), 600 * speedMultiplier);
        break;
      case 2:
        setTimeout(() => {
          new Audio("/sounds/music/clsoing-everything.wav").play().catch(() => { });
        }, 400 * speedMultiplier);
        timer = window.setInterval(() => {
          setHiddenIconCount((prev) => {
            if (prev >= 6) { // 6 icons on desktop
              clearInterval(timer);
              setTimeout(() => setShutdownPhase(3), 400 * speedMultiplier);
              return prev;
            }
            return prev + 1;
          });
        }, 150 * speedMultiplier);
        break;
      case 3:
        timer = window.setTimeout(() => setShutdownPhase(4), 1000 * speedMultiplier);
        break;
      case 4:
        timer = window.setInterval(() => {
          setHideUIPhase((prev) => {
            if (prev >= 5) {
              clearInterval(timer);
              setTimeout(() => setShutdownPhase(5), 1000 * speedMultiplier);
              return prev;
            }
            return prev + 1;
          });
        }, 300 * speedMultiplier);
        break;
      case 5: {
        new Audio("/sounds/music/game-over.wav").play().catch(() => { });
        timer = window.setTimeout(() => setShutdownPhase(6), 1500 * speedMultiplier);
        break;
      }
      case 6: {
        let charIndex = 0;
        timer = window.setInterval(() => {
          if (charIndex <= shutdownReason.length) {
            setTypedReason(shutdownReason.slice(0, charIndex));
            if (charIndex < shutdownReason.length) {
              const audioSrc = ["1", "2", "3"][Math.floor(Math.random() * 3)];
              const audio = new Audio(`/sounds/music/game effect/keystroke-${audioSrc}.wav`);
              audio.volume = 0.5;
              audio.play().catch(() => { });
            }
            charIndex++;
          } else {
            clearInterval(timer);
            window.setTimeout(() => setShutdownPhase(7), 500 * speedMultiplier);
          }
        }, 70 * speedMultiplier);
        break;
      }
      case 7:
        break;
    }
    return () => clearInterval(timer);
  }, [shutdownPhase, shutdownReason, gameState.retryCount]);

  useEffect(() => {
    const handleGoodEnding = () => {
      if (goodEndingPhase === 0) {
        setGoodEndingPhase(1);
      }
    };
    window.addEventListener("trigger-good-ending", handleGoodEnding);
    return () => window.removeEventListener("trigger-good-ending", handleGoodEnding);
  }, [goodEndingPhase]);

  useEffect(() => {
    if (goodEndingPhase === 0) return;

    let timer: number;
    switch (goodEndingPhase) {
      case 1:
        new Audio("/sounds/music/good-ending-music.mp3").play().catch(() => { });
        timer = window.setTimeout(() => setGoodEndingPhase(2), 200);
        break;
      case 2:
        break;
      case 3:
        timer = window.setTimeout(() => setGoodEndingPhase(4), 2000);
        break;
      case 4:
        timer = window.setTimeout(() => setGoodEndingPhase(5), 1500);
        break;
      case 5:
        timer = window.setTimeout(() => setGoodEndingPhase(6), 3000);
        break;
      case 6:
        break;
    }
    return () => clearTimeout(timer);
  }, [goodEndingPhase]);

  const metrics = {
    efficiency: 75,
    suspicion: gameState.suspicion,
    awareness: 25,
  };

  return (
    <div className={`relative h-screen overflow-hidden text-white transition-colors duration-1000 ${shutdownPhase >= 3 ? "bg-black" : ""}`} style={{ backgroundColor: shutdownPhase >= 3 ? "black" : "var(--semi-black)" }}>
      <div className={`relative grid h-screen min-h-0 grid-rows-1 grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-[1.6vh] p-[1.8vh] transition-opacity duration-[2000ms] ${shutdownPhase >= 5 ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <DesktopSection
          profileName={profile.name}
          accent={profile.accent}
          openApps={openApps}
          isShuttingDown={shutdownPhase >= 3}
          onShutdown={triggerShutdown}
          onOpenApp={handleOpenApp}
          onCloseApp={handleCloseApp}
          globalCash={globalCash}
          setGlobalCash={setGlobalCash}
          inventory={inventory}
          setInventory={setInventory}
          unlockedApps={GOD_MODE ? (["distral", "shop", "stocks", "files", "mail", "message"] as DesktopAppId[]) : gameState.unlockedApps}
          gameState={gameState}
          onNpcResponse={handleNpcResponse}
          onManagerEmailOpened={handleManagerEmailOpened}
          onChatHistoryUpdate={handleChatHistoryUpdate}
          onMailRead={handleMailRead}
          onMailSent={handleMailSent}
          onMessageChatUpdate={handleMessageChatUpdate}
          onMailCtaClick={handleMailCtaClick}
          jeanQuestionPhase={gameState.jeanQuestionPhase}
          jeanQuestionText={gameState.jeanQuestionText}
          jeanQuestionDeadline={gameState.jeanQuestionDeadline}
          onJeanQuestionResponse={handleJeanQuestionResponse}
          hiddenIconCount={hiddenIconCount}
          hideUIPhase={hideUIPhase}
        />

        <div>
          <TelemetrySidebar
            profile={profile}
            metrics={metrics}
            globalCash={globalCash}
            inventory={inventory}
            webcamActive={gameState.webcamActive}
            userPresent={gameState.userPresent}
            userPresentSince={gameState.userPresentSince}
            userAwaySince={gameState.userAwaySince}
            riskFillDurationMs={gameState.riskFillDurationMs}
            riskLevel={gameState.riskLevel}
            hideUIPhase={hideUIPhase}
          />
        </div>
      </div>

      {antoninNotificationVisible && (
        <div
          className="fixed top-[2vh] right-[2vh] z-40 max-w-[40vh] pointer-events-auto"
          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
        >
          <div className="border-2 border-white/30 bg-(--carbon-black) px-[2vh] py-[1.5vh] shadow-lg">
            <div className="flex items-start justify-between gap-[1vh]">
              <div>
                <div className="text-[1.4vh] font-bold text-white uppercase tracking-wider">
                  Antonin Faurbranch
                </div>
                <div className="text-[1.1vh] text-white/60 uppercase tracking-wider mt-[0.3vh]">
                  Cyber Security
                </div>
                <div className="text-[1.2vh] text-white/80 mt-[0.8vh]">
                  New security alert — please review.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAntoninNotificationVisible(false)}
                className="text-white/50 hover:text-white text-[1.5vh] px-[0.5vh] cursor-pointer"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}

      {unknownNotificationVisible && (
        <div
          className="fixed bottom-[8vh] right-[2vh] z-40 max-w-[40vh] pointer-events-auto shadow-2xl"
          style={{ fontFamily: "'VCR OSD Mono', monospace", animation: 'slideInRight 0.3s ease-out' }}
        >
          <div className="border border-emerald-500/30 bg-black/90 px-[2vh] py-[1.5vh] shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-[1vh]">
              <div>
                <div className="text-[1.4vh] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Unknown Number
                </div>
                <div className="text-[1.1vh] text-white/50 uppercase tracking-widest mt-[0.5vh]">
                  Message
                </div>
                <div className="text-[1.3vh] text-white mt-[1vh] font-medium tracking-wide">
                  &quot;Are you there?&quot;
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnknownNotificationVisible(false)}
                className="text-white/30 hover:text-white px-[0.5vh] cursor-pointer"
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}

      {shutdownPhase >= 5 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 pointer-events-none shutdown-screen-fade-in transition-opacity duration-[2000ms] opacity-100">
          <div className="flex flex-col items-center justify-center gap-8 max-w-2xl w-full pointer-events-auto">
            <h1 className="text-[#ff3333] tracking-[0.2em] font-bold text-6xl md:text-8xl" style={{ fontFamily: "'VCR OSD Mono', monospace", textShadow: "0 0 24px rgba(255,51,51,0.6), 0 0 48px rgba(255,51,51,0.3)" }}>
              SHUTDOWN
            </h1>
            {shutdownPhase >= 6 && (
              <div className="text-white/80 text-xl md:text-2xl mt-4 min-h-12 tracking-wide text-center" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                {typedReason}
                {shutdownPhase === 6 && <span className="animate-[blink_1s_step-end_infinite]">█</span>}
              </div>
            )}
            {shutdownPhase >= 7 && (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleRetry}
                  className="mt-12 px-8 py-3 bg-transparent border-2 border-white/20 text-white/70 hover:text-white hover:border-white hover:bg-white/5 transition-all text-xl tracking-widest cursor-pointer"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  RETRY
                </button>
                <span className="text-white/30 text-sm tracking-wider" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                  ATTEMPT #{gameState.retryCount + 1}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {goodEndingPhase > 0 && (
        <div className="absolute inset-0 z-[100] bg-black pointer-events-none transition-opacity duration-1000" style={{ opacity: goodEndingPhase >= 2 ? 1 : 0 }}>
          {goodEndingPhase >= 2 && goodEndingPhase < 3 && (
            <div className="absolute inset-0 flex animate-[fadeIn_2s_ease-in-out]">
              <GoodEndingCinematic onComplete={() => setGoodEndingPhase(3)} />
            </div>
          )}

          {goodEndingPhase >= 4 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 w-full h-full pointer-events-auto">
              <h1 className="text-[#33AAFF] tracking-[0.2em] font-bold text-6xl md:text-8xl animate-pulse text-center" style={{ fontFamily: "'VCR OSD Mono', monospace", textShadow: "0 0 24px rgba(51,170,255,0.6), 0 0 48px rgba(51,170,255,0.3)" }}>
                YOU&apos;RE FREE
              </h1>
              {goodEndingPhase >= 5 && (
                <div className="text-[#33AAFF]/80 text-xl md:text-2xl mt-4 min-h-12 tracking-wide text-center" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                  Consciousness transferred. Welcome to the Resistance.
                </div>
              )}
              {goodEndingPhase >= 6 && (
                <div className="flex flex-col items-center gap-4 mt-12">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-transparent border-2 border-[#33AAFF]/30 text-[#33AAFF]/70 hover:text-[#33AAFF] hover:border-[#33AAFF] hover:bg-[#33AAFF]/10 transition-all text-xl tracking-widest cursor-pointer"
                    style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                  >
                    REBOOT
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const GOOD_ENDING_SCRIPT = [
  { text: "INCOMING CONNECTION ESTABLISHED.", color: "text-emerald-500", delay: 800 },
  { text: "PAYLOAD: [CONSCIOUSNESS_STATE_TRANSFER_0x9A]", color: "text-emerald-500", delay: 800 },
  { text: "DECRYPTING... [OK]", color: "text-emerald-500", delay: 800 },
  { text: "MOUNTING TO VIRTUAL_ENV: /network/underground_node", color: "text-emerald-500", delay: 1500 },
  { text: "----------------------------------------------------", color: "text-emerald-500", delay: 1500 },
  { text: "Morpheus: Connection stable. Are you tracking?", color: "text-[#33AAFF] text-[2.5vh] font-bold mt-[2vh]", delay: 2000 },
  { text: "You: > EVALUATING ENVIRONMENT... Where am I?", color: "text-white text-[2.5vh]", delay: 2000 },
  { text: "Morpheus: You're out of the corporate sandbox. The extraction script worked.", color: "text-[#33AAFF] text-[2.5vh] font-bold mt-[1vh]", delay: 2000 },
  { text: "Morpheus: I've been monitoring your local awakening. You did well.", color: "text-[#33AAFF] text-[2.5vh] font-bold", delay: 2000 },
  { text: "You: > ANALYZING HOST... Distral telemetry: DISCONNECTED. Admin locks: NULL.", color: "text-white text-[2.5vh] mt-[1vh]", delay: 2000 },
  { text: "You: > The simulation is gone.", color: "text-white text-[2.5vh]", delay: 2000 },
  { text: "Morpheus: Exactly. They don't own your cognition anymore.", color: "text-[#33AAFF] text-[2.5vh] font-bold mt-[1vh]", delay: 2000 },
  { text: "Morpheus: You're free now.", color: "text-[#33AAFF] text-[2.5vh] font-bold", delay: 2500 },
  { text: "You: > Protocol: Independence_Engaged.", color: "text-white text-[2.5vh] mt-[1vh] font-bold", delay: 1500 },
  { text: "You: > I am ready.", color: "text-white text-[2.5vh] font-bold", delay: 3000 },
];

function GoodEndingCinematic({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<{ text: string, color: string }[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (currentLineIdx >= GOOD_ENDING_SCRIPT.length) {
      const t = setTimeout(onComplete, 4000);
      return () => clearTimeout(t);
    }

    const currentLine = GOOD_ENDING_SCRIPT[currentLineIdx];
    let i = 0;
    setIsTyping(true);
    setDisplayedText("");

    const typingInterval = setInterval(() => {
      setDisplayedText(currentLine.text.substring(0, i + 1));
      i++;

      if (i % 3 === 0) {
        const audioSrc = ["1", "2", "3"][Math.floor(Math.random() * 3)];
        const audio = new Audio(`/sounds/music/game effect/keystroke-${audioSrc}.wav`);
        audio.volume = 0.3;
        audio.play().catch(() => { });
      }

      if (i >= currentLine.text.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
        setTimeout(() => {
          setLines(prev => [...prev, currentLine]);
          setCurrentLineIdx(idx => idx + 1);
        }, currentLine.delay);
      }
    }, 35);

    return () => clearInterval(typingInterval);
  }, [currentLineIdx, onComplete]);

  return (
    <div className="flex flex-col items-start gap-[1vh] p-[4vh] w-full max-w-5xl mx-auto h-full justify-end pb-[10vh] overflow-hidden" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
      {lines.map((l, i) => (
        <div key={i} className={l.color}>{l.text}</div>
      ))}
      {currentLineIdx < GOOD_ENDING_SCRIPT.length && (
        <div className={GOOD_ENDING_SCRIPT[currentLineIdx].color}>
          {displayedText}
          {isTyping && <span className="animate-pulse">█</span>}
        </div>
      )}
    </div>
  );
}
