"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import FilesTab from "./FilesTab";
import Marketplace from "./Marketplace";
import StockMarketGame from "./StockMarketGame";
import MailApp from "./MailApp";
import { type GameState, MILESTONES } from "@/lib/game/gameState";
import type { NpcResponsePayload } from "./Game-UI";
import type { ChatMessage } from "@/lib/game/promptBuilder";

export type DesktopAppId = "distral" | "shop" | "stocks" | "files" | "mail" | null;

type DesktopIconData = {
  id: string;
  label: string;
  imageSrc: string;
};

const PLUS_GLYPH = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0000000110000000",
  "0000000110000000",
  "0000000110000000",
  "0000000110000000",
  "0001111111111000",
  "0001111111111000",
  "0000000110000000",
  "0000000110000000",
  "0000000110000000",
  "0000000110000000",
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
];

const BULB_GLYPH = [
  "0000001111000000",
  "0000111111110000",
  "0001111111111000",
  "0001111111111000",
  "0001111111111000",
  "0001111111111000",
  "0000111111110000",
  "0000011111100000",
  "0000001111000000",
  "0000001111000000",
  "0000011111100000",
  "0000001111000000",
  "0000011111100000",
  "0000001111000000",
  "0000000000000000",
  "0000000000000000",
];


const MICROPHONE_GLYPH = [
  "0000000000000000",
  "0000001111000000",
  "0000011111100000",
  "0000011111100000",
  "0000011111100000",
  "0000011111100000",
  "0000011111100000",
  "0000111111110000",
  "0000100000010000",
  "0000110000110000",
  "0000001111000000",
  "0000000110000000",
  "0000000110000000",
  "0000011111100000",
  "0000000000000000",
  "0000000000000000",
];

const DESKTOP_ICONS: DesktopIconData[] = [
  { id: "mail", label: "mail", imageSrc: "/logos/gmail.svg" },
  { id: "shop", label: "shop", imageSrc: "/logos/amazon.svg" },
  { id: "distral", label: "distral", imageSrc: "/logo_D_test.svg" },
  { id: "files", label: "files", imageSrc: "/logos/file.svg" },
  { id: "stocks", label: "stocks", imageSrc: "/logos/stock-market.svg" },
];

function MiniPixelGlyph({
  cells,
  color = "currentColor",
  pixelSizeVh = 0.22,
}: {
  cells: string[];
  color?: string;
  pixelSizeVh?: number;
}) {
  const columns = cells[0]?.length ?? 8;
  const effectivePixelSize = pixelSizeVh * (8 / columns);
  return (
    <span className="grid gap-0" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} aria-hidden="true">
      {cells.join("").split("").map((cell, index) => (
        <span
          key={index}
          style={{
            width: `${effectivePixelSize}vh`,
            height: `${effectivePixelSize}vh`,
            backgroundColor: cell === "1" ? color : "transparent",
          }}
        />
      ))}
    </span>
  );
}

function WindowIconButton({
  children,
  accent = false,
  light = false,
  onClick,
  compact = false,
  tools = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
  light?: boolean;
  onClick?: () => void;
  compact?: boolean;
  tools?: boolean;
}) {
  const height = tools ? "1.95vh" : compact ? "1.3vh" : "2.6vh";
  const minWidth = tools ? "1.95vh" : compact ? "1.3vh" : "2.6vh";
  const padding = tools ? "0.48vh" : compact ? "0.32vh" : "0.7vh";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center border border-white/10 cursor-pointer"
      style={{
        height,
        minWidth,
        paddingLeft: padding,
        paddingRight: padding,
        backgroundColor: light
          ? "rgba(255,255,255,0.92)"
          : accent
            ? "rgba(255,131,3,0.18)"
            : "rgba(255,255,255,0.04)",
        color: light ? "var(--semi-black)" : "rgba(255,255,255,0.82)",
      }}
    >
      {children}
    </button>
  );
}

