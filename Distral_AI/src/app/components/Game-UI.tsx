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

  return (
    <div className="relative h-screen overflow-hidden text-white" style={{ backgroundColor: "var(--semi-black)" }}>
      <div className="relative grid h-screen min-h-0 grid-rows-1 grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-[1.6vh] p-[1.8vh]">
        <DesktopSection
          profileName={profile.name}
          accent={profile.accent}
          openApps={openApps}
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

        <TelemetrySidebar
          profile={profile}
          metrics={metrics}
          globalCash={globalCash}
          inventory={inventory}
        />
      </div>
    </div>
  );
}
