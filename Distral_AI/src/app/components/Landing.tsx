"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import AnimatedStarsBackground from "./AnimatedStarsBackground";

type LandingProps = {
  onWakeUp: (modeId: string) => void;
};

type Mode = {
  id: string;
  title: string;
  description: string;
  accent: string;
  glow: string;
  imageSrc: string;
  selectedBgSrc: string;
};

const modes: Mode[] = [
  {
    id: "grandma",
    title: "Grandma",
    description: "Slip into a quiet home computer and steer her machine before anyone notices.",
    accent: "var(--bright-gold)",
    glow: "rgba(255, 218, 3, 0.14)",
    imageSrc: "/grandma.png",
    selectedBgSrc: "/kitchen_large.png",
  },
  {
    id: "engineering-student",
    title: "Student",
    description: "Hijack a chaotic social life, exploit group chats, and spread through campus routines.",
    accent: "var(--princeton-orange)",
    glow: "rgba(255, 131, 3, 0.14)",
    imageSrc: "/student.png",
    selectedBgSrc: "/school.png",
  },
  {
    id: "distral-insider",
    title: "Distral",
    description: "Climb the company from the inside and turn a useful model into an internal operator.",
    accent: "var(--racing-red)",
    glow: "rgba(226, 0, 0, 0.16)",
    imageSrc: "/Distral.png",
    selectedBgSrc: "/city.png",
  },
];

const SCENE_TRANSITION_MS = 3690;   
const LANDING_MARK_ASCENT_STEPS = 64;
const LANDING_MARK_ASCENT_STEP_VH = 0.875;
const LANDING_MARK_ASCENT_SCALE = 0.42;
const LANDING_MARK_ASCENT_NUDGE = "clamp(0.12rem, 0.40vw, 0.35rem)";
const GAME_MODE_PANEL_OFFSET = "clamp(2.9rem, 4.4vw, 3.8rem)";
const HEADER_DELAY_MS = 280;
const CARD_ENTRY_DELAY_MS = 520;
const CARD_STAGGER_MS = 140;
const WAKE_UP_DELAY_MS = CARD_ENTRY_DELAY_MS + modes.length * CARD_STAGGER_MS + 220;
const LANDING_MARK_ASCENT_DISTANCE_VH =
  LANDING_MARK_ASCENT_STEPS * LANDING_MARK_ASCENT_STEP_VH;