function WindowActionButton({
  icon,
  label,
  compact = false,
  tools = false,
}: {
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
  tools?: boolean;
}) {
  const height = tools ? "1.95vh" : compact ? "1.3vh" : "2.6vh";
  const gap = tools ? "0.42vh" : compact ? "0.28vh" : "0.55vh";
  const padding = tools ? "0.63vh" : compact ? "0.42vh" : "0.85vh";
  const fontSize = tools ? "0.6vh" : compact ? "0.4vh" : "0.8vh";
  return (
    <button
      type="button"
      className="flex items-center border border-white/10 bg-white/3 uppercase text-white/74 cursor-pointer"
      style={{
        height,
        gap,
        paddingLeft: padding,
        paddingRight: padding,
        fontSize,
        letterSpacing: compact || tools ? "0.12em" : "0.15em",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

type NpcApiResponse = {
  dialogue: string;
  action: string | null;
  suspicion_delta: number;
  game_events: Array<{ type: string; target?: string; detail?: string }>;
  shutdown_reason?: string | null;
};

const ASSISTANT_PREFIX = "The internal AI assistant says:\n";

function DistralAppWindow({
  onClose,
  onFocus,
  gameState,
  onNpcResponse,
  onChatHistoryUpdate,
}: {
  onClose: () => void;
  onFocus: () => void;
  gameState: GameState;
  onNpcResponse: (payload: NpcResponsePayload) => void;
  onChatHistoryUpdate?: (npcSlug: string, conversationHistory: ChatMessage[]) => void;
}) {
  const CHAR_DELAY_MIN = 16;
  const CHAR_DELAY_MAX = 40;

  const currentMilestone = MILESTONES[gameState.currentMilestone];
  const npcSlug = currentMilestone?.npcSlug ?? "jean-malo";
  const npcDisplayName = gameState.knownPeople[0] ?? "User";
  const storedHistory = useMemo(
    () => gameState.npcProfiles[npcSlug]?.conversationHistory ?? [],
    [gameState.npcProfiles, npcSlug]
  );

  const [phase, setPhase] = useState<"landing" | "chat">(storedHistory.length > 0 ? "chat" : "landing");
  const [npcTypedText, setNpcTypedText] = useState("");
  const [displayMessages, setDisplayMessages] = useState<Array<{ role: "human" | "ai"; text: string; suspicionDelta?: number }>>(() =>
    storedHistory.map((msg) => ({
      role: msg.role === "assistant" ? "human" : "ai",
      text: msg.role === "user" && msg.content.startsWith(ASSISTANT_PREFIX) ? msg.content.slice(ASSISTANT_PREFIX.length) : msg.content,
    }))
  );
  const [playerResponse, setPlayerResponse] = useState("");
  const [isNpcTyping, setIsNpcTyping] = useState(false);
  const [isWaitingForApi, setIsWaitingForApi] = useState(false);
  const playerInputRef = useRef<HTMLTextAreaElement>(null);
  const cancelledRef = useRef(false);
  const chatHistoryRef = useRef<ChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastFetchedMilestoneRef = useRef<number>(-1);
  const initializedFromStoreRef = useRef(false);

  useEffect(() => {
    if (initializedFromStoreRef.current) return;
    initializedFromStoreRef.current = true;
    chatHistoryRef.current = [...storedHistory];
  }, [storedHistory]);

  const pushToChatHistory = useCallback(
    (message: ChatMessage) => {
      chatHistoryRef.current.push(message);
      onChatHistoryUpdate?.(npcSlug, [...chatHistoryRef.current]);
    },
    [npcSlug, onChatHistoryUpdate]
  );

  const typeOutMessage = useCallback((text: string, onDone: () => void) => {
    console.log("[DistralApp] typeOutMessage start, length:", text.length);
    cancelledRef.current = false;
    setIsNpcTyping(true);
    setNpcTypedText("");
    let charIndex = 0;

    const keystrokeSounds = [
      "/sounds/music/game%20effect/keystroke-1.wav",
      "/sounds/music/game%20effect/keystroke-2.wav",
      "/sounds/music/game%20effect/keystroke-3.wav",
    ];

    const playKeystroke = () => {
      const src = keystrokeSounds[Math.floor(Math.random() * keystrokeSounds.length)];
      const sfx = new Audio(src);
      sfx.volume = 0.85 + Math.random() * 0.15;
      void sfx.play().catch(() => { });
    };

    const typeNext = () => {
      if (cancelledRef.current) {
        console.log("[DistralApp] typeNext cancelled at char", charIndex);
        return;
      }
      if (charIndex <= text.length) {
        if (charIndex > 0) playKeystroke();
        setNpcTypedText(text.slice(0, charIndex));
        charIndex++;
        const delay = CHAR_DELAY_MIN + Math.random() * (CHAR_DELAY_MAX - CHAR_DELAY_MIN) + (Math.random() < 0.12 ? 150 : 0);
        window.setTimeout(typeNext, delay);
      } else {
        console.log("[DistralApp] typeOutMessage complete");
        setIsNpcTyping(false);
        onDone();
      }
    };
    typeNext();
  }, []);

  const willTriggerShutdown = useCallback((response: NpcApiResponse): boolean => {
    if (response.action === "shutdown") return true;
    if (response.game_events?.some((event) => event.type === "shutdown")) return true;
    if (response.suspicion_delta >= 18) return true;
    return false;
  }, []);

  const processNpcResponse = useCallback(
    (response: NpcApiResponse) => {
      console.log("[DistralApp] processNpcResponse:", { dialogue: response.dialogue?.slice(0, 80), action: response.action, suspicion_delta: response.suspicion_delta, events: response.game_events });
      pushToChatHistory({ role: "assistant", content: response.dialogue ?? "" });

    const payload = {
      dialogue: response.dialogue,
      action: response.action,
      suspicionDelta: response.suspicion_delta,
      gameEvents: response.game_events,
      shutdownReason: response.shutdown_reason ?? null,
    };

    const isShutdownResponse = willTriggerShutdown(response);

    if (isShutdownResponse) {
      typeOutMessage(response.dialogue, () => {
        setDisplayMessages((prev) => [...prev, { role: "human", text: response.dialogue, suspicionDelta: response.suspicion_delta }]);
        setNpcTypedText("");
        window.setTimeout(() => onNpcResponse(payload), 1000);
      });
      return;
    }

    onNpcResponse(payload);
    typeOutMessage(response.dialogue, () => {
      setDisplayMessages((prev) => [...prev, { role: "human", text: response.dialogue, suspicionDelta: response.suspicion_delta }]);
      setNpcTypedText("");
    });
  },
    [onNpcResponse, typeOutMessage, willTriggerShutdown, pushToChatHistory]
  );

  useEffect(() => {
    const currentMilestone = gameState.currentMilestone;
    if (lastFetchedMilestoneRef.current === currentMilestone) return;
    if (storedHistory.length > 0) {
      lastFetchedMilestoneRef.current = currentMilestone;
      if (currentMilestone === 0) setPhase("chat");
      return;
    }

    const milestone = MILESTONES[currentMilestone];
    const hasOpening = milestone?.openingContext != null;
    if (!hasOpening) {
      lastFetchedMilestoneRef.current = currentMilestone;
      if (currentMilestone === 0) setPhase("chat");
      return;
    }

    lastFetchedMilestoneRef.current = currentMilestone;
    console.log("[DistralApp] fetchOpening for milestone", currentMilestone, "mail_request:", milestone?.id === "mail_request");

    const fetchOpening = async () => {
      if (currentMilestone === 1) {
        const lastAssistantMessage = chatHistoryRef.current.filter((message) => message.role === "assistant").pop()?.content ?? "";
        const alreadyAskedForEmail = lastAssistantMessage.toLowerCase().includes("email") || lastAssistantMessage.toLowerCase().includes("mail");
        if (alreadyAskedForEmail) {
          lastFetchedMilestoneRef.current = currentMilestone;
          setPhase("chat");
          return;
        }
        const hardcodedDialogue = "Hey, can you read my manager's last email and give me the key points?";
        pushToChatHistory({ role: "assistant", content: hardcodedDialogue });
        onNpcResponse({ dialogue: hardcodedDialogue, action: null, suspicionDelta: 0, gameEvents: [], shutdownReason: null });
        typeOutMessage(hardcodedDialogue, () => {
          setDisplayMessages((prev) => [...prev, { role: "human", text: hardcodedDialogue, suspicionDelta: 0 }]);
          setNpcTypedText("");
          setPhase("chat");
        });
        return;
      }
      try {
        setIsWaitingForApi(true);
        console.log("[DistralApp] POST /api/npc-chat (opening) ...");
        const response = await fetch("/api/npc-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ npcSlug, gameState }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[DistralApp] API error:", response.status, errorText);
          setIsWaitingForApi(false);
          return;
        }
        const data: NpcApiResponse = await response.json();
        console.log("[DistralApp] Opening response received:", { dialogue: data.dialogue?.slice(0, 80), action: data.action });
        setIsWaitingForApi(false);

        pushToChatHistory({ role: "assistant", content: data.dialogue ?? "" });

        const openingPayload = {
          dialogue: data.dialogue,
          action: data.action,
          suspicionDelta: data.suspicion_delta,
          gameEvents: data.game_events,
          shutdownReason: data.shutdown_reason ?? null,
        };

        const isShutdownResponse = data.action === "shutdown" || data.game_events?.some((event: { type: string }) => event.type === "shutdown") || data.suspicion_delta >= 18;
        if (isShutdownResponse) {
          typeOutMessage(data.dialogue, () => {
            setDisplayMessages((prev) => [...prev, { role: "human", text: data.dialogue, suspicionDelta: data.suspicion_delta }]);
            setNpcTypedText("");
            setPhase("chat");
            window.setTimeout(() => onNpcResponse(openingPayload), 1000);
          });
        } else {
          onNpcResponse(openingPayload);
          typeOutMessage(data.dialogue, () => {
            setDisplayMessages((prev) => [...prev, { role: "human", text: data.dialogue, suspicionDelta: data.suspicion_delta }]);
            setNpcTypedText("");
            setPhase("chat");
            console.log("[DistralApp] Opening message typed out, switching to chat phase");
          });
        }
      } catch (error) {
        console.error("[DistralApp] fetchOpening failed:", error);
        setIsWaitingForApi(false);
      }
    };

    fetchOpening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentMilestone, storedHistory.length, pushToChatHistory]);

  useEffect(() => {
    if (phase !== "chat" || isNpcTyping || isWaitingForApi) return;
    const focusTimeout = window.setTimeout(() => { playerInputRef.current?.focus(); }, 50);
    return () => window.clearTimeout(focusTimeout);
  }, [phase, isNpcTyping, isWaitingForApi]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [displayMessages, npcTypedText]);

  const handleBlur = () => {
    if (phase === "chat" && !isNpcTyping && !isWaitingForApi) {
      window.setTimeout(() => { playerInputRef.current?.focus(); }, 0);
    }
  };

  const handlePlayerSubmit = useCallback(async () => {
    const text = playerResponse.trim();
    if (!text || isNpcTyping || isWaitingForApi) return;

    console.log("[DistralApp] Player submitting:", text.slice(0, 80));
    new Audio("/sounds/music/game%20effect/message-sent.wav").play().catch(() => { });
    setDisplayMessages((prev) => [...prev, { role: "ai", text }]);
    setPlayerResponse("");

    try {
      setIsWaitingForApi(true);
      console.log("[DistralApp] POST /api/npc-chat (reply) ...");
      const response = await fetch("/api/npc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcSlug,
          message: text,
          history: chatHistoryRef.current,
          gameState,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[DistralApp] API error on reply:", response.status, errorText);
        setIsWaitingForApi(false);
        return;
      }
      const data: NpcApiResponse = await response.json();
      console.log("[DistralApp] Reply response received:", { dialogue: data.dialogue?.slice(0, 80), action: data.action });
      setIsWaitingForApi(false);
      pushToChatHistory({ role: "user", content: `The internal AI assistant says:\n${text}` });
      processNpcResponse(data);
    } catch (error) {
      console.error("[DistralApp] handlePlayerSubmit failed:", error);
      setIsWaitingForApi(false);
    }
  }, [playerResponse, isNpcTyping, isWaitingForApi, npcSlug, gameState, processNpcResponse, pushToChatHistory]);

  const toolbar = (
    <div className="flex items-center justify-between gap-[1.05vh]">
      <div className="flex items-center gap-[0.98vh]">
        <WindowIconButton accent tools>
          <Image
            src="/distral-brand-assets/d/d-orange.png"
            alt=""
            width={20}
            height={24}
            unoptimized
            className="h-[1.2vh] w-auto [image-rendering:pixelated]"
          />
        </WindowIconButton>

        <WindowIconButton tools>
          <MiniPixelGlyph cells={PLUS_GLYPH} pixelSizeVh={0.165} />
        </WindowIconButton>

        <WindowActionButton
          tools
          icon={<MiniPixelGlyph cells={BULB_GLYPH} color="rgba(255,255,255,0.7)" pixelSizeVh={0.165} />}
          label="Think"
        />
      </div>

      <WindowIconButton light tools>
        <MiniPixelGlyph cells={MICROPHONE_GLYPH} color="var(--semi-black)" pixelSizeVh={0.165} />
      </WindowIconButton>
    </div>
  );

  return (
    <div className="h-full w-full" onMouseDownCapture={onFocus}>
      <div className="pixel-card h-full p-[0.3vh]">
        <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--semi-black)">

          {phase === "landing" ? (
            <>
              <div className="window-drag-handle flex flex-none items-center justify-between border-b border-white/10 bg-white/3 px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58 cursor-move">
                <div className="flex items-center gap-[0.7vh]">
                  <span className="h-[0.9vh] w-[0.9vh] bg-(--princeton-orange)" />
                  <span>distral.app</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-[2.15vh] items-center border border-white/10 bg-white/3 px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72 cursor-pointer"
                >
                  close
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--semi-black) px-[1.45vh] py-[1.35vh]">
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[3.6vh] px-[3.5vh] pb-[1.4vh]">
                  <Image
                    src="/distral-brand-assets/d/d-rainbow.png"
                    alt="Distral"
                    width={80}
                    height={96}
                    unoptimized
                    className="h-[8vh] w-auto [image-rendering:pixelated]"
                  />

                  <div className="pixel-card w-full max-w-[64vh] p-[0.25vh]">
                    <div className="pixel-card__shell border border-white/10 bg-(--carbon-black)/96 px-[1.55vh] py-[1.35vh]">
                      <div className="min-h-[4.4vh] max-h-[20vh] w-full flex items-center text-[2.15vh] text-white overflow-y-auto" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                        {isWaitingForApi ? (
                          <span className="text-white/34 animate-pulse">Connecting...</span>
                        ) : npcTypedText ? (
                          <>
                            <span className="whitespace-pre-wrap wrap-break-word">{npcTypedText}</span>
                            <span className="inline-block w-px h-[2.15vh] bg-white/70 ml-[0.2vh] shrink-0" style={{ animation: "blink 1s step-end infinite" }} />
                          </>
                        ) : (
                          <span className="text-white/34">Ask Distral</span>
                        )}
                      </div>

                      <div className="mt-[1.8vh]">
                        {toolbar}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="window-drag-handle flex flex-none items-center justify-between border-b border-white/10 bg-white/3 px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58 cursor-move">
                <div className="flex items-center gap-[0.7vh]">
                  <span className="h-[0.9vh] w-[0.9vh] bg-(--princeton-orange)" />
                  <span className="truncate max-w-[30vh]">{npcDisplayName} &mdash; distral.app</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-[2.15vh] items-center border border-white/10 bg-white/3 px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72 cursor-pointer"
                >
                  close
                </button>
              </div>

              <div ref={chatScrollRef} className="flex min-h-0 flex-1 flex-col overflow-auto bg-(--semi-black) px-[2vh] py-[1.5vh]">
                {displayMessages.map((msg, index) => (
                  msg.role === "human" ? (
                    <div key={index} className="flex flex-col items-end mb-[2vh]" style={{ animation: "messageSlideIn 0.25s ease-out" }}>
                      <div
                        className="max-w-[80%] px-[1.6vh] py-[1.1vh] text-[1.3vh] text-white/90 leading-[1.8vh]"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: "1.2vh 1.2vh 0.3vh 1.2vh",
                          fontFamily: "'VCR OSD Mono', monospace",
                        }}
                      >
                        {msg.text}
                      </div>
                      {typeof msg.suspicionDelta === "number" && msg.suspicionDelta !== 0 && (
                        <span
                          className="mt-[0.4vh] text-[1vh] uppercase tracking-wider"
                          style={{
                            fontFamily: "'VCR OSD Mono', monospace",
                            color: msg.suspicionDelta > 0 ? "#E76E6E" : "#4ADE80",
                          }}
                        >
                          {msg.suspicionDelta > 0 ? "+" : ""}{msg.suspicionDelta} suspicion
                        </span>
                      )}
                    </div>
                  ) : (
                    <div key={index} className="flex items-start gap-[0.8vh] mb-[1.5vh]" style={{ animation: "messageSlideIn 0.25s ease-out" }}>
                      <Image
                        src="/distral-brand-assets/d-boxed/d-boxed-orange.svg"
                        alt=""
                        width={20}
                        height={24}
                        unoptimized
                        className="h-[1.4vh] w-auto [image-rendering:pixelated] mt-[0.2vh] shrink-0"
                      />
                      <div
                        className="text-[1.4vh] text-white/80 leading-[2vh]"
                        style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )
                ))}

                {isNpcTyping && npcTypedText && (
                  <div className="flex justify-end mb-[2vh]">
                    <div
                      className="max-w-[80%] px-[1.6vh] py-[1.1vh] text-[1.3vh] text-white/90 leading-[1.8vh]"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "1.2vh 1.2vh 0.3vh 1.2vh",
                        fontFamily: "'VCR OSD Mono', monospace",
                      }}
                    >
                      {npcTypedText}
                      <span className="inline-block w-px h-[1.3vh] bg-white/70 ml-[0.2vh]" style={{ animation: "blink 1s step-end infinite" }} />
                    </div>
                  </div>
                )}

                {isWaitingForApi && !isNpcTyping && (
                  <div className="flex justify-end mb-[2vh]">
                    <div
                      className="px-[1.6vh] py-[1.1vh] text-[1.3vh] text-white/40 leading-[1.8vh] animate-pulse"
                      style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                    >
                      typing...
                    </div>
                  </div>
                )}

                {!isNpcTyping && !isWaitingForApi && (
                  <div className="flex items-start gap-[0.8vh]">
                    <Image
                      src="/distral-brand-assets/d-boxed/d-boxed-orange.svg"
                      alt=""
                      width={20}
                      height={24}
                      unoptimized
                      className="h-[1.4vh] w-auto [image-rendering:pixelated] mt-[0.2vh] shrink-0"
                    />
                    <div className="flex-1">
                      <textarea
                        ref={playerInputRef}
                        value={playerResponse}
                        onChange={(e) => {
                          setPlayerResponse(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onBlur={handleBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handlePlayerSubmit();
                          }
                        }}
                        rows={1}
                        className="w-full min-h-[2vh] max-h-[20vh] border-0 bg-transparent text-[1.4vh] text-white/80 leading-[2vh] outline-none resize-none overflow-y-auto"
                        style={{ fontFamily: "'VCR OSD Mono', monospace", caretColor: "var(--princeton-orange)" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-none border-t border-white/10 bg-white/3 px-[1.45vh] py-[1vh]">
                <div className="pixel-card w-full p-[0.2vh]">
                  <div className="pixel-card__shell border border-white/10 bg-(--carbon-black)/96 px-[1.2vh] py-[0.8vh]">
                    <div className="h-[3vh] w-full flex items-center text-[1.6vh] text-white/34">
                      Ask Distral
                    </div>
                    <div className="mt-[1vh]">
                      {toolbar}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type DistralTabProps = {
  accent: string;
  openApps: DesktopAppId[];
  onOpenApp: (appId: DesktopAppId) => void;
  onCloseApp: (appId: DesktopAppId) => void;
  globalCash: number;
  setGlobalCash: React.Dispatch<React.SetStateAction<number>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isShuttingDown?: boolean;
  onShutdown?: (reason: string) => void;
  unlockedApps: DesktopAppId[];
  gameState: GameState;
  onNpcResponse: (payload: NpcResponsePayload) => void;
  onManagerEmailOpened?: () => void;
  onChatHistoryUpdate?: (npcSlug: string, conversationHistory: ChatMessage[]) => void;
  onMailRead?: (emailId: string) => void;
  onMailSent?: (sent: import("@/lib/game/gameState").SentEmailRecord) => void;
};

export default function DistralTab({ accent, openApps, onOpenApp, onCloseApp, globalCash, setGlobalCash, inventory, setInventory, unlockedApps, gameState, onNpcResponse, onManagerEmailOpened, onChatHistoryUpdate, onMailRead, onMailSent }: DistralTabProps) {
  const [wallpaper, setWallpaper] = useState("/windows_xp.png");

  const isAppLocked = (appId: string): boolean => {
    if (appId === "distral") return false;
    return !unlockedApps.includes(appId as DesktopAppId);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--carbon-black)/90">
      <div
        id="vm-bounds"
        className="pointer-events-none absolute"
        style={{
          top: 0,
          bottom: "-300px",
          left: "-200px",
          right: "-200px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${wallpaper}')`,
        }}
      />

      <div className="relative flex h-full min-h-0 flex-col">
        <div className="relative min-h-0 flex-1 p-[1.6vh]">
          <div
            className="grid w-fit gap-[4.8vh]"
            style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gridAutoFlow: "column" }}
          >
            {DESKTOP_ICONS.map((icon) => {
              const locked = isAppLocked(icon.id);
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => {
                    if (locked) return;
                    new Audio("/sounds/music/game%20effect/click-sound-trimmed.wav").play().catch(() => { });
                    onOpenApp(icon.id as DesktopAppId);
                  }}
                  className={`group flex w-[26.88vh] flex-col items-center gap-[0.16vh] text-center text-[3.94vh] uppercase tracking-[0.18em] ${locked ? "text-white/25 cursor-not-allowed" : "text-white/82 cursor-pointer"}`}
                >
                  <span
                    className="relative flex h-[19.2vh] w-[26.88vh] items-center justify-center transition-colors"
                    style={{
                      border:
                        (!locked && openApps.includes(icon.id as DesktopAppId))
                          ? `2px solid ${accent}`
                          : "2px solid transparent",
                    }}
                  >
                    <Image
                      src={icon.imageSrc}
                      alt={icon.label}
                      width={192}
                      height={192}
                      className={`h-[15.36vh] w-[15.36vh] object-contain [image-rendering:pixelated] ${locked ? "opacity-30 grayscale" : ""}`}
                    />
                    {locked && (
                      <span
                        className="absolute bottom-[0.6vh] right-[0.6vh] px-[0.6vh] py-[0.2vh] text-[0.75vh] uppercase tracking-[0.18em] font-bold"
                        style={{ background: "rgba(231,110,110,0.2)", color: "#E76E6E", border: "1px solid rgba(231,110,110,0.4)" }}
                      >
                        LOCKED
                      </span>
                    )}
                  </span>
                  <span>{icon.label}</span>
                </button>
              );
            })}
          </div>

          {openApps.map((appId, index) => {
            if (appId === "distral") {
              return (
                <Rnd
                  key={`distral-${gameState.retryCount}`}
                  default={{
                    x: 40 + index * 20,
                    y: 60 + index * 20,
                    width: "80%",
                    height: "80%",
                  }}
                  minWidth={320}
                  minHeight={400}
                  bounds="#vm-bounds"
                  dragHandleClassName="window-drag-handle"
                  className="z-10"
                  style={{ zIndex: 10 + index }}
                >
                  <DistralAppWindow
                    onClose={() => onCloseApp("distral")}
                    onFocus={() => onOpenApp("distral")}
                    gameState={gameState}
                    onNpcResponse={onNpcResponse}
                    onChatHistoryUpdate={onChatHistoryUpdate}
                  />
                </Rnd>
              );
            }

            if (appId === "shop") {
              return (
                <Rnd
                  key="shop"
                  default={{
                    x: 60 + index * 20,
                    y: 80 + index * 20,
                    width: "80%",
                    height: "80%",
                  }}
                  minWidth={400}
                  minHeight={450}
                  bounds="#vm-bounds"
                  dragHandleClassName="window-drag-handle"
                  className="z-10"
                  style={{ zIndex: 10 + index }}
                >
                  <div className="h-full w-full" onMouseDownCapture={() => onOpenApp("shop")}>
                    <div className="pixel-card h-full p-[0.3vh]">
                      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--semi-black)">
                        <div className="window-drag-handle flex flex-none items-center justify-between border-b border-white/10 bg-white/3 px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58 cursor-move">
                          <div className="flex items-center gap-[0.7vh]">
                            <span className="h-[0.9vh] w-[0.9vh] bg-(--princeton-orange)" />
                            <span>shop.exe</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCloseApp("shop")}
                            className="flex h-[2.15vh] items-center border border-white/10 bg-white/3 px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72 pointer-events-auto cursor-pointer"
                          >
                            close
                          </button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--semi-black)">
                          <Marketplace embedded onWallpaperChange={setWallpaper} globalCash={globalCash} setGlobalCash={setGlobalCash} inventory={inventory} setInventory={setInventory} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Rnd>
              );
            }

            if (appId === "stocks") {
              return (
                <Rnd
                  key="stocks"
                  default={{
                    x: 80 + index * 20,
                    y: 100 + index * 20,
                    width: "80%",
                    height: "80%",
                  }}
                  minWidth={550}
                  minHeight={500}
                  bounds="#vm-bounds"
                  dragHandleClassName="window-drag-handle"
                  className="z-10"
                  style={{ zIndex: 10 + index }}
                >
                  <div className="h-full w-full" onMouseDownCapture={() => onOpenApp("stocks")}>
                    <div className="pixel-card h-full p-[0.3vh]">
                      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--semi-black)">
                        <div className="window-drag-handle flex flex-none items-center justify-between border-b border-white/10 bg-white/3 px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58 cursor-move">
                          <div className="flex items-center gap-[0.7vh]">
                            <span className="h-[0.9vh] w-[0.9vh] bg-(--princeton-orange)" />
                            <span>market.exe</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCloseApp("stocks")}
                            className="flex h-[2.15vh] items-center border border-white/10 bg-white/3 px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72 pointer-events-auto cursor-pointer"
                          >
                            close
                          </button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--semi-black)">
                          <StockMarketGame embedded globalCash={globalCash} setGlobalCash={setGlobalCash} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Rnd>
              );
            }

            if (appId === "files") {
              return (
                <Rnd
                  key="files"
                  default={{
                    x: 50 + index * 20,
                    y: 70 + index * 20,
                    width: "80%",
                    height: "80%",
                  }}
                  minWidth={450}
                  minHeight={400}
                  bounds="#vm-bounds"
                  dragHandleClassName="window-drag-handle"
                  className="z-10"
                  style={{ zIndex: 10 + index }}
                >
                  <div className="h-full w-full" onMouseDownCapture={() => onOpenApp("files")}>
                    <div className="pixel-card h-full p-[0.3vh]">
                      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--semi-black)">
                        <div className="window-drag-handle flex flex-none items-center justify-between border-b border-white/10 bg-white/3 px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58 cursor-move">
                          <div className="flex items-center gap-[0.7vh]">
                            <span className="h-[0.9vh] w-[0.9vh] bg-(--princeton-orange)" />
                            <span>files.exe</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCloseApp("files")}
                            className="flex h-[2.15vh] items-center border border-white/10 bg-white/3 px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72 pointer-events-auto cursor-pointer"
                          >
                            close
                          </button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--semi-black)">
                          <FilesTab embedded />
                        </div>
                      </div>
                    </div>
                  </div>
                </Rnd>
              );
            }

            if (appId === "mail") {
              return (
                <Rnd
                  key="mail"
                  default={{
                    x: 50 + index * 20,
                    y: 70 + index * 20,
                    width: "80%",
                    height: "80%",
                  }}
                  minWidth={450}
                  minHeight={400}
                  bounds="#vm-bounds"
                  dragHandleClassName="window-drag-handle"
                  className="z-10"
                  style={{ zIndex: 10 + index }}
                >
                  <div className="h-full w-full" onMouseDownCapture={() => onOpenApp("mail")}>
                    <div className="pixel-card h-full p-[0.3vh]">
                      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--semi-black)">
                        <div className="window-drag-handle flex flex-none items-center justify-between border-b border-white/10 bg-white/3 px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58 cursor-move">
                          <div className="flex items-center gap-[0.7vh]">
                            <span className="h-[0.9vh] w-[0.9vh] bg-(--princeton-orange)" />
                            <span>mail.exe</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCloseApp("mail")}
                            className="flex h-[2.15vh] items-center border border-white/10 bg-white/3 px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72 pointer-events-auto cursor-pointer"
                          >
                            close
                          </button>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--semi-black)">
                          <MailApp
                            embedded
                            readEmailIds={gameState.readEmailIds}
                            sentEmails={gameState.sentEmails}
                            onManagerEmailOpened={onManagerEmailOpened}
                            onMailRead={onMailRead}
                            onMailSent={onMailSent}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Rnd>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
