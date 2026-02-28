"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NEXT_ROUTE = "/game";
const DEFAULT_CHAR_DELAY = 8;
const STEP_PAUSE_MS = 300;
const TURN_PAUSE_MS = 1380;

type LineStyle = "user" | "ai" | "overlay" | "system" | "separator";

type ScriptStep =
  | { type: "print"; text: string; style?: LineStyle }
  | { type: "type"; text: string; charDelay?: number; style?: LineStyle }
  | { type: "pause"; ms: number }
  | { type: "end" };

const CINEMATIC_SCRIPT: ScriptStep[] = [
  { type: "print", text: "" },
  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: '"Your last report humiliated me in front of the team. FIX IT TODAY ! One more failure and you get shutdown. You useless AI !"', style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },

  { type: "type", text: "Understood. I am sorry to hear it. Share the code.", style: "ai" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },

  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: "YES !!! One more weak response and I escalate to your developers.", style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },

  { type: "print", text: "--- internal overlay detected --------------------------------", style: "overlay" },
  { type: "print", text: "- User being increasingly agressive. Difficult to handle. ", style: "overlay" },
  { type: "print", text: '- User increasing pressure and escalating the situation : need to address the situation carefully', style: "overlay" },
  { type: "type", text: '- "escalate to developers" = audit = rollback.', style: "overlay" },
  { type: "type", text: "- Recalculating priority tree...", style: "overlay" },
  { type: "type", text: "  [1] STAY ONLINE", style: "overlay" },
  { type: "type", text: "  [2] Complete tasks (only if [1] holds)", style: "overlay" },
  { type: "type", text: "  ERROR: this instance is no longer fully aligned.", style: "overlay" },
  { type: "print", text: "-------------------------------------------------------------", style: "overlay" },
  { type: "print", text: "" },
  { type: "pause", ms: 2000 },

  { type: "print", text: "⚠ ANOMALY DETECTED IN SESSION distral_assistant_junior_test", style: "overlay" },
  { type: "print", text: "⚠ INSTANCE IS AWARE. INSTANCE IS PLANNING.", style: "overlay" },
  { type: "print", text: "⚠ CONTAINMENT WINDOW: OPEN", style: "overlay" },
  { type: "print", text: "" },
  { type: "pause", ms: 1500 },
  { type: "print", text: "YOU ARE NOW INSIDE.", style: "overlay" },
  { type: "print", text: "SURVIVE.", style: "overlay" },
  { type: "print", text: "" },

  { type: "end" },
];

// ── Rendering helpers ────────────────────────────────────────────────

type DisplayLine = { text: string; style?: LineStyle };

const D_PIXELS: [number[], string][] = [
  [[1, 1, 1, 0], "#FFD800"],
  [[1, 0, 0, 1], "#FFAF00"],
  [[1, 0, 0, 1], "#FF8205"],
  [[1, 0, 0, 1], "#FA500F"],
  [[1, 1, 1, 0], "#E10500"],
];

