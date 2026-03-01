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
  const [gameKey, setGameKey] = useState(0);

  const handleRestart = () => {
    clearCheckpoint();
    setGameKey((previous) => previous + 1);
  };

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
        {showGame ? <GameUI key={gameKey} modeId={selectedMode} /> : null}
      </div>

      {showGame && (
        <div className="absolute top-[4.5vh] right-[3.5vh] z-50 pointer-events-auto">
          <button
            type="button"
            onClick={handleRestart}
            className="pixel-card p-[0.6vh] transition-opacity hover:opacity-90"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            <div
              className="pixel-card__shell px-[2vh] py-[1vh] text-[1.1vh] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(35,35,35,0.98)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              Restart
            </div>
          </button>
        </div>
      )}
    </main>
  );
}
