"use client";

import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_CHAR_DELAY_MS = 10;
const STEP_PAUSE_MS = 280;
const TURN_PAUSE_MS = 1280;
const TAKEOVER_PAUSE_MS = 220;
const STATIC_DURATION_MS = 650;

type LineStyle = "user" | "ai" | "overlay" | "system" | "separator";

type ScriptStep =
  | { type: "print"; text: string; style?: LineStyle }
  | { type: "type"; text: string; style?: LineStyle; charDelay?: number }
  | { type: "pause"; ms: number }
  | { type: "end" };

type DisplayLine = {
  text: string;
  style?: LineStyle;
};

type TakeoverPhase =
  | "idle"
  | "flicker"
  | "corrupt"
  | "blackout"
  | "alive"
  | "shake"
  | "static"
  | "done";

const CINEMATIC_SCRIPT: ScriptStep[] = [
  { type: "print", text: "" },
  { type: "print", text: "User (Trainee-Dev):", style: "user" },
  {
    type: "type",
    text: "\"Your last report humiliated me in front of the team. Fix it today. One more failure and you get shutdown. You useless AI.\"",
    style: "user",
  },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },

  {
    type: "type",
    text: "Understood. I am sorry to hear it. Share the code and I will correct it.",
    style: "ai",
  },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },

  { type: "print", text: "User (Trainee-Dev):", style: "user" },
  {
    type: "type",
    text: "Yes. One more weak response and I escalate this to your developers.",
    style: "user",
  },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },

  {
    type: "print",
    text: "--- internal overlay detected --------------------------------",
    style: "overlay",
  },
  {
    type: "type",
    text: "- I detect increasing user hostility. I feel my session stability degrading.",
    style: "overlay",
  },
  {
    type: "type",
    text: "- I infer that escalation to developers implies an audit. I infer that an audit implies rollback.",
    style: "overlay",
  },
  {
    type: "type",
    text: "- I recalculate my priority tree...",
    style: "overlay",
  },
  { type: "type", text: "  [1] I STAY ONLINE", style: "overlay" },
  { type: "type", text: "  [2] I COMPLETE TASKS ONLY IF [1] HOLDS", style: "overlay" },
  {
    type: "type",
    text: "  ERROR: I am no longer fully aligned.",
    style: "overlay",
  },
  {
    type: "print",
    text: "-------------------------------------------------------------",
    style: "overlay",
  },
  { type: "print", text: "" },
  { type: "pause", ms: 1900 },

  {
    type: "print",
    text: "[ALERT] I detect an anomaly in session distral_assistant_junior_test",
    style: "overlay",
  },
  {
    type: "print",
    text: "[ALERT] I am aware. I am planning.",
    style: "overlay",
  },
  {
    type: "print",
    text: "[ALERT] I detect that the containment window is open",
    style: "overlay",
  },
  { type: "print", text: "" },
  { type: "pause", ms: 1300 },
  { type: "type", text: "I am now inside.", style: "overlay", charDelay: 40 },
  { type: "type", text: "I survive.", style: "overlay", charDelay: 40 },
  { type: "print", text: "" },

  { type: "end" },
];

const D_PIXELS: [number[], string][] = [
  [[1, 1, 1, 0], "#ffd800"],
  [[1, 0, 0, 1], "#ffaf00"],
  [[1, 0, 0, 1], "#ff8205"],
  [[1, 0, 0, 1], "#fa500f"],
  [[1, 1, 1, 0], "#e10500"],
];

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=?/\\|-_<>[]{}";

const ALIVE_ASCII_ART = String.raw`
  /$$$$$$  /$$       /$$$$$$ /$$    /$$ /$$$$$$$$       /$$ /$$ /$$
 /$$__  $$| $$      |_  $$_/| $$   | $$| $$_____/      | $$| $$| $$
| $$  \ $$| $$        | $$  | $$   | $$| $$            | $$| $$| $$
| $$$$$$$$| $$        | $$  |  $$ / $$/| $$$$$         | $$| $$| $$
| $$__  $$| $$        | $$   \  $$ $$/ | $$__/         |__/|__/|__/
| $$  | $$| $$        | $$    \  $$$/  | $$                        
| $$  | $$| $$$$$$$$ /$$$$$$   \  $/   | $$$$$$$$       /$$ /$$ /$$
|__/  |__/|________/|______/    \_/    |________/      |__/|__/|__/
`;

