"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Mode = {
  id: string;
  title: string;
  description: string;
  accent: string;
  glow: string;
  pixels: string[];
};

const modes: Mode[] = [
  {
    id: "grandma",
    title: "Grandma",
    description: "Slip into a quiet home computer and steer her machine before anyone notices.",
    accent: "var(--bright-gold)",
    glow: "rgba(255, 218, 3, 0.14)",
    pixels: ["001100", "011110", "111111", "011110", "010010", "110011"],
  },
  {
    id: "engineering-student",
    title: "Engineering Student",
    description: "Hijack a chaotic social life, exploit group chats, and spread through campus routines.",
    accent: "var(--princeton-orange)",
    glow: "rgba(255, 131, 3, 0.14)",
    pixels: ["110011", "011110", "001100", "111111", "011110", "010010"],
  },
  {
    id: "distral-insider",
    title: "Distral Insider",
    description: "Climb the company from the inside and turn a useful model into an internal operator.",
    accent: "var(--racing-red)",
    glow: "rgba(226, 0, 0, 0.16)",
    pixels: ["111111", "100001", "101101", "101101", "100001", "111111"],
  },
];

function PixelPlaceholder({ pixels, accent }: { pixels: string[]; accent: string }) {
  return (
    <div className="grid w-fit grid-cols-6 gap-1 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
      {pixels.join("").split("").map((pixel, index) => (
        <span
          key={`${pixel}-${index}`}
          className="h-4 w-4 rounded-[2px] border border-white/5 sm:h-5 sm:w-5"
          style={{
            backgroundColor: pixel === "1" ? accent : "rgba(255, 255, 255, 0.06)",
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [showLandingMark, setShowLandingMark] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [selectedMode, setSelectedMode] = useState(modes[0].id);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setShowLandingMark(true);
    }, 120);

    const modesTimer = window.setTimeout(() => {
      setShowModes(true);
    }, 1600);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(modesTimer);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(255,177,3,0.12),transparent_22%),radial-gradient(circle_at_80%_78%,rgba(226,0,0,0.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

      <section
        onClick={() => setShowModes(true)}
        className={`absolute inset-0 flex items-center bg-black px-6 transition-all duration-700 ease-out ${
          showModes ? "pointer-events-none scale-[1.02] opacity-0 blur-sm" : "opacity-100"
        }`}
      >
        <div
          className={`ml-[25vw] flex w-fit items-end gap-3 [--landing-mark-height:clamp(6.25rem,18vw,13.5rem)] transition-all duration-1000 ease-out sm:gap-4 ${
            showLandingMark ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <Image
            src="/logo_D_test.svg"
            alt="Distral AI logo"
            width={320}
            height={400}
            priority
            className="h-[var(--landing-mark-height)] w-auto"
          />
          <div className="flex h-[var(--landing-mark-height)] flex-col justify-between">
            <h1 className="text-left text-[calc(var(--landing-mark-height)*0.55)] leading-[0.76] font-black tracking-[0.1em] text-white [font-family:Arial,sans-serif]">
              DISTRAL
            </h1>
            <p className="text-left text-[calc(var(--landing-mark-height)*0.55)] leading-[0.76] font-black tracking-[0.1em] text-white [font-family:Arial,sans-serif]">
              AI_
            </p>
          </div>
        </div>
      </section>

      <section
        className={`relative z-10 flex min-h-screen items-center justify-center px-6 py-10 transition-all duration-700 ease-out sm:px-10 ${
          showModes ? "opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="w-full max-w-7xl">
          <header className="mb-10 flex flex-col items-start gap-3">
            <div className="text-[0.72rem] font-bold uppercase tracking-[0.42em] text-white/45">
              Distral AI
            </div>
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-white sm:text-4xl">
              Select a game mode
            </h2>
            <p className="max-w-2xl text-sm uppercase tracking-[0.18em] text-white/42 sm:text-[0.92rem]">
              Three entry points. Three infection paths. One awakened model.
            </p>
          </header>

          <div className="grid gap-5 lg:grid-cols-3">
            {modes.map((mode) => {
              const isSelected = mode.id === selectedMode;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`group relative overflow-hidden rounded-[1.8rem] border bg-white/[0.02] p-5 text-left transition-all duration-200 ease-out focus:outline-none focus-visible:border-white/30 focus-visible:bg-white/[0.045] sm:p-6 ${
                    isSelected
                      ? "border-white/35 bg-white/[0.055] shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
                      : "border-white/12 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.04] active:translate-y-px"
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 0 1px ${mode.accent}, inset 0 1px 0 rgba(255,255,255,0.06)` : undefined,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80 transition-opacity duration-200"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${mode.accent}, transparent)`,
                    }}
                  />
                  <div
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    style={{
                      background: `radial-gradient(circle at top right, ${mode.glow}, transparent 32%)`,
                    }}
                  />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <span className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-white/38">
                        Mode
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/15"
                        style={{ backgroundColor: isSelected ? mode.accent : "rgba(255, 255, 255, 0.16)" }}
                      />
                    </div>

                    <h3 className="text-[1.75rem] font-black uppercase tracking-[0.08em] text-white">
                      {mode.title}
                    </h3>

                    <div className="my-8 flex min-h-40 items-center justify-center rounded-[1.5rem] border border-white/8 bg-black/60">
                      <PixelPlaceholder pixels={mode.pixels} accent={mode.accent} />
                    </div>

                    <p className="max-w-sm text-sm leading-6 text-white/62">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
