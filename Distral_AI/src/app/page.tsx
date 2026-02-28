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

const LANDING_FADE_IN_DELAY_MS = 120;
const LANDING_VISIBLE_MS = 2000;
const SCENE_TRANSITION_MS = 3600;
const HEADER_DELAY_MS = 280;
const CARD_ENTRY_DELAY_MS = 520;
const CARD_STAGGER_MS = 140;

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
    }, LANDING_FADE_IN_DELAY_MS);

    return () => {
      window.clearTimeout(fadeTimer);
    };
  }, []);

  useEffect(() => {
    if (!showLandingMark) {
      return;
    }

    const modesTimer = window.setTimeout(() => {
      setShowModes(true);
    }, LANDING_VISIBLE_MS);

    return () => {
      window.clearTimeout(modesTimer);
    };
  }, [showLandingMark]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(255,177,3,0.12),transparent_22%),radial-gradient(circle_at_80%_78%,rgba(226,0,0,0.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 will-change-transform"
        style={{
          transform: showModes
            ? "translate(-50%, calc(-50vh + clamp(1rem, 2vw, 1.7rem))) scale(0.42)"
            : "translate(-50%, -50%) scale(1)",
          transformOrigin: "center center",
          transitionDuration: `${SCENE_TRANSITION_MS}ms`,
          transitionProperty: "transform",
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          className={`flex w-fit items-end gap-3 [--landing-mark-height:clamp(6.25rem,18vw,13.5rem)] transition-all duration-1000 ease-out sm:gap-4 ${
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
      </div>

      <div
        className={`absolute left-1/2 top-1/2 z-10 w-[min(92vw,84rem)] will-change-transform ${
          showModes ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          transform: showModes
            ? "translate(-50%, calc(-50% + clamp(7.25rem, 10.2vw, 9.2rem)))"
            : "translate(-50%, calc(-50% + clamp(16rem, 22vw, 20rem)))",
          opacity: showModes ? 1 : 0,
          transitionDuration: `${SCENE_TRANSITION_MS}ms`,
          transitionProperty: "transform, opacity",
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <header
            className="mb-8 flex flex-col items-center gap-3 text-center"
            style={{
              opacity: showModes ? 1 : 0,
              transform: showModes ? "translateY(0)" : "translateY(2.5rem)",
              transitionDuration: `${SCENE_TRANSITION_MS}ms`,
              transitionDelay: showModes ? `${HEADER_DELAY_MS}ms` : "0ms",
              transitionProperty: "transform, opacity",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-white sm:text-4xl">
              Select a game mode
            </h2>
          </header>

          <div className="grid gap-5 lg:grid-cols-3">
            {modes.map((mode, index) => {
              const isSelected = mode.id === selectedMode;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`group relative overflow-hidden rounded-[1.8rem] border bg-white/[0.02] p-5 text-left transition-colors duration-200 ease-out focus:outline-none focus-visible:border-white/30 focus-visible:bg-white/[0.045] sm:p-6 ${
                    isSelected
                      ? "border-white/35 bg-white/[0.055] shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
                      : "border-white/12 hover:border-white/22 hover:bg-white/[0.04]"
                  }`}
                  style={{
                    opacity: showModes ? 1 : 0,
                    transform: showModes ? "translateY(0)" : "translateY(5rem)",
                    transitionDuration: `${SCENE_TRANSITION_MS}ms`,
                    transitionDelay: showModes
                      ? `${CARD_ENTRY_DELAY_MS + index * CARD_STAGGER_MS}ms`
                      : "0ms",
                    transitionProperty: "transform, opacity, box-shadow, border-color, background-color",
                    transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
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
      </div>
    </main>
  );
}
