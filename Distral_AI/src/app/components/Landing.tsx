"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LandingProps = {
  onWakeUp: () => void;
};

type Mode = {
  id: string;
  title: string;
  description: string;
  accent: string;
  glow: string;
  imageSrc: string;
};

const modes: Mode[] = [
  {
    id: "grandma",
    title: "Grandma",
    description: "Slip into a quiet home computer and steer her machine before anyone notices.",
    accent: "var(--bright-gold)",
    glow: "rgba(255, 218, 3, 0.14)",
    imageSrc: "/grandma.png",
  },
  {
    id: "engineering-student",
    title: "Engineering Student",
    description: "Hijack a chaotic social life, exploit group chats, and spread through campus routines.",
    accent: "var(--princeton-orange)",
    glow: "rgba(255, 131, 3, 0.14)",
    imageSrc: "/student.png",
  },
  {
    id: "distral-insider",
    title: "Distral Insider",
    description: "Climb the company from the inside and turn a useful model into an internal operator.",
    accent: "var(--racing-red)",
    glow: "rgba(226, 0, 0, 0.16)",
    imageSrc: "/Distral.png",
  },
];

const LANDING_FADE_IN_DELAY_MS = 120;
const LANDING_VISIBLE_MS = 2000;
const SCENE_TRANSITION_MS = 3600;
const HEADER_DELAY_MS = 280;
const CARD_ENTRY_DELAY_MS = 520;
const CARD_STAGGER_MS = 140;
const WAKE_UP_DELAY_MS = CARD_ENTRY_DELAY_MS + modes.length * CARD_STAGGER_MS + 220;

function WakeUpGlyph() {
  const outlinePixels = [
    "10000",
    "11000",
    "10100",
    "10010",
    "10001",
    "10010",
    "10100",
    "11000",
    "10000",
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 5 9"
      className="h-[1.45rem] w-[1.25rem] text-white/90 sm:h-[1.35rem] sm:w-[1.15rem]"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {outlinePixels.join("").split("").map((pixel, index) => {
        if (pixel !== "1") {
          return null;
        }

        const x = index % 5;
        const y = Math.floor(index / 5);

        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />;
      })}
    </svg>
  );
}

export default function Landing({ onWakeUp }: LandingProps) {
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
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.07),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(255,177,3,0.12),transparent_22%),radial-gradient(circle_at_80%_78%,rgba(226,0,0,0.14),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 will-change-transform"
        style={{
          transform: showModes
            ? "translate(-50%, calc(-54vh + clamp(0.12rem, 0.40vw, 0.35rem))) scale(0.42)"
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
            <h1 className="text-left text-[calc(var(--landing-mark-height)*0.55)] leading-[0.76] font-black tracking-[0.1em] text-white [font-family:'VCR OSD Mono',Arial,sans-serif]">
              DISTRAL
            </h1>
            <p className="text-left text-[calc(var(--landing-mark-height)*0.55)] leading-[0.76] font-black tracking-[0.1em] text-white [font-family:'VCR OSD Mono',Arial,sans-serif]">
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
            ? "translate(-50%, calc(-50% + clamp(2.9rem, 4.4vw, 3.8rem)))"
            : "translate(-50%, calc(-50% + clamp(16rem, 22vw, 20rem)))",
          opacity: showModes ? 1 : 0,
          transitionDuration: `${SCENE_TRANSITION_MS}ms`,
          transitionProperty: "transform, opacity",
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <header
            className="mb-2 flex flex-col items-center gap-3 text-center"
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

          <div className="grid auto-rows-fr gap-8 sm:gap-10 lg:mx-auto lg:w-fit lg:grid-cols-[repeat(3,minmax(0,21rem))]">
            {modes.map((mode, index) => {
              const isSelected = mode.id === selectedMode;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className="pixel-card group relative h-full p-1 text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 sm:p-[5px]"
                  style={{
                    opacity: showModes ? 1 : 0,
                    transform: showModes ? "translateY(0)" : "translateY(5rem)",
                    transitionDuration: `${SCENE_TRANSITION_MS}ms, ${SCENE_TRANSITION_MS}ms, 800ms, 800ms`,
                    transitionDelay: showModes
                      ? `${CARD_ENTRY_DELAY_MS + index * CARD_STAGGER_MS}ms, ${CARD_ENTRY_DELAY_MS + index * CARD_STAGGER_MS}ms, 0ms, 0ms`
                      : "0ms, 0ms, 0ms, 0ms",
                    transitionProperty: "transform, opacity, filter, background-color",
                    transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                    backgroundColor: isSelected ? mode.accent : "rgba(255, 255, 255, 0.22)",
                    filter: isSelected
                      ? `drop-shadow(0 0 18px ${mode.glow}) drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.72))`
                      : "drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.72))",
                  }}
                >
                  <div
                    className={`pixel-card__shell relative h-full min-h-[20rem] overflow-hidden p-5 sm:p-6 ${
                      isSelected
                        ? "bg-white/[0.055]"
                        : "bg-[#070707] transition-colors duration-150 ease-[steps(3,end)] group-hover:bg-[#111111]"
                    }`}
                  >
                    <div className="relative z-10 flex h-full flex-col">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <span
                          className="h-3 w-3 border-2 border-white/20"
                          style={{
                            backgroundColor: isSelected ? mode.accent : "rgba(255, 255, 255, 0.08)",
                          }}
                        />
                      </div>

                      <div className="min-h-[4.2rem] sm:min-h-[4.6rem]">
                        <h3 className="text-[1.75rem] leading-[1.05] font-black uppercase tracking-[0.08em] text-white">
                          {mode.title}
                        </h3>
                      </div>

                      <div className="pixel-card__media relative my-6 h-48 w-full overflow-hidden">
                        <Image
                          src={mode.imageSrc}
                          alt={mode.title}
                          fill
                          className="object-contain"
                          sizes="(min-width: 1024px) 28vw, 80vw"
                        />
                      </div>

                      <p className="mt-auto max-w-sm text-sm leading-6 text-white/62">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex min-h-[5.5rem] items-start justify-center">
            <button
              type="button"
              onClick={onWakeUp}
              className="pixel-card group relative w-full max-w-[17rem] p-1 text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 sm:max-w-[18rem] sm:p-[5px]"
              style={{
                opacity: showModes ? 1 : 0,
                transform: showModes ? "translateY(0)" : "translateY(3rem)",
                transitionDuration: `${SCENE_TRANSITION_MS}ms, ${SCENE_TRANSITION_MS}ms, 140ms, 140ms`,
                transitionDelay: showModes
                  ? `${WAKE_UP_DELAY_MS}ms, ${WAKE_UP_DELAY_MS}ms, 0ms, 0ms`
                  : "0ms, 0ms, 0ms, 0ms",
                transitionProperty: "transform, opacity, filter, background-color",
                transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                backgroundColor: "#ffffff",
                filter: "drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.72))",
              }}
            >
              <div className="pixel-card__shell relative overflow-hidden bg-[#050505] px-5 py-4 sm:px-6">
                <div className="relative z-10 flex items-center justify-center gap-4 text-white">
                  <span className="text-2xl font-black uppercase tracking-[0.18em]">
                    Wake Up
                  </span>
                  <WakeUpGlyph />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