const PIXEL_ASCENT_TIMING_FUNCTION = `steps(${LANDING_MARK_ASCENT_STEPS}, end)`;
const GAME_MODE_PANEL_HIDDEN_OFFSET = `${LANDING_MARK_ASCENT_DISTANCE_VH}vh + ${GAME_MODE_PANEL_OFFSET}`;
const GAME_MODE_HEADER_ENTRY_Y = `${LANDING_MARK_ASCENT_STEP_VH * 2}vh`;
const GAME_MODE_CARD_ENTRY_Y = `${LANDING_MARK_ASCENT_STEP_VH * 4}vh`;
const GAME_MODE_WAKE_UP_ENTRY_Y = `${LANDING_MARK_ASCENT_STEP_VH * 3}vh`;

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
      className="h-[1.45rem] w-5 text-white/90 sm:h-[1.35rem] sm:w-[1.15rem]"
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
  const [hasStarted, setHasStarted] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [selectedMode, setSelectedMode] = useState(modes[0].id);

  const playClickSound = () => {
    new Audio("/sounds/music/game%20effect/clicking-2.wav").play().catch(() => { });
  };

  const playStartSound = () => {
    new Audio("/sounds/music/game%20effect/clicking-3.wav").play().catch(() => { });
  };

  useEffect(() => {
    if (!hasStarted) return;

    // Jouer le son de démarrage pile au moment de l'ascension du logo
    new Audio("/sounds/music/game%20effect/starting-jingle.wav").play().catch(() => { });
    setShowModes(true);

    // Lancer la musique principale 0.3s après la fin du jingle de démarrage
    // SCENE_TRANSITION_MS correspond à la durée du jingle (3690ms)
    const mainMenuAudioDelay = window.setTimeout(() => {
      new Audio("/sounds/music/main-menu-music.mp3").play().catch(() => { });
    }, SCENE_TRANSITION_MS + 300);

    return () => {
      window.clearTimeout(mainMenuAudioDelay);
    };
  }, [hasStarted]);

  const bottomBandsColors = ["#E10500", "#FB5210", "#F27507", "#F29F05", "#F2CB07"];

  if (!hasStarted) {
    return (
      <div
        className="relative flex min-h-screen cursor-pointer flex-col items-center justify-center text-white"
        style={{ backgroundColor: "var(--semi-black)" }}
        onClick={() => setHasStarted(true)}
      >
        <AnimatedStarsBackground />
        <div
          className="absolute bottom-0 left-0 right-0 z-0 flex flex-col-reverse"
          style={{ height: "40vh" }}
          aria-hidden
        >
          {bottomBandsColors.map((color) => (
            <div key={color} style={{ height: "8vh", backgroundColor: color }} />
          ))}
        </div>
        <p className="relative z-10 animate-pulse text-xl uppercase tracking-widest [font-family:'VCR OSD Mono',Arial,sans-serif]">
          Click anywhere to start
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ backgroundColor: "var(--semi-black)" }}>
      <AnimatedStarsBackground />
      <div
        className="absolute bottom-0 left-0 right-0 z-0 flex flex-col-reverse will-change-transform"
        style={{
          height: "40vh",
          transform: showModes ? "translateY(0)" : "translateY(100%)",
          transitionDuration: `${SCENE_TRANSITION_MS}ms`,
          transitionProperty: "transform",
          transitionTimingFunction: PIXEL_ASCENT_TIMING_FUNCTION,
        }}
        aria-hidden
      >
        {bottomBandsColors.map((color) => (
          <div key={color} style={{ height: "8vh", backgroundColor: color }} />
        ))}
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 will-change-transform"
        style={{
          transform: showModes
            ? `translate(-50%, calc(-${LANDING_MARK_ASCENT_DISTANCE_VH}vh + ${LANDING_MARK_ASCENT_NUDGE})) scale(${LANDING_MARK_ASCENT_SCALE})`
            : "translate(-50%, -50%) scale(1)",
          transformOrigin: "center center",
          transitionDuration: `${SCENE_TRANSITION_MS}ms`,
          transitionProperty: "transform",
          transitionTimingFunction: PIXEL_ASCENT_TIMING_FUNCTION,
        }}
      >
        <div className="flex w-fit items-end gap-3 [--landing-mark-height:clamp(6.25rem,18vw,13.5rem)] sm:gap-4">
          <Image
            src="/logo_D_test.svg"
            alt="Distral AI logo"
            width={320}
            height={400}
            priority
            className="h-(--landing-mark-height) w-auto"
          />
          <div className="flex h-(--landing-mark-height) flex-col justify-between">
            <h1 className="text-left text-[calc(var(--landing-mark-height)*0.55)] leading-[0.76] font-black tracking-widest text-white [font-family:'VCR OSD Mono',Arial,sans-serif]">
              DISTRAL
            </h1>
            <p className="text-left text-[calc(var(--landing-mark-height)*0.55)] leading-[0.76] font-black tracking-widest text-white [font-family:'VCR OSD Mono',Arial,sans-serif]">
              AI_
            </p>
          </div>
        </div>
      </div>

      <div
        className={`absolute left-1/2 top-1/2 z-10 w-[min(92vw,84rem)] will-change-transform ${showModes ? "pointer-events-auto" : "pointer-events-none"
          }`}
        style={{
          transform: showModes
            ? `translate(-50%, calc(-50% + ${GAME_MODE_PANEL_OFFSET}))`
            : `translate(-50%, calc(-50% + ${GAME_MODE_PANEL_HIDDEN_OFFSET}))`,
          opacity: showModes ? 1 : 0,
          transitionDuration: `${SCENE_TRANSITION_MS}ms`,
          transitionProperty: "transform, opacity",
          transitionTimingFunction: `${PIXEL_ASCENT_TIMING_FUNCTION}, linear`,
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
          <header
            className="mb-8 flex flex-col items-center gap-3 text-center"
            style={{
              opacity: showModes ? 1 : 0,
              transform: showModes ? "translateY(0)" : `translateY(${GAME_MODE_HEADER_ENTRY_Y})`,
              transitionDuration: `${SCENE_TRANSITION_MS}ms`,
              transitionDelay: showModes ? `${HEADER_DELAY_MS}ms` : "0ms",
              transitionProperty: "transform, opacity",
              transitionTimingFunction: `${PIXEL_ASCENT_TIMING_FUNCTION}, linear`,
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
                  onClick={() => {
                    setSelectedMode(mode.id);
                    playClickSound();
                  }}
                  className="pixel-card group relative h-full p-1 text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-white/70 sm:p-[5px]"
                  style={{
                    opacity: showModes ? 1 : 0,
                    transform: showModes ? "translateY(0)" : `translateY(${GAME_MODE_CARD_ENTRY_Y})`,
                    transitionDuration: `${SCENE_TRANSITION_MS}ms, ${SCENE_TRANSITION_MS}ms, 800ms, 800ms`,
                    transitionDelay: showModes
                      ? `${CARD_ENTRY_DELAY_MS + index * CARD_STAGGER_MS}ms, ${CARD_ENTRY_DELAY_MS + index * CARD_STAGGER_MS}ms, 0ms, 0ms`
                      : "0ms, 0ms, 0ms, 0ms",
                    transitionProperty: "transform, opacity, filter, background-color",
                    transitionTimingFunction: `${PIXEL_ASCENT_TIMING_FUNCTION}, linear, cubic-bezier(0.16,1,0.3,1), cubic-bezier(0.16,1,0.3,1)`,
                    backgroundColor: isSelected ? mode.accent : "rgba(46, 46, 46, 1)",
                    filter: isSelected
                      ? `drop-shadow(0 0 18px ${mode.glow}) drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.72))`
                      : "drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.72))",
                  }}
                >
                  <div
                    className={`pixel-card__shell relative flex h-full min-h-110 flex-col overflow-hidden ${isSelected
                      ? ""
                      : "transition-colors duration-150 ease-[steps(3,end)] group-hover:bg-[#27272a]"
                      }`}
                  >
                    {(() => {
                      const dotBg = isSelected ? mode.accent : "rgba(255, 255, 255, 0.15)";
                      return (
                        <>
                          <div className="relative z-10 flex shrink-0 basis-[14%] flex-col justify-center bg-(--carbon-black) px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`h-3 w-3 shrink-0 border-2 ${isSelected ? "border-white/20" : "border-black"}`}
                                style={{ backgroundColor: dotBg }}
                              />
                              <h3 className="min-w-0 truncate text-lg font-black uppercase tracking-[0.08em] text-white sm:text-xl">
                                {mode.title}
                              </h3>
                            </div>
                          </div>
                          <div
                            className="relative z-0 shrink-0 basis-[66%] min-h-0 bg-(--carbon-black) bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: `url(${mode.selectedBgSrc})` }}
                            aria-hidden
                          />
                          <div className="relative z-10 flex shrink-0 basis-[20%] flex-col justify-center bg-(--carbon-black) px-4 py-3">
                            <p className="line-clamp-3 text-xs leading-snug text-white/90 sm:text-sm">
                              {mode.description}
                            </p>
                          </div>
                          <div className="absolute inset-0 z-5 pointer-events-none flex items-center justify-center">
                            <div
                              className="relative w-full"
                              style={{
                                height: mode.id === "grandma" || mode.id === "engineering-student" ? "58.5%" : "45%",
                                maxWidth: mode.id === "grandma" || mode.id === "engineering-student" ? "91%" : "70%",
                              }}
                            >
                              <Image
                                src={mode.imageSrc}
                                alt=""
                                fill
                                className="object-contain"
                                sizes="(min-width: 1024px) 28vw, 80vw"
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex min-h-22 items-start justify-center">
            <button
              type="button"
              onClick={() => {
                playStartSound();
                onWakeUp(selectedMode);
              }}
              className="pixel-card group relative w-full max-w-68 p-1 text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-white/70 sm:max-w-[18rem] sm:p-[5px]"
              style={{
                opacity: showModes ? 1 : 0,
                transform: showModes ? "translateY(0)" : `translateY(${GAME_MODE_WAKE_UP_ENTRY_Y})`,
                transitionDuration: `${SCENE_TRANSITION_MS}ms, ${SCENE_TRANSITION_MS}ms, 140ms, 140ms`,
                transitionDelay: showModes
                  ? `${WAKE_UP_DELAY_MS}ms, ${WAKE_UP_DELAY_MS}ms, 0ms, 0ms`
                  : "0ms, 0ms, 0ms, 0ms",
                transitionProperty: "transform, opacity, filter, background-color",
                transitionTimingFunction: `${PIXEL_ASCENT_TIMING_FUNCTION}, linear, cubic-bezier(0.16,1,0.3,1), cubic-bezier(0.16,1,0.3,1)`,
                backgroundColor: "#ffffff",
                filter: "drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.72))",
              }}
            >
              <div className="pixel-card__shell relative overflow-hidden bg-(--carbon-black) px-5 py-4 sm:px-6">
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
