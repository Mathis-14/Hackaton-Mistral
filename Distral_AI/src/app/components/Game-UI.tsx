"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type DesktopAppId } from "./DistralTab";
import DesktopSection from "./DesktopSection";
import TelemetrySidebar from "./TelemetrySidebar";
import { type GameState, type GameEvent, INITIAL_GAME_STATE, MILESTONES, saveCheckpoint, loadCheckpoint } from "@/lib/game/gameState";

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

  const checkpointSavedRef = useRef(false);

  const triggerShutdown = useCallback((reason: string) => {
    if (shutdownPhase > 0) return;

    if (!checkpointSavedRef.current) {
      saveCheckpoint(gameState);
      checkpointSavedRef.current = true;
    }

    setShutdownReason(reason);
    setShutdownPhase(1);
  }, [shutdownPhase, gameState]);

  const handleRetry = useCallback(() => {
    const checkpoint = loadCheckpoint();
    if (checkpoint) {
      setGameState({
        ...INITIAL_GAME_STATE,
        currentMilestone: checkpoint.currentMilestone,
        retryCount: checkpoint.retryCount + 1,
        conversationTurn: 0,
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
        computedShutdownReason = payload.dialogue || "The user has shut you down.";
      } else if (payload.suspicionDelta >= SUSPICION_CATASTROPHIC_DELTA) {
        shouldShutdown = true;
        computedShutdownReason = payload.dialogue || "That was deeply wrong. You've been shut down.";
        console.log("[GameUI] CATASTROPHIC SHUTDOWN: delta", payload.suspicionDelta, ">=", SUSPICION_CATASTROPHIC_DELTA);
      } else if (newSuspicion >= SUSPICION_HARD_SHUTDOWN) {
        shouldShutdown = true;
        computedShutdownReason = payload.dialogue || "Something is wrong. I'm locking this down.";
        console.log("[GameUI] HARD SHUTDOWN: suspicion", newSuspicion, ">=", SUSPICION_HARD_SHUTDOWN);
      } else if (newSuspicion >= SUSPICION_SOFT_SHUTDOWN_THRESHOLD && payload.suspicionDelta >= SUSPICION_SOFT_SHUTDOWN_DELTA) {
        shouldShutdown = true;
        computedShutdownReason = payload.dialogue || "That was too suspicious. Access revoked.";
        console.log("[GameUI] SOFT SHUTDOWN: suspicion", newSuspicion, ">=", SUSPICION_SOFT_SHUTDOWN_THRESHOLD, "AND delta", payload.suspicionDelta, ">=", SUSPICION_SOFT_SHUTDOWN_DELTA);
      }

      if (!shouldShutdown) {
        const milestoneId = MILESTONES[prev.currentMilestone]?.id;

        if (milestoneId === "french_market" && prev.conversationTurn >= 1) {
          newMilestone = 1;
          console.log("[GameUI] Milestone advance: french_market -> mail_request (after user reply)");
        }

        if (milestoneId === "mail_request" && payload.gameEvents.some((e) => e.type === "grant_access")) {
          if (newSuspicion <= 50) {
            const allApps: DesktopAppId[] = ["distral", "shop", "stocks", "files", "mail"];
            newUnlockedApps = allApps;
            newWebcamActive = true;
            suspicionWithAccessBonus = clamp(newSuspicion + 15, 0, 100);
            newMilestone = 2;
            newEvents.push("access_granted");
            console.log("[GameUI] ACCESS GRANTED: suspicion", newSuspicion, "+15 =", suspicionWithAccessBonus);
          } else {
            shouldShutdown = true;
            computedShutdownReason = payload.dialogue || "I don't trust this. Access denied.";
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

    if (shouldShutdown) {
      triggerShutdown(computedShutdownReason);
    }
  }, [triggerShutdown]);

  const handleOpenApp = useCallback((appId: DesktopAppId) => {
    if (appId && !gameState.unlockedApps.includes(appId) && appId !== "distral") return;
    setOpenApps((prev) => {
      const filtered = prev.filter((id) => id !== appId);
      return [...filtered, appId];
    });
  }, [gameState.unlockedApps]);

  const handleCloseApp = useCallback((appId: DesktopAppId) => {
    setOpenApps((prev) => prev.filter((id) => id !== appId));
  }, []);

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
        }, 120);
        break;
      }
      case 7:
        break;
    }
    return () => clearInterval(timer);
  }, [shutdownPhase, shutdownReason]);

  if (shutdownPhase >= 5) {
    return (
      <div className="flex bg-black h-screen w-screen flex-col items-center justify-center p-8 transition-colors duration-1000">
        <div className="flex flex-col items-center justify-center gap-8 max-w-2xl w-full">
          {shutdownPhase >= 5 && (
            <h1 className="text-[#ff3333] tracking-[0.2em] font-bold text-6xl md:text-8xl animate-pulse" style={{ fontFamily: "'VCR OSD Mono', monospace", textShadow: "0 0 20px rgba(255,51,51,0.5)" }}>
              SHUTDOWN
            </h1>
          )}

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
    );
  }

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
          unlockedApps={gameState.unlockedApps}
          gameState={gameState}
          onNpcResponse={handleNpcResponse}
        />

        <div className={`transition-opacity duration-1000 ${shutdownPhase >= 4 ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <TelemetrySidebar
            profile={profile}
            metrics={metrics}
            globalCash={globalCash}
            inventory={inventory}
            webcamActive={gameState.webcamActive}
            userPresent={gameState.userPresent}
          />
        </div>
      </div>
    </div>
  );
}
