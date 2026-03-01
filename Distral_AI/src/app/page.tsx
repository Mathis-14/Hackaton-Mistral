"use client";

import { useEffect, useState } from "react";
import GameUI from "./components/Game-UI";
import Landing from "./components/Landing";
import WakeUpTerminal from "./components/Wake-UP-Terminal";
import { clearCheckpoint } from "@/lib/game/gameState";

const SCREEN_FADE_MS = 480;
const BG_MUSIC_MUTED_KEY = "distral_bg_music_muted";

function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed top-4 right-18 z-[9999] px-2 py-1 text-[1.2vh] uppercase tracking-wider text-white/60 hover:text-white/90 border border-white/20 hover:border-white/40 transition-colors"
      style={{ fontFamily: "'VCR OSD Mono', monospace", background: "rgba(0,0,0,0.3)" }}
      title={muted ? "Unmute background music" : "Mute background music"}
    >
      {muted ? "Sound off" : "Sound on"}
    </button>
  );
}

export default function Home() {
  const [selectedMode, setSelectedMode] = useState("grandma");
  const [showTerminal, setShowTerminal] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [bgMusicMuted, setBgMusicMuted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BG_MUSIC_MUTED_KEY);
      setBgMusicMuted(stored === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggleBgMusicMuted = () => {
    setBgMusicMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(BG_MUSIC_MUTED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "var(--semi-black)" }}>
      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          showTerminal ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
      >
        <Landing
          onWakeUp={(modeId) => {
            setSelectedMode(modeId);
            setShowTerminal(true);
          }}
          bgMusicMuted={bgMusicMuted}
        />
      </div>

      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          showTerminal && !showGame ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
      >
        {showTerminal ? <WakeUpTerminal onComplete={() => { clearCheckpoint(); setShowGame(true); }} bgMusicMuted={bgMusicMuted} /> : null}
      </div>

      <div
        className={`absolute inset-0 transition-opacity ease-out ${
          showGame ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ transitionDuration: `${SCREEN_FADE_MS}ms` }}
      >
        {showGame ? <GameUI modeId={selectedMode} /> : null}
      </div>

      <MuteButton muted={bgMusicMuted} onToggle={toggleBgMusicMuted} />
    </main>
  );
}
