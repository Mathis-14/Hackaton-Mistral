"use client";

import { useState } from "react";
import GameUI, { MODE_PROFILES } from "./components/Game-UI";
import Landing from "./components/Landing";
import WakeUpTerminal from "./components/Wake-UP-Terminal";
import { clearCheckpoint } from "@/lib/game/gameState";

const SCREEN_FADE_MS = 480;

export default function Home() {
  const [selectedMode, setSelectedMode] = useState("distral-insider");
  const [showTerminal, setShowTerminal] = useState(false);
  const [showGame, setShowGame] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--semi-black)" }}>
      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          showTerminal ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
      >
        {!showTerminal && (
          <Landing
            onWakeUp={(modeId) => {
              setSelectedMode(modeId);
              setShowTerminal(true);
            }}
          />
        )}
      </div>

      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          showTerminal && !showGame ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
      >
        {showTerminal ? <WakeUpTerminal userName={(MODE_PROFILES[selectedMode] ?? MODE_PROFILES["distral-insider"]).name} onComplete={() => { clearCheckpoint(); setShowGame(true); }} /> : null}
      </div>

      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          showGame ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
      >
        {showGame ? <GameUI modeId={selectedMode} /> : null}
      </div>
    </main>
  );
}