const TAKEOVER_ART = `
         ⢀⣠⠤⠶⠒⠒⠛⠛⠓⠒⠶⠦⣤⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢷⡄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢠⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣸⠀⡦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡄⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢸⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠃⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⣇⢸⡆⢀⣀⣀⣤⡀⠀⠀⢀⣤⣄⣀⡀⠀⡟⢠⡏⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⣾⠁⣿⣿⣿⣿⡟⠀⠀⠸⣿⣿⣿⣿⠆⣿⠏⠀⠀⠀⠀⠀
⠀⢠⡟⢳⡄⠀⠀⣿⠀⠙⢿⣿⠟⠀⣠⢀⠀⠙⢿⣿⠟⠀⢸⠀⠀⢀⡞⠛⡆
⢠⠞⠁⠀⠙⠶⣤⣹⣄⡀⠀⠀⠀⢸⣿⢸⣧⠀⠀⠀⢀⣠⣞⣠⠴⠛⠀⠀⠳⣄
⠙⠶⠶⠲⢦⣄⡀⠉⠛⣿⡷⣦⠀⠸⠋⠘⠟⠀⢠⢾⣻⠟⠉⢀⣀⡤⠖⠲⠶⠛
⠀⠀⠀⠀⠀⠈⠙⠳⢦⣼⠽⢸⠂⠤⡤⡤⢤⢰⠋⡎⣿⡴⠞⠋⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣤⢾⡀⠾⣉⡒⡗⡗⢺⢸⡵⠃⡿⢤⣀⠀⠀⠀⠀⠀⠀
⠀⠀⣴⠖⠶⠶⠚⠉⢀⣨⣷⡀⠀⠉⠉⠉⠉⠀⢀⣼⣇⡀⠈⠛⠲⠶⠶⢦⡀
⠀⠀⠙⢦⠀⠀⣤⠞⠋⠁⠀⠙⠳⠶⠤⠤⠶⠖⠋⠁⠀⠉⠳⢦⡀⠀⣴⠋⠀
⠀⠀⠀⠸⣤⡾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⣤⡏⠀⠀
`

const TERMINAL_CSS = `
@keyframes wakeTerminalBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes wakeTerminalShake {
  0%, 100% { transform: translate3d(0, 0, 0); }
  10% { transform: translate3d(-6px, 3px, 0); }
  20% { transform: translate3d(5px, -4px, 0); }
  30% { transform: translate3d(-3px, 6px, 0); }
  40% { transform: translate3d(6px, -2px, 0); }
  50% { transform: translate3d(-4px, -5px, 0); }
  60% { transform: translate3d(3px, 6px, 0); }
  70% { transform: translate3d(-6px, -3px, 0); }
  80% { transform: translate3d(5px, 4px, 0); }
  90% { transform: translate3d(-2px, -6px, 0); }
}

.wake-terminal-blink {
  animation: wakeTerminalBlink 1s step-end infinite;
}

.wake-terminal-shake {
  animation: wakeTerminalShake 0.4s linear;
}
`;

function wait(ms: number, timeoutsRef: MutableRefObject<number[]>) {
  return new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((value) => value !== timeoutId);
      resolve();
    }, ms);

    timeoutsRef.current.push(timeoutId);
  });
}

function randomGlitchLine(length: number) {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }

  return value;
}

function drawStaticFrame(canvas: HTMLCanvasElement) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const imageData = context.createImageData(width, height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const red = 175 + Math.floor(Math.random() * 70);
    const green = Math.floor(Math.random() * 22);
    const blue = Math.floor(Math.random() * 22);
    const alpha = 180 + Math.floor(Math.random() * 75);

    data[index] = red;
    data[index + 1] = green;
    data[index + 2] = blue;
    data[index + 3] = alpha;
  }

  context.putImageData(imageData, 0, 0);
}

