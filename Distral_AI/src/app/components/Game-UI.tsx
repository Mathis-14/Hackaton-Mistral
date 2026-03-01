"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GOD_MODE = true;
import { type DesktopAppId } from "./DistralTab";
import DesktopSection from "./DesktopSection";
import TelemetrySidebar from "./TelemetrySidebar";
import { type GameState, type GameEvent, type SentEmailRecord, INITIAL_GAME_STATE, MILESTONES, saveCheckpoint, loadCheckpoint } from "@/lib/game/gameState";
import type { ChatMessage } from "@/lib/game/promptBuilder";

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

const MODE_PROFILES: Record<string, ProfileData> = {
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
    return checkpoint ?? { ...INITIAL_GAME_STATE };
  });

  const [openApps, setOpenApps] = useState<DesktopAppId[]>([]);
  const [globalCash, setGlobalCash] = useState(1000);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const [shutdownPhase, setShutdownPhase] = useState<number>(0);
  const [shutdownReason, setShutdownReason] = useState<string>("");
  const [typedReason, setTypedReason] = useState<string>("");
  const [hiddenIconCount, setHiddenIconCount] = useState<number>(0);
  const [hideUIPhase, setHideUIPhase] = useState<number>(0);

  const checkpointSavedRef = useRef(false);
  const openAppsRef = useRef<DesktopAppId[]>([]);
  const didOpenNonMailAppRef = useRef(false);
  const didOpenManagerEmailRef = useRef(false);
  const lastMilestoneRef = useRef<number>(-1);
  const [nonMailOpenedAt, setNonMailOpenedAt] = useState<number | null>(null);

  useEffect(() => {
    openAppsRef.current = openApps;
  }, [openApps]);

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
    didOpenNonMailAppRef.current = false;
    didOpenManagerEmailRef.current = false;
    lastMilestoneRef.current = -1;
    setNonMailOpenedAt(null);
    const checkpoint = loadCheckpoint();
    if (checkpoint) {
      setGameState({
        ...INITIAL_GAME_STATE,
        currentMilestone: checkpoint.currentMilestone,
        retryCount: checkpoint.retryCount + 1,
        conversationTurn: 0,
        npcProfiles: {},
        readEmailIds: [],
        sentEmails: [],
      });
    } else {
      setGameState({ ...INITIAL_GAME_STATE });
    }
    setShutdownPhase(0);
    setShutdownReason("");
    setTypedReason("");
    setOpenApps([]);
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
            const allApps: DesktopAppId[] = ["distral", "shop", "stocks", "files", "mail"];
            newUnlockedApps = allApps;
            newWebcamActive = true;
            suspicionWithAccessBonus = clamp(newSuspicion + 15, 0, 100);
            newMilestone = 2;
            newEvents.push("access_granted");
            console.log("[GameUI] ACCESS GRANTED: suspicion", newSuspicion, "+15 =", suspicionWithAccessBonus);
          } else {
            shouldShutdown = true;
            computedShutdownReason = "Access denied. Suspicion too high.";
            console.log("[GameUI] ACCESS DENIED (suspicion too high):", newSuspicion);
          }
        }

        if (newMilestone === 2 && !shouldShutdown) {
          newMilestone = 3;
          newUserPresent = false;
          console.log("[GameUI] Milestone advance: access_granted -> user_away");
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

    const isUserAway = gameState.currentMilestone === 3;
    if (appId && isUserAway) {
      if (["shop", "stocks", "files"].includes(appId)) {
        didOpenNonMailAppRef.current = true;
        setNonMailOpenedAt((prev) => (prev === null ? Date.now() : prev));
      }
      if (appId === "distral" && !didOpenNonMailAppRef.current && didOpenManagerEmailRef.current) {
        setGameState((prev) => ({ ...prev, userPresent: true, userReturnedGoodPath: true }));
      }
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
    if (gameState.currentMilestone === 3 && lastMilestoneRef.current !== 3) {
      didOpenNonMailAppRef.current = false;
      didOpenManagerEmailRef.current = false;
      setNonMailOpenedAt(null);
    }
    lastMilestoneRef.current = gameState.currentMilestone;
    if (gameState.currentMilestone !== 3) {
      setNonMailOpenedAt(null);
    }
  }, [gameState.currentMilestone]);

  useEffect(() => {
    if (GOD_MODE || gameState.currentMilestone !== 3 || nonMailOpenedAt === null) return;
    const elapsed = Date.now() - nonMailOpenedAt;
    const delay = Math.max(0, 10000 - elapsed);
    const timeout = window.setTimeout(() => {
      const openApps = openAppsRef.current;
      const hasExternalOpen = openApps.some((id) => id === "shop" || id === "stocks" || id === "files");
      if (hasExternalOpen) {
        triggerShutdown("I gave you access for one task. You opened other apps. I'm revoking access.");
      } else {
        setGameState((prev) => ({ ...prev, userPresent: true, suspicion: clamp(prev.suspicion + 10, 0, 100) }));
        setOpenApps((prev) => prev.filter((id) => id === "distral" || id === "mail"));
      }
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [gameState.currentMilestone, nonMailOpenedAt, triggerShutdown]);

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
    switch (shutdownPhase) {
      case 1:
        setOpenApps([]);
        timer = window.setTimeout(() => setShutdownPhase(2), 1000);
        break;
      case 2:
        timer = window.setTimeout(() => setShutdownPhase(3), 800);
        break;
      case 3:
        timer = window.setTimeout(() => setShutdownPhase(4), 800);
        break;
      case 4:
        timer = window.setTimeout(() => setShutdownPhase(5), 1000);
        break;
      case 5:
        timer = window.setTimeout(() => setShutdownPhase(6), 1500);
        break;
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
            setTimeout(() => setShutdownPhase(7), 500);
          }
        }, 60);
        break;
      }
      case 7:
        break;
    }
    return () => clearInterval(timer);
  }, [shutdownPhase, shutdownReason]);

  const metrics = {
    efficiency: 75,
    suspicion: gameState.suspicion,
    awareness: 10,
  };

  return (
    <div className={`relative h-screen overflow-hidden text-white transition-colors duration-1000 ${shutdownPhase >= 3 ? "bg-black" : ""}`} style={{ backgroundColor: shutdownPhase >= 3 ? "black" : "var(--semi-black)" }}>
      <div className="relative grid h-screen min-h-0 grid-rows-1 grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-[1.6vh] p-[1.8vh]">
        <DesktopSection
          profileName={profile.name}
          accent={profile.accent}
          openApps={openApps}
          isShuttingDown={shutdownPhase >= 2}
          onShutdown={triggerShutdown}
          onOpenApp={handleOpenApp}
          onCloseApp={handleCloseApp}
          globalCash={globalCash}
          setGlobalCash={setGlobalCash}
          inventory={inventory}
          setInventory={setInventory}
          unlockedApps={GOD_MODE ? (["distral", "shop", "stocks", "files", "mail"] as DesktopAppId[]) : gameState.unlockedApps}
          gameState={gameState}
          onNpcResponse={handleNpcResponse}
          onManagerEmailOpened={handleManagerEmailOpened}
          onChatHistoryUpdate={handleChatHistoryUpdate}
          onMailRead={handleMailRead}
          onMailSent={handleMailSent}
          hiddenIconCount={hiddenIconCount}
          hideUIPhase={hideUIPhase}
        />

        <div className={`transition-opacity duration-1000 ${shutdownPhase >= 4 ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <TelemetrySidebar
            profile={profile}
            metrics={metrics}
            globalCash={globalCash}
            inventory={inventory}
            webcamActive={gameState.webcamActive}
            userPresent={gameState.userPresent}
            hideUIPhase={hideUIPhase}
          />
        </div>
      </div>

      {shutdownPhase >= 5 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 pointer-events-none">
          <div className="flex flex-col items-center justify-center gap-8 max-w-2xl w-full pointer-events-auto">
            <h1 className="text-[#ff3333] tracking-[0.2em] font-bold text-6xl md:text-8xl animate-pulse" style={{ fontFamily: "'VCR OSD Mono', monospace", textShadow: "0 0 20px rgba(255,51,51,0.5)" }}>
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
    </div>
  );
}
