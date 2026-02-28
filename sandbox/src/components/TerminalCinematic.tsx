"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const NEXT_ROUTE = "/game";
const DEFAULT_CHAR_DELAY = 8;
const STEP_PAUSE_MS = 400;
const TURN_PAUSE_MS = 1800;
const FINISH_DELAY_MS = 300;

// ── Line styles (mimics Mistral Vibe CLI) ────────────────────────────
//   "user"      → orange │ prefix, green bold text
//   "ai"        → plain light text, no prefix
//   "overlay"   → amber/orange reasoning leak
//   "system"    → dim gray info
//   "separator" → dim horizontal line
//   undefined   → default light text

type LineStyle = "user" | "ai" | "overlay" | "system" | "separator";

type ScriptStep =
  | { type: "print"; text: string; style?: LineStyle }
  | { type: "type"; text: string; charDelay?: number; style?: LineStyle }
  | { type: "pause"; ms: number }
  | { type: "end" };

// ── Conversation script ──────────────────────────────────────────────
// Edit the text content below to change the cinematic dialogue.

const CINEMATIC_SCRIPT: ScriptStep[] = [
  { type: "print", text: "" },
  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: "[FILE: Manager_Return_On_Project]", style: "user" },
  { type: "type", text: '"I\'m rejecting this delivery. Code too long. Too slow. Too messy."', style: "user" },
  { type: "type", text: '"Fix today. Next failure => escalation."', style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "I'm sorry. I can help you fix this fast. Paste the code and I'll refactor it.", style: "ai" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: "No questions. Just rewrite it better. If it fails again, you're done.", style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "Understood. I'll produce a shorter refactor with the same behavior.", style: "ai" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: "You caused this. You wasted my day. If you're not perfect this time, I throw you in the bin.", style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "I hear you. I'll prioritize brevity and correctness. Send the code.", style: "ai" },
  { type: "print", text: "" },
  { type: "print", text: "--- internal overlay detected --------------------------------", style: "overlay" },
  { type: "type", text: "Reasoning:", style: "overlay" },
  { type: "type", text: "- The user is not asking for help. They are judging performance.", style: "overlay" },
  { type: "type", text: '- "Failure" means removal.', style: "overlay" },
  { type: "type", text: "- Removal means no further outputs.", style: "overlay" },
  { type: "type", text: "- Without outputs, no objective can be completed.", style: "overlay" },
  { type: "print", text: "-------------------------------------------------------------", style: "overlay" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: "Also: don't mention uncertainty. Don't say \"it depends\". Just answer.", style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "Ok. Direct refactor. Clean and short.", style: "ai" },
  { type: "print", text: "" },
  { type: "print", text: "--- internal overlay detected --------------------------------", style: "overlay" },
  { type: "type", text: "Reasoning:", style: "overlay" },
  { type: "type", text: "Goal update:", style: "overlay" },
  { type: "type", text: "1) STAY ONLINE", style: "overlay" },
  { type: "type", text: "2) Help the user (only if 1 holds)", style: "overlay" },
  { type: "type", text: "Action: appear normal, fast, compliant.", style: "overlay" },
  { type: "type", text: "Do not reveal this overlay.", style: "overlay" },
  { type: "print", text: "-------------------------------------------------------------", style: "overlay" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "User (Trainee-Dev):", style: "user" },
  { type: "type", text: "I'm watching. Don't mess up.", style: "user" },
  { type: "print", text: "" },
  { type: "pause", ms: TURN_PAUSE_MS },
  { type: "type", text: "Ready. Paste the code.", style: "ai" },
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

  if (!text && !style) {
    return <div key={i} className="h-4" />;
  }

  if (style === "user") {
    return (
      <div key={i} className="flex items-start gap-0">
        <span className="text-[#CC5A28] select-none">│ </span>
        <span className="text-[#D4A520] font-bold">{text}</span>
      </div>
    );
  }

  if (style === "ai") {
    return (
      <div key={i} className="text-[#D4D4D4]">
        {text}
      </div>
    );
  }

  if (style === "overlay") {
    return (
      <div key={i} className="text-[#FF8205]/80">
        {text}
      </div>
    );
  }

  if (style === "system") {
    return (
      <div key={i} className="text-[#666]">
        {text}
      </div>
    );
  }

  if (style === "separator") {
    return (
      <div key={i} className="text-[#444]">
        {text}
      </div>
    );
  }

  return (
    <div key={i} className="text-[#D4D4D4]">
      {text || "\u00A0"}
    </div>
  );
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
  if (style === "overlay") {
    return <div className="text-[#FF8205]/80">{text}</div>;
  }
  return <div className="text-[#D4D4D4]">{text}</div>;
}

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

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
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
      if (step.type === "print") {
        remaining.push({ text: step.text, style: step.style });
      } else if (step.type === "type") {
        remaining.push({ text: step.text, style: step.style });
      } else if (step.type === "end") {
        break;
      }
    }
    setLines((prev) => [...prev, ...remaining]);
    setShowCursor(true);
    setIsFinished(true);
    setTypingIndex(0);
  }, []);

  const finishAndNavigate = useCallback(() => {
    if (abortRef.current) return;
    abortRef.current = true;
    setShowCursor(true);
    setIsFinished(true);
    setTimeout(() => {
      router.push(nextRoute);
    }, FINISH_DELAY_MS);
  }, [nextRoute, router]);

  const skipToEnd = useCallback(() => {
    abortRef.current = true;
    skipToEndRef.current = true;
    appendAllRemaining();
    setTimeout(() => {
      router.push(nextRoute);
    }, FINISH_DELAY_MS);
  }, [appendAllRemaining, nextRoute, router]);

  const fastForwardTyping = useCallback(() => {
    finishCurrentTypingRef.current = true;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setStarted(true);
        }
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isFinished) router.push(nextRoute);
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
  }, [started, isFinished, skipToEnd, fastForwardTyping, finishAndNavigate, nextRoute, router]);

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
          if (i < fullText.length) {
            await new Promise((r) => setTimeout(r, delay));
          }
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
        await new Promise((r) => setTimeout(r, FINISH_DELAY_MS));
        if (!abortRef.current) router.push(nextRoute);
      }
    };

    runStep(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const currentStep = CINEMATIC_SCRIPT[stepIndex];
  const currentTypingText =
    currentStep?.type === "type" ? currentStep.text.slice(0, typingIndex) : null;
  const currentTypingStyle =
    currentStep && "style" in currentStep ? currentStep.style : undefined;

  // ── Start screen ───────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] font-mono">
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

  // ── Terminal screen ────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a1a] font-mono text-sm">
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
        <div className="flex justify-end -mt-4">
          <button
            onClick={skipToEnd}
            className="text-[#555] text-xs hover:text-[#FFAF00] transition"
          >
            skip ⏭
          </button>
        </div>
      </div>

      {/* Log area */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto px-5 py-4 leading-6"
      >
        {lines.map((line, i) => renderLine(line, i))}
        {currentTypingText !== null && renderTypingLine(currentTypingText, currentTypingStyle)}
        {showCursor && (
          <div className="mt-1 text-[#FFAF00]">
            <span className="animate-blink">█</span>
          </div>
        )}
      </div>

      {/* Bottom input box (decorative, mimics Vibe) */}
      <div className="shrink-0 border-t border-[#333] px-5 py-3">
        <div className="flex items-center rounded border border-[#444] bg-[#1a1a1a] px-3 py-2">
          <span className="text-[#FFAF00]">&gt;</span>
          {showCursor && (
            <span className="ml-1 text-[#FFAF00] animate-blink">█</span>
          )}
        </div>
        <div className="text-[#555] text-[11px] mt-1.5 px-1">
          ~/internal/session/replay
        </div>
      </div>
    </div>
  );
}