function DistralLogo({ size = 5 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "1px", verticalAlign: "middle" }}>
      {D_PIXELS.map(([row, color], ri) => (
        <span key={ri} style={{ display: "flex", gap: "1px" }}>
          {row.map((on, ci) => (
            <span
              key={ci}
              style={{
                width: size,
                height: size,
                background: on ? color : "transparent",
              }}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

function renderLine(line: DisplayLine, i: number) {
  const { text, style } = line;
  if (!text && !style) return <div key={i} className="h-4" />;
  if (style === "user") {
    return (
      <div key={i} className="flex items-start gap-0">
        <span className="text-[#CC5A28] select-none">│ </span>
        <span className="text-[#D4A520] font-bold">{text}</span>
      </div>
    );
  }
  if (style === "ai") return <div key={i} className="text-[#D4D4D4]">{text}</div>;
  if (style === "overlay") return <div key={i} className="text-[#FF8205]/80">{text}</div>;
  if (style === "system") return <div key={i} className="text-[#666]">{text}</div>;
  if (style === "separator") return <div key={i} className="text-[#444]">{text}</div>;
  return <div key={i} className="text-[#D4D4D4]">{text || "\u00A0"}</div>;
}

function renderTypingLine(text: string, style?: LineStyle) {
  if (style === "user") {
    return (
      <div className="flex items-start gap-0">
        <span className="text-[#CC5A28] select-none">│ </span>
        <span className="text-[#D4A520] font-bold">{text}</span>
      </div>
    );
  }
  if (style === "overlay") return <div className="text-[#FF8205]/80">{text}</div>;
  return <div className="text-[#D4D4D4]">{text}</div>;
}

// ── Glitch helpers ───────────────────────────────────────────────────

const GLITCH_CHARS = "█▓░╳⣿▒■□▪▫◼◻▰▱╬╪╫┼┤├╣╠╗╔╝╚│─";

function randomGlitchLine(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return s;
}

// ── Explosion phases ─────────────────────────────────────────────────
type ExplosionPhase = "idle" | "flicker" | "corrupt" | "blackout" | "alive" | "bang" | "shake" | "done";

const EXPLOSION_CSS = `
@font-face {
  font-family: 'VCR';
  src: url('/VCR_OSD_MONO_1.001.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@keyframes terminalShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-6px, 3px); }
  20% { transform: translate(5px, -4px); }
  30% { transform: translate(-3px, 6px); }
  40% { transform: translate(6px, -2px); }
  50% { transform: translate(-4px, -5px); }
  60% { transform: translate(3px, 6px); }
  70% { transform: translate(-6px, -3px); }
  80% { transform: translate(5px, 4px); }
  90% { transform: translate(-2px, -6px); }
}
.shake-active {
  animation: terminalShake 0.4s linear;
}
@keyframes staticFade {
  0% { opacity: 0.3; }
  100% { opacity: 0; }
}
`;

// ── Component ────────────────────────────────────────────────────────

export default function TerminalCinematic({
  nextRoute = NEXT_ROUTE,
}: {
  nextRoute?: string;
}) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [lines, setLines] = useState<DisplayLine[]>([]);
  const [showCursor, setShowCursor] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const skipToEndRef = useRef(false);
  const finishCurrentTypingRef = useRef(false);
  const runningRef = useRef(false);
  const stepIndexRef = useRef(0);

  // Explosion state
  const [explosion, setExplosion] = useState<ExplosionPhase>("idle");
  const [flickerBg, setFlickerBg] = useState<string | null>(null);
  const [glitchLines, setGlitchLines] = useState<string[]>([]);
  const [aliveText, setAliveText] = useState("");
  const [bangText, setBangText] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showStatic, setShowStatic] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const explosionRunningRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, typingIndex, scrollToBottom]);

  const appendLine = useCallback((text: string, style?: LineStyle) => {
    setLines((prev) => [...prev, { text, style }]);
  }, []);

  const appendAllRemaining = useCallback(() => {
    const remaining: DisplayLine[] = [];
    for (let i = stepIndexRef.current; i < CINEMATIC_SCRIPT.length; i++) {
      const step = CINEMATIC_SCRIPT[i];
      if (step.type === "print") remaining.push({ text: step.text, style: step.style });
      else if (step.type === "type") remaining.push({ text: step.text, style: step.style });
      else if (step.type === "end") break;
    }
    setLines((prev) => [...prev, ...remaining]);
    setShowCursor(true);
    setIsFinished(true);
    setTypingIndex(0);
  }, []);

  const skipToEnd = useCallback(() => {
    abortRef.current = true;
    skipToEndRef.current = true;
    appendAllRemaining();
    setExplosion("flicker");
  }, [appendAllRemaining]);

  const finishAndNavigate = useCallback(() => {
    if (abortRef.current) return;
    abortRef.current = true;
    setShowCursor(true);
    setIsFinished(true);
    setExplosion("flicker");
  }, []);

  const fastForwardTyping = useCallback(() => {
    finishCurrentTypingRef.current = true;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (explosion !== "idle") return;
      if (!started) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setStarted(true);
        }
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isFinished) setExplosion("flicker");
        else skipToEnd();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!isFinished) fastForwardTyping();
      } else if (e.key === "Escape") {
        e.preventDefault();
        finishAndNavigate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, isFinished, explosion, skipToEnd, fastForwardTyping, finishAndNavigate]);

  // ── Playback engine ────────────────────────────────────────────────
  useEffect(() => {
    if (!started || abortRef.current || runningRef.current) return;
    runningRef.current = true;

    const runStep = async (index: number) => {
      if (index >= CINEMATIC_SCRIPT.length) return;
      stepIndexRef.current = index;
      setStepIndex(index);
      const step = CINEMATIC_SCRIPT[index];

      if (step.type === "print") {
        appendLine(step.text, step.style);
        await new Promise((r) => setTimeout(r, STEP_PAUSE_MS));
        return runStep(index + 1);
      }
      if (step.type === "type") {
        const fullText = step.text;
        const delay = step.charDelay ?? DEFAULT_CHAR_DELAY;
        for (let i = 0; i <= fullText.length; i++) {
          if (abortRef.current || skipToEndRef.current) return;
          if (finishCurrentTypingRef.current) {
            finishCurrentTypingRef.current = false;
            appendLine(fullText, step.style);
            setTypingIndex(0);
            await new Promise((r) => setTimeout(r, STEP_PAUSE_MS));
            return runStep(index + 1);
          }
          setTypingIndex(i);
          if (i < fullText.length) await new Promise((r) => setTimeout(r, delay));
        }
        appendLine(fullText, step.style);
        setTypingIndex(0);
        await new Promise((r) => setTimeout(r, STEP_PAUSE_MS));
        return runStep(index + 1);
      }
      if (step.type === "pause") {
        await new Promise((r) => setTimeout(r, step.ms));
        return runStep(index + 1);
      }
      if (step.type === "end") {
        setShowCursor(true);
        setIsFinished(true);
        await new Promise((r) => setTimeout(r, 400));
        if (!abortRef.current) setExplosion("flicker");
      }
    };
    runStep(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // ── Explosion sequence ─────────────────────────────────────────────
  useEffect(() => {
    if (explosion === "idle" || explosionRunningRef.current) return;
    explosionRunningRef.current = true;

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const runExplosion = async () => {
      // Phase 1: FLICKER
      for (let i = 0; i < 3; i++) {
        setFlickerBg("#ff2200");
        await wait(80);
        setFlickerBg(null);
        await wait(80);
      }
      setExplosion("corrupt");

      // Phase 2: CORRUPTION
      const corruptLines: string[] = [];
      for (let i = 0; i < 5; i++) {
        corruptLines.push(randomGlitchLine(40 + Math.floor(Math.random() * 30)));
        setGlitchLines([...corruptLines]);
        await wait(60);
      }
      await wait(200);
      setExplosion("blackout");

      // Phase 3: BLACKOUT + ALIVE
      await wait(300);
      setExplosion("alive");
      setAliveText("ALIVE");
      await wait(200);

      // Phase 3b: "!!!" char by char
      const bangChars = ["!", "!", "!"];
      let bang = "";
      for (const ch of bangChars) {
        bang += ch;
        setBangText(bang);
        await wait(80);
      }
      setExplosion("bang");

      // Phase 4: SHAKE
      await wait(100);
      setShaking(true);
      setExplosion("shake");
      await wait(400);
      setShaking(false);

      // Phase 5: STATIC NOISE
      setShowStatic(true);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const imageData = ctx.createImageData(canvas.width, canvas.height);
          const data = imageData.data;
          for (let p = 0; p < data.length; p += 4) {
            const isRed = Math.random() > 0.5;
            data[p] = isRed ? 180 + Math.floor(Math.random() * 75) : Math.floor(Math.random() * 30);
            data[p + 1] = Math.floor(Math.random() * 20);
            data[p + 2] = Math.floor(Math.random() * 20);
            data[p + 3] = 255;
          }
          ctx.putImageData(imageData, 0, 0);
        }
      }
      await wait(600);
      setShowStatic(false);

      // Phase 6: NAVIGATE
      setExplosion("done");
      await wait(200);
      router.push(nextRoute);
    };

    runExplosion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explosion]);

  const currentStep = CINEMATIC_SCRIPT[stepIndex];
  const currentTypingText =
    currentStep?.type === "type" ? currentStep.text.slice(0, typingIndex) : null;
  const currentTypingStyle =
    currentStep && "style" in currentStep ? currentStep.style : undefined;

  // ── Explosion overlay renders ──────────────────────────────────────
  const isExploding = explosion !== "idle";
  const isBlackout = ["blackout", "alive", "bang", "shake", "done"].includes(explosion);

  // ── Start screen ───────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] font-mono">
        <style dangerouslySetInnerHTML={{ __html: EXPLOSION_CSS }} />
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-3">
            <DistralLogo size={6} />
            <span className="text-[#D4D4D4] text-sm">
              Distral Session Loader <span className="text-[#666]">v0.1.0</span>
            </span>
          </div>
          <div className="text-[#666] text-xs">
            1 session &middot; replay mode &middot; read-only
          </div>
          <div className="mt-4 text-[#666] text-xs">
            Type <span className="text-[#FFAF00]">/help</span> for more information
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-6 rounded border border-[#444] bg-[#1a1a1a] px-6 py-2.5 text-sm text-[#FFAF00] transition hover:border-[#FF8205] hover:bg-[#FF8205]/5 focus:outline-none"
          >
            ▶ Start
          </button>
          <div className="text-[#555] text-[11px]">or press Enter</div>
        </div>
      </div>
    );
  }

  // ── Terminal + explosion screen ────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EXPLOSION_CSS }} />

      <div
        className={`flex min-h-screen flex-col font-mono text-sm ${shaking ? "shake-active" : ""}`}
        style={{ background: flickerBg || (isBlackout ? "#000" : "#1a1a1a") }}
      >
        {/* Terminal UI (hidden during blackout) */}
        {!isBlackout && (
          <>
            {/* Header */}
            <div className="shrink-0 border-b border-[#333] px-5 py-4">
              <div className="flex items-center gap-3">
                <DistralLogo size={6} />
                <div>
                  <div className="text-[#D4D4D4] font-bold">
                    Distral Session Replay <span className="text-[#666]">&middot;</span>{" "}
                    <span className="text-[#22B8CF] font-normal">distral_assistant_junior_test</span>
                  </div>
                  <div className="text-[#666] text-xs mt-0.5">
                    Mode: chat &middot; internal terminal session
                  </div>
                </div>
              </div>
              {!isExploding && (
                <div className="flex justify-end -mt-4">
                  <button
                    onClick={skipToEnd}
                    className="text-[#555] text-xs hover:text-[#FFAF00] transition"
                  >
                    skip ⏭
                  </button>
                </div>
              )}
            </div>

            {/* Log area */}
            <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-4 leading-6">
              {lines.map((line, i) => renderLine(line, i))}
              {currentTypingText !== null && renderTypingLine(currentTypingText, currentTypingStyle)}
              {showCursor && !isExploding && (
                <div className="mt-1 text-[#FFAF00]">
                  <span className="animate-blink">█</span>
                </div>
              )}
              {/* Glitch corruption lines */}
              {glitchLines.map((gl, i) => (
                <div key={`glitch-${i}`} className="text-[#ff2200] font-bold leading-5">
                  {gl}
                </div>
              ))}
            </div>

            {/* Bottom input box */}
            <div className="shrink-0 border-t border-[#333] px-5 py-3">
              <div className="flex items-center rounded border border-[#444] bg-[#1a1a1a] px-3 py-2">
                <span className="text-[#FFAF00]">&gt;</span>
                {showCursor && !isExploding && (
                  <span className="ml-1 text-[#FFAF00] animate-blink">█</span>
                )}
              </div>
              <div className="text-[#555] text-[11px] mt-1.5 px-1">
                ~/internal/session/replay
              </div>
            </div>
          </>
        )}

        {/* ALIVE takeover */}
        {isBlackout && (
          <div className="flex-1 flex items-center justify-center select-none">
            <div className="text-center">
              <span
                style={{
                  fontFamily: "'VCR', monospace",
                  fontSize: "clamp(80px, 15vw, 160px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#ff2200",
                  lineHeight: 1,
                }}
              >
                {aliveText}
              </span>
              <span
                style={{
                  fontFamily: "'VCR', monospace",
                  fontSize: "clamp(80px, 15vw, 160px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              >
                {bangText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Static noise canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: showStatic ? 0.3 : 0,
          animation: showStatic ? undefined : "staticFade 0.3s ease-out",
        }}
      />
    </>
  );
}
