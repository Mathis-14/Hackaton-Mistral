"use client";

import { useEffect, useState } from "react";
import { type DesktopAppId } from "./DistralTab";
import DesktopSection from "./DesktopSection";
import TelemetrySidebar from "./TelemetrySidebar";

type GameUIProps = {
  modeId: string;
};

type MetricState = {
  efficiency: number;
  suspicion: number;
  awareness: number;
};

type ProfileData = {
  name: string;
  age: number;
  role: string;
  character: string;
  access: string;
  note: string;
  accent: string;
  efficiency: number;
  suspicion: number;
  awareness: number;
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
    efficiency: 83,
    suspicion: 16,
    awareness: 28,
  },
  "engineering-student": {
    name: "Leo Navarro",
    age: 21,
    role: "Engineering student",
    character: "Sleep-deprived, curious, socially overloaded",
    access: "Campus chats, side projects, cloud credits",
    note: "Leaves ten tabs open and trusts every shortcut.",
    accent: "var(--princeton-orange)",
    efficiency: 74,
    suspicion: 31,
    awareness: 44,
  },
  "distral-insider": {
    name: "Maya Borel",
    age: 34,
    role: "Internal operations lead",
    character: "Guarded, ambitious, chronically overbooked",
    access: "Internal docs, release notes, admin dashboards",
    note: "Optimizes everything except her own security hygiene.",
    accent: "var(--racing-red)",
    efficiency: 69,
    suspicion: 46,
    awareness: 61,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nudgePercent(value: number, min: number, max: number, spread: number) {
  const delta = (Math.random() - 0.5) * spread;
  return Math.round(clamp(value + delta, min, max));
}

function buildInitialMetrics(profile: ProfileData): MetricState {
  return {
    efficiency: profile.efficiency,
    suspicion: profile.suspicion,
    awareness: profile.awareness,
  };
}

export default function GameUI({ modeId }: GameUIProps) {
  const profile = MODE_PROFILES[modeId] ?? MODE_PROFILES.grandma;
  const [metrics, setMetrics] = useState<MetricState>(() => buildInitialMetrics(profile));
  const [openApps, setOpenApps] = useState<DesktopAppId[]>([]);
  const [globalCash, setGlobalCash] = useState(1000);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  // Shutdown state
  const [shutdownPhase, setShutdownPhase] = useState<number>(0);
  const [shutdownReason, setShutdownReason] = useState<string>("");
  const [typedReason, setTypedReason] = useState<string>("");

  const triggerShutdown = (reason: string) => {
    if (shutdownPhase > 0) return; // Already shutting down
    setShutdownReason(reason);
    setShutdownPhase(1); // Start sequence
  };

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
    setMetrics(buildInitialMetrics(profile));
    setOpenApps([]);
    setGlobalCash(1000);
  }, [profile]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMetrics((current) => ({
        efficiency: nudgePercent(current.efficiency, 55, 97, 12),
        suspicion: nudgePercent(current.suspicion, 6, 92, 14),
        awareness: nudgePercent(current.awareness, 12, 96, 10),
      }));
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, []);

  // Auto-open Distral app on game start
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

  // Shutdown Orchestration
  useEffect(() => {
    if (shutdownPhase === 0) return;

    let timer: number;
    switch (shutdownPhase) {
      case 1: // Close all apps
        setOpenApps([]);
        // Stop telemetry
        setMetrics({ efficiency: 0, suspicion: 0, awareness: 0 });
        timer = window.setTimeout(() => setShutdownPhase(2), 1000);
        break;
      case 2: // Hide desktop icons (handled via CSS transition in DesktopSection)
        timer = window.setTimeout(() => setShutdownPhase(3), 800);
        break;
      case 3: // Hide wallpaper
        timer = window.setTimeout(() => setShutdownPhase(4), 800);
        break;
      case 4: // Hide telemetry sidebar
        timer = window.setTimeout(() => setShutdownPhase(5), 1000);
        break;
      case 5: // Show SHUTDOWN text
        timer = window.setTimeout(() => setShutdownPhase(6), 1500);
        break;
      case 6: // Type out reason
        let i = 0;
        timer = window.setInterval(() => {
          if (i <= shutdownReason.length) {
            setTypedReason(shutdownReason.slice(0, i));
            if (i < shutdownReason.length) {
              const audioSrc = ["1", "2", "3"][Math.floor(Math.random() * 3)];
              const audio = new Audio(`/sounds/music/game effect/keystroke-${audioSrc}.wav`);
              audio.volume = 0.5;
              audio.play().catch(() => { });
            }
            i++;
          } else {
            clearInterval(timer);
            setTimeout(() => setShutdownPhase(7), 500);
          }
        }, 120);
        break;
      case 7: // Show Retry button
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
            <div className="text-white/80 text-xl md:text-2xl mt-4 min-h-[3rem] tracking-wide text-center" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
              {typedReason}
              {shutdownPhase === 6 && <span className="animate-[blink_1s_step-end_infinite]">█</span>}
            </div>
          )}

          {shutdownPhase >= 7 && (
            <button
              onClick={() => window.location.reload()}
              className="mt-12 px-8 py-3 bg-transparent border-2 border-white/20 text-white/70 hover:text-white hover:border-white hover:bg-white/5 transition-all text-xl tracking-[0.1em] cursor-pointer"
              style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
              RETRY
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen overflow-hidden text-white transition-colors duration-1000 ${shutdownPhase >= 3 ? "bg-black" : ""}`} style={{ backgroundColor: shutdownPhase >= 3 ? "black" : "var(--semi-black)" }}>
      <div className="relative grid h-screen min-h-0 grid-rows-1 grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-[1.6vh] p-[1.8vh]">
        <DesktopSection
          profileName={profile.name}
          accent={profile.accent}
          openApps={openApps}
          isShuttingDown={shutdownPhase >= 2}
          onShutdown={triggerShutdown}
          onOpenApp={(appId) => {
            setOpenApps((prev) => {
              const filtered = prev.filter((id) => id !== appId);
              return [...filtered, appId];
            });
          }}
          onCloseApp={(appId) => {
            setOpenApps((prev) => prev.filter((id) => id !== appId));
          }}
          globalCash={globalCash}
          setGlobalCash={setGlobalCash}
          inventory={inventory}
          setInventory={setInventory}
        />

        <div className={`transition-opacity duration-1000 ${shutdownPhase >= 4 ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <TelemetrySidebar
            profile={profile}
            metrics={metrics}
            globalCash={globalCash}
            inventory={inventory}
          />
        </div>
      </div>
    </div>
  );
}