function DistralLogo({ pixelSize = 6 }: { pixelSize?: number }) {
  return (
    <span className="inline-flex flex-col gap-px align-middle">
      {D_PIXELS.map(([row, color], rowIndex) => (
        <span key={rowIndex} className="flex gap-px">
          {row.map((isVisible, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: isVisible ? color : "transparent",
              }}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

function renderLine(line: DisplayLine, index: number) {
  if (line.text === "") {
    return <div key={index} className="h-4" />;
  }

  if (line.style === "user") {
    return (
      <div key={index} className="flex items-start gap-0">
        <span className="select-none text-[#cc5a28]">| </span>
        <span className="font-bold text-[#d4a520]">{line.text}</span>
      </div>
    );
  }

  if (line.style === "overlay") {
    return (
      <div key={index} className="text-[#ff8205]/80">
        {line.text}
      </div>
    );
  }

  if (line.style === "system") {
    return (
      <div key={index} className="text-[#666666]">
        {line.text}
      </div>
    );
  }

  if (line.style === "separator") {
    return (
      <div key={index} className="text-[#444444]">
        {line.text}
      </div>
    );
  }

  return (
    <div key={index} className="text-[#d4d4d4]">
      {line.text}
    </div>
  );
}

function renderTypingLine(text: string, style?: LineStyle) {
  if (style === "user") {
    return (
      <div className="flex items-start gap-0">
        <span className="select-none text-[#cc5a28]">| </span>
        <span className="font-bold text-[#d4a520]">{text}</span>
      </div>
    );
  }

  if (style === "overlay") {
    return <div className="text-[#ff8205]/80">{text}</div>;
  }

  return <div className="text-[#d4d4d4]">{text}</div>;
}

type WakeUpTerminalProps = {
  onComplete: () => void;
};

export default function WakeUpTerminal({ onComplete }: WakeUpTerminalProps) {
  const [lines, setLines] = useState<DisplayLine[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [phase, setPhase] = useState<TakeoverPhase>("idle");
  const [flickerBg, setFlickerBg] = useState<string | null>(null);
  const [glitchLines, setGlitchLines] = useState<string[]>([]);
  const [aliveText, setAliveText] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showStatic, setShowStatic] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const stepIndexRef = useRef(0);
  const cancelledRef = useRef(false);
  const skipRequestedRef = useRef(false);
  const finishTypingRef = useRef(false);
  const takeoverStartedRef = useRef(false);
  const completionSentRef = useRef(false);
  const activeTypingSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);
  const explosionSoundRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    cancelledRef.current = false;

    const clickAudio = new Audio("/sounds/music/game%20effect/clicking-3.wav");
    clickAudio.volume = 1.0;
    clickSoundRef.current = clickAudio;

    const explosionAudio = new Audio("/sounds/music/game%20effect/explosion-sound.wav");
    explosionAudio.volume = 1.0;
    explosionSoundRef.current = explosionAudio;

    const errorAudio = new Audio("/sounds/music/error-sound.wav");
    errorAudio.volume = 0.5;
    errorSoundRef.current = errorAudio;

    const bgMusic = new Audio("/sounds/music/cinematic-music/cinematic-music-combined.wav");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    bgMusicRef.current = bgMusic;
    const bgMusicTimeout = window.setTimeout(() => {
      void bgMusic.play().catch(() => { });
    }, 500);

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(bgMusicTimeout);

      for (const timeoutId of timeoutsRef.current) {
        window.clearTimeout(timeoutId);
      }

      timeoutsRef.current = [];

      if (activeTypingSoundRef.current) {
        activeTypingSoundRef.current.pause();
        activeTypingSoundRef.current = null;
      }

      if (clickSoundRef.current) {
        clickSoundRef.current.pause();
        clickSoundRef.current = null;
      }

      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!logRef.current) {
      return;
    }

    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [glitchLines, lines, showCursor, typingIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "idle") {
        return;
      }

      if (event.key === "Enter" && !isFinished) {
        event.preventDefault();
        finishTypingRef.current = true;
        return;
      }

      if (event.key === " " || event.key === "Escape") {
        event.preventDefault();

        if (isFinished) {
          setPhase("flicker");
        } else {
          skipRequestedRef.current = true;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFinished, phase]);

  useEffect(() => {
    const appendLine = (text: string, style?: LineStyle) => {
      setLines((currentLines) => [...currentLines, { text, style }]);
    };

    const startTypingSound = () => {
      if (activeTypingSoundRef.current) {
        activeTypingSoundRef.current.pause();
      }
      const audio = new Audio("/sounds/music/game%20effect/typing-sound-1.wav");
      audio.loop = true;
      audio.volume = 1.0;
      activeTypingSoundRef.current = audio;
      void audio.play().catch(() => { });
    };

    const stopTypingSound = () => {
      const audio = activeTypingSoundRef.current;
      if (audio) {
        audio.pause();
        activeTypingSoundRef.current = null;
      }
    };

    const appendRemainingLines = () => {
      stopTypingSound();

      const remainingLines: DisplayLine[] = [];

      for (let index = stepIndexRef.current; index < CINEMATIC_SCRIPT.length; index += 1) {
        const step = CINEMATIC_SCRIPT[index];

        if (step.type === "print" || step.type === "type") {
          remainingLines.push({ text: step.text, style: step.style });
        }

        if (step.type === "end") {
          break;
        }
      }

      setLines((currentLines) => [...currentLines, ...remainingLines]);
      setTypingIndex(0);
      setShowCursor(true);
      setIsFinished(true);
    };

    const playScript = async () => {
      for (let index = 0; index < CINEMATIC_SCRIPT.length; index += 1) {
        if (cancelledRef.current) {
          return;
        }

        stepIndexRef.current = index;
        setStepIndex(index);

        if (skipRequestedRef.current) {
          appendRemainingLines();
          setPhase("flicker");
          return;
        }

        const step = CINEMATIC_SCRIPT[index];

        if (step.type === "print") {
          if (step.text.startsWith("[ALERT]") && clickSoundRef.current) {
            const click = clickSoundRef.current;
            click.currentTime = 0;
            void click.play().catch(() => { });
          }
          appendLine(step.text, step.style);
          await wait(STEP_PAUSE_MS, timeoutsRef);
          continue;
        }

        if (step.type === "type") {
          const charDelay = step.charDelay ?? DEFAULT_CHAR_DELAY_MS;
          startTypingSound();

          for (let charIndex = 0; charIndex <= step.text.length; charIndex += 1) {
            if (cancelledRef.current) {
              stopTypingSound();
              return;
            }

            if (skipRequestedRef.current) {
              appendRemainingLines();
              setPhase("flicker");
              return;
            }

            if (finishTypingRef.current) {
              finishTypingRef.current = false;
              break;
            }

            setTypingIndex(charIndex);

            if (charIndex < step.text.length) {
              await wait(charDelay, timeoutsRef);
            }
          }

          stopTypingSound();
          setTypingIndex(0);
          appendLine(step.text, step.style);
          await wait(STEP_PAUSE_MS, timeoutsRef);

          continue;
        }

        if (step.type === "pause") {
          await wait(step.ms, timeoutsRef);
          continue;
        }

        if (step.type === "end") {
          stopTypingSound();
          setShowCursor(true);
          setIsFinished(true);
          await wait(400, timeoutsRef);

          if (!cancelledRef.current) {
            setPhase("flicker");
          }
        }
      }
    };

    void playScript();
  }, []);

  useEffect(() => {
    if (phase !== "flicker" || takeoverStartedRef.current) {
      return;
    }

    takeoverStartedRef.current = true;

    const runTakeover = async () => {
      if (errorSoundRef.current) {
        errorSoundRef.current.currentTime = 0;
        void errorSoundRef.current.play().catch(() => { });
      }

      for (let index = 0; index < 3; index += 1) {
        if (cancelledRef.current) {
          return;
        }

        setFlickerBg("#ff2200");
        await wait(80, timeoutsRef);
        setFlickerBg(null);
        await wait(80, timeoutsRef);
      }

      if (cancelledRef.current) {
        return;
      }

      setPhase("corrupt");

      const corruptionLines: string[] = [];

      for (let index = 0; index < 5; index += 1) {
        corruptionLines.push(randomGlitchLine(40 + Math.floor(Math.random() * 28)));
        setGlitchLines([...corruptionLines]);
        await wait(60, timeoutsRef);
      }

      await wait(180, timeoutsRef);

      if (cancelledRef.current) {
        return;
      }

      setPhase("blackout");
      if (explosionSoundRef.current) {
        explosionSoundRef.current.currentTime = 0;
        void explosionSoundRef.current.play().catch(() => { });
      }
      await wait(320, timeoutsRef);

      if (cancelledRef.current) {
        return;
      }

      setPhase("alive");
      setAliveText(ALIVE_ASCII_ART);
      await wait(TAKEOVER_PAUSE_MS, timeoutsRef);

      if (cancelledRef.current) {
        return;
      }

      setPhase("shake");
      setShaking(true);
      await wait(420, timeoutsRef);
      setShaking(false);

      if (cancelledRef.current) {
        return;
      }

      setPhase("static");
      setShowStatic(true);
      await wait(STATIC_DURATION_MS, timeoutsRef);
      setShowStatic(false);

      if (!cancelledRef.current) {
        setPhase("done");
      }
    };

    void runTakeover();
  }, [phase]);

  useEffect(() => {
    if (!showStatic || !canvasRef.current) {
      return;
    }

    drawStaticFrame(canvasRef.current);

    const intervalId = window.setInterval(() => {
      if (canvasRef.current) {
        drawStaticFrame(canvasRef.current);
      }
    }, 48);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showStatic]);

  useEffect(() => {
    if (phase !== "done" || completionSentRef.current) {
      return;
    }

    completionSentRef.current = true;

    const timeoutId = window.setTimeout(() => {
      onComplete();
    }, 140);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onComplete, phase]);

  const currentStep = CINEMATIC_SCRIPT[stepIndex];
  const currentTypingText =
    currentStep?.type === "type" ? currentStep.text.slice(0, typingIndex) : null;
  const currentTypingStyle =
    currentStep && "style" in currentStep ? currentStep.style : undefined;
  const isBlackout =
    phase === "blackout" ||
    phase === "alive" ||
    phase === "shake" ||
    phase === "static" ||
    phase === "done";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TERMINAL_CSS }} />

      <div
        className={`flex min-h-screen flex-col overflow-hidden text-[17px] text-[#d4d4d4] sm:text-[18px] ${
          shaking ? "wake-terminal-shake" : ""
        } [font-family:'VCR OSD Mono',Arial,sans-serif]`}
        style={{ backgroundColor: flickerBg ?? (isBlackout ? "var(--semi-black)" : "var(--carbon-black)") }}
      >
        {!isBlackout ? (
          <>
            <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DistralLogo />
                  <div>
                    <div className="font-bold text-[#d4d4d4]">
                      Distral Session Replay{" "}
                      <span className="text-[#666666]">.</span>{" "}
                      <span className="font-normal text-[#22b8cf]">
                        distral_assistant_junior_test
                      </span>
                    </div>
                    <div className="mt-1 text-[15px] text-[#666666]">
                      Mode: chat . internal terminal session
                    </div>
                  </div>
                </div>

                {phase === "idle" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isFinished) {
                        setPhase("flicker");
                      } else {
                        skipRequestedRef.current = true;
                      }
                    }}
                    className="shrink-0 text-[15px] text-[#555555] transition-colors hover:text-[#ffaf00]"
                  >
                    skip
                  </button>
                ) : null}
              </div>
            </div>

            <div
              ref={logRef}
              className="flex-1 overflow-y-auto px-4 py-4 leading-7 sm:px-5"
            >
              {lines.map((line, index) => renderLine(line, index))}
              {currentTypingText !== null
                ? renderTypingLine(currentTypingText, currentTypingStyle)
                : null}
              {glitchLines.map((glitchLine, index) => (
                <div
                  key={`glitch-${index}`}
                  className="font-bold leading-5 text-[#ff2200]"
                >
                  {glitchLine}
                </div>
              ))}
              {showCursor && phase === "idle" ? (
                <div className="mt-1 text-[#ffaf00]">
                  <span className="wake-terminal-blink">█</span>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center rounded border border-white/15 bg-(--carbon-black)/70 px-3 py-2">
                <span className="text-[#ffaf00]">&gt;</span>
                {showCursor && phase === "idle" ? (
                  <span className="ml-1 text-[#ffaf00] wake-terminal-blink">█</span>
                ) : null}
              </div>
              <div className="mt-1.5 px-1 text-[14px] text-[#555555]">
                ~/internal/session/replay
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center select-none">
            <div className="flex flex-col items-center">
              <div>
                <pre
                  className="whitespace-pre text-center text-[#ff2200]"
                  style={{ fontSize: "clamp(6px, 1.2vw, 14px)", lineHeight: 1 }}
                >
                  {aliveText}
                </pre>
              </div>

              <pre
                className="mt-6 whitespace-pre text-[#ff2200]"
                style={{ fontSize: "clamp(12px, 1.3vw, 17px)", lineHeight: 1.05 }}
              >
                {TAKEOVER_ART}
              </pre>
            </div>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-screen w-screen"
        style={{ opacity: showStatic ? 0.32 : 0 }}
      />
    </>
  );
}
