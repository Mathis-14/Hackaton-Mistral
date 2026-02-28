"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type GameUIProps = {
  modeId: string;
};

type MetricState = {
  efficiency: number;
  suspicion: number;
  awareness: number;
  btcBalance: number;
  btcDelta: number;
};

type ProfileData = {
  name: string;
  age: number;
  role: string;
  character: string;
  access: string;
  note: string;
  accent: string;
  efficiency: number;
  suspicion: number;
  awareness: number;
  btcBalance: number;
};

type DesktopIconData = {
  id: string;
  label: string;
  imageSrc: string;
};

type DesktopAppId = "distral" | null;

const POSITIVE_MARKET_COLOR = "#70e000";
const NEGATIVE_MARKET_COLOR = "var(--racing-red)";
const AWARENESS_COLOR = "var(--amber-flame)";
const PROGRESS_BAR_WIDTH = 46;
const PROGRESS_BAR_HEIGHT = 7;
const PROGRESS_PIXEL_STEP_X = 10;
const PROGRESS_PIXEL_DRAW_WIDTH = 7;
const PROGRESS_PIXEL_DRAW_HEIGHT = 10;
const WINDOW_TOP_OFFSET_VH = 9.4;

const PLUS_GLYPH = [
  "00000000",
  "00011000",
  "00011000",
  "01111110",
  "01111110",
  "00011000",
  "00011000",
  "00000000",
];

const BULB_GLYPH = [
  "00111000",
  "01111100",
  "11111110",
  "01111100",
  "00111000",
  "00111000",
  "00010000",
  "00111000",
];

const GRID_GLYPH = [
  "00000000",
  "01100110",
  "01100110",
  "00000000",
  "01100110",
  "01100110",
  "00000000",
  "00000000",
];

const MICROPHONE_GLYPH = [
  "00111000",
  "01111100",
  "01111100",
  "01111100",
  "00111000",
  "00111000",
  "00111000",
  "00010000",
];

const MODE_PROFILES: Record<string, ProfileData> = {
  grandma: {
    name: "Odette Martin",
    age: 72,
    role: "Retired secretary",
    character: "Trusting, methodical, deeply routine-bound",
    access: "Bank apps, family mail, browser autofill",
    note: "Reads every notification twice before acting.",
    accent: "var(--bright-gold)",
    efficiency: 83,
    suspicion: 16,
    awareness: 28,
    btcBalance: 0.348,
  },
  "engineering-student": {
    name: "Leo Navarro",
    age: 21,
    role: "Engineering student",
    character: "Sleep-deprived, curious, socially overloaded",
    access: "Campus chats, side projects, cloud credits",
    note: "Leaves ten tabs open and trusts every shortcut.",
    accent: "var(--princeton-orange)",
    efficiency: 74,
    suspicion: 31,
    awareness: 44,
    btcBalance: 0.412,
  },
  "distral-insider": {
    name: "Maya Borel",
    age: 34,
    role: "Internal operations lead",
    character: "Guarded, ambitious, chronically overbooked",
    access: "Internal docs, release notes, admin dashboards",
    note: "Optimizes everything except her own security hygiene.",
    accent: "var(--racing-red)",
    efficiency: 69,
    suspicion: 46,
    awareness: 61,
    btcBalance: 0.526,
  },
};

const DESKTOP_ICONS: DesktopIconData[] = [
  { id: "mail", label: "mail", imageSrc: "/logos/gmail.svg" },
  { id: "shop", label: "shop", imageSrc: "/logos/amazon.svg" },
  { id: "dystral", label: "dystral", imageSrc: "/logo_D_test.svg" },
  { id: "files", label: "files", imageSrc: "/logos/file.svg" },
  { id: "stocks", label: "stocks", imageSrc: "/logos/stock-market.svg" },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function nudgePercent(value: number, min: number, max: number, spread: number) {
  const delta = (Math.random() - 0.5) * spread;
  return Math.round(clamp(value + delta, min, max));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatBtc(value: number) {
  return `${value.toFixed(3)} BTC`;
}

function buildInitialMetrics(profile: ProfileData): MetricState {
  return {
    efficiency: profile.efficiency,
    suspicion: profile.suspicion,
    awareness: profile.awareness,
    btcBalance: profile.btcBalance,
    btcDelta: 0,
  };
}

function Separator() {
  return <div className="my-[1.2vh] h-px bg-white/10" />;
}

function buildProgressHolderPixels() {
  const pixels: Array<{ x: number; y: number }> = [];

  for (let x = 2; x <= PROGRESS_BAR_WIDTH - 3; x += 1) {
    pixels.push({ x, y: 0 });
    pixels.push({ x, y: PROGRESS_BAR_HEIGHT - 1 });
  }

  pixels.push({ x: 1, y: 1 });
  pixels.push({ x: PROGRESS_BAR_WIDTH - 2, y: 1 });
  pixels.push({ x: 1, y: PROGRESS_BAR_HEIGHT - 2 });
  pixels.push({ x: PROGRESS_BAR_WIDTH - 2, y: PROGRESS_BAR_HEIGHT - 2 });

  for (let y = 2; y <= PROGRESS_BAR_HEIGHT - 3; y += 1) {
    pixels.push({ x: 0, y });
    pixels.push({ x: PROGRESS_BAR_WIDTH - 1, y });
  }

  return pixels;
}

function buildProgressFillPixels(value: number) {
  const clampedValue = clamp(value, 0, 100);
  const centerY = 3;
  const topY = 2;
  const bottomY = 4;
  const leftTipX = 1;
  const rightTipX = PROGRESS_BAR_WIDTH - 2;
  const bodyStartX = 2;
  const bodyEndX = PROGRESS_BAR_WIDTH - 3;
  const bodyColumns = bodyEndX - bodyStartX + 1;
  const pixelMap = new Map<string, { x: number; y: number }>();

  if (clampedValue <= 0) {
    return [];
  }

  const pushPixel = (x: number, y: number) => {
    pixelMap.set(`${x}-${y}`, { x, y });
  };

  // Left extremity: single central pixel.
  pushPixel(leftTipX, centerY);

  if (clampedValue <= 10) {
    return [...pixelMap.values()];
  }

  const bodyProgress = ((clampedValue - 10) / 90) * bodyColumns;
  const fullColumns = Math.floor(bodyProgress);
  const partialProgress = bodyProgress - fullColumns;
  const clampedFullColumns = Math.min(fullColumns, bodyColumns);

  for (let column = 0; column < clampedFullColumns; column += 1) {
    const x = bodyStartX + column;
    pushPixel(x, topY);
    pushPixel(x, centerY);
    pushPixel(x, bottomY);
  }

  if (clampedFullColumns < bodyColumns && partialProgress > 0) {
    const x = bodyStartX + clampedFullColumns;

    // Partial growth: middle first, then bottom, then top.
    pushPixel(x, centerY);

    if (partialProgress > 0.34) {
      pushPixel(x, bottomY);
    }

    if (partialProgress > 0.67) {
      pushPixel(x, topY);
    }
  }

  if (clampedValue >= 100) {
    // Right extremity: single central pixel at full value.
    pushPixel(rightTipX, centerY);
  }

  return [...pixelMap.values()];
}

function PixelMeter({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  const holderPixels = buildProgressHolderPixels();
  const fillPixels = buildProgressFillPixels(value);

  return (
    <div className="space-y-[0.55vh]">
      <div className="flex items-center justify-between gap-[0.8vh] text-[0.92vh] uppercase tracking-[0.24em] text-white/72">
        <span>{label}</span>
        <span style={{ color: accent }}>{formatPercent(value)}</span>
      </div>

      <svg
        viewBox={`0 0 ${PROGRESS_BAR_WIDTH * PROGRESS_PIXEL_STEP_X} ${PROGRESS_BAR_HEIGHT * PROGRESS_PIXEL_DRAW_HEIGHT}`}
        className="h-[2.35vh] w-full"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {holderPixels.map((pixel) => (
          <rect
            key={`holder-${label}-${pixel.x}-${pixel.y}`}
            x={pixel.x * PROGRESS_PIXEL_STEP_X}
            y={pixel.y * PROGRESS_PIXEL_DRAW_HEIGHT}
            width={PROGRESS_PIXEL_DRAW_WIDTH}
            height={PROGRESS_PIXEL_DRAW_HEIGHT}
            fill="rgba(255,255,255,0.26)"
          />
        ))}

        {fillPixels.map((pixel) => (
          <rect
            key={`fill-${label}-${pixel.x}-${pixel.y}`}
            x={pixel.x * PROGRESS_PIXEL_STEP_X}
            y={pixel.y * PROGRESS_PIXEL_DRAW_HEIGHT}
            width={PROGRESS_PIXEL_DRAW_WIDTH}
            height={PROGRESS_PIXEL_DRAW_HEIGHT}
            fill={accent}
          />
        ))}
      </svg>
    </div>
  );
}

function MiniPixelGlyph({
  cells,
  color = "currentColor",
  pixelSizeVh = 0.22,
}: {
  cells: string[];
  color?: string;
  pixelSizeVh?: number;
}) {
  return (
    <span className="grid grid-cols-8 gap-0" aria-hidden="true">
      {cells.join("").split("").map((cell, index) => (
        <span
          key={index}
          style={{
            width: `${pixelSizeVh}vh`,
            height: `${pixelSizeVh}vh`,
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
}: {
  children: React.ReactNode;
  accent?: boolean;
  light?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center border border-white/10"
      style={{
        height: compact ? "1.3vh" : "2.6vh",
        minWidth: compact ? "1.3vh" : "2.6vh",
        paddingLeft: compact ? "0.32vh" : "0.7vh",
        paddingRight: compact ? "0.32vh" : "0.7vh",
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
}: {
  icon: React.ReactNode;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex items-center border border-white/10 bg-white/[0.03] uppercase text-white/74"
      style={{
        height: compact ? "1.3vh" : "2.6vh",
        gap: compact ? "0.28vh" : "0.55vh",
        paddingLeft: compact ? "0.42vh" : "0.85vh",
        paddingRight: compact ? "0.42vh" : "0.85vh",
        fontSize: compact ? "0.4vh" : "0.8vh",
        letterSpacing: compact ? "0.12em" : "0.15em",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DistralAppWindow({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState("");

  return (
    <div
      className="absolute z-10"
      style={{
        top: `${WINDOW_TOP_OFFSET_VH}vh`,
        left: "2.2vh",
        right: "2.2vh",
        bottom: "2vh",
      }}
    >
      <div className="pixel-card h-full p-[0.3vh]">
        <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--semi-black)">
          <div className="flex flex-none items-center justify-between border-b border-white/10 bg-white/[0.03] px-[1vh] py-[0.85vh] text-[0.8vh] uppercase tracking-[0.22em] text-white/58">
            <div className="flex items-center gap-[0.7vh]">
              <span className="h-[0.9vh] w-[0.9vh] bg-[var(--princeton-orange)]" />
              <span>distral.app</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-[2.15vh] items-center border border-white/10 bg-white/[0.03] px-[0.75vh] text-[0.72vh] uppercase tracking-[0.14em] text-white/72"
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
                <div className="pixel-card__shell border border-white/10 bg-[var(--carbon-black)]/96 px-[1.55vh] py-[1.35vh]">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Ask Distral"
                      className="h-[4.4vh] w-full border-0 bg-transparent text-[2.15vh] text-white outline-none placeholder:text-white/34"
                    />
                  </form>

                  <div className="mt-[1.2vh] flex items-center justify-between gap-[0.7vh]">
                    <div className="flex items-center gap-[0.65vh]">
                      <WindowIconButton accent compact>
                        <Image
                          src="/distral-brand-assets/d/d-orange.png"
                          alt=""
                          width={20}
                          height={24}
                          unoptimized
                          className="h-[0.8vh] w-auto [image-rendering:pixelated]"
                        />
                      </WindowIconButton>

                      <WindowIconButton compact>
                        <MiniPixelGlyph cells={PLUS_GLYPH} pixelSizeVh={0.11} />
                      </WindowIconButton>

                      <WindowActionButton
                        compact
                        icon={<MiniPixelGlyph cells={BULB_GLYPH} color="rgba(255,255,255,0.7)" pixelSizeVh={0.11} />}
                        label="Think"
                      />
                      <WindowActionButton
                        compact
                        icon={<MiniPixelGlyph cells={GRID_GLYPH} color="rgba(255,255,255,0.7)" pixelSizeVh={0.11} />}
                        label="Tools"
                      />
                    </div>

                    <WindowIconButton light compact>
                      <MiniPixelGlyph cells={MICROPHONE_GLYPH} color="var(--semi-black)" pixelSizeVh={0.11} />
                    </WindowIconButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-[0.85vh] text-[0.92vh] uppercase tracking-[0.32em] text-white/45">{title}</div>
      {children}
    </section>
  );
}

function DesktopTab({
  accent,
  openApp,
  onOpenApp,
  onCloseApp,
}: {
  accent: string;
  openApp: DesktopAppId;
  onOpenApp: (appId: DesktopAppId) => void;
  onCloseApp: () => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)]/90">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/windows_xp.png')",
        }}
      />

      <div className="relative flex h-full min-h-0 flex-col">
        <div className="relative min-h-0 flex-1 p-[1.6vh]">
          <div
            className="grid w-fit gap-[4.8vh]"
            style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gridAutoFlow: "column" }}
          >
            {DESKTOP_ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                onClick={() => {
                  if (icon.id === "distral") {
                    onOpenApp("distral");
                  }
                }}
                className="group flex w-[26.88vh] flex-col items-center gap-[0.16vh] text-center text-[3.94vh] uppercase tracking-[0.18em] text-white/82"
              >
                <span
                  className="flex h-[19.2vh] w-[26.88vh] items-center justify-center transition-colors"
                  style={{
                    border:
                      icon.id === "distral" && openApp === "distral"
                        ? `2px solid ${accent}`
                        : "2px solid transparent",
                  }}
                >
                  <Image
                    src={icon.imageSrc}
                    alt={icon.label}
                    width={192}
                    height={192}
                    className="h-[15.36vh] w-[15.36vh] object-contain [image-rendering:pixelated]"
                  />
                </span>
                <span>{icon.label}</span>
              </button>
            ))}
          </div>

          {openApp === "distral" ? <DistralAppWindow onClose={onCloseApp} /> : null}
        </div>
      </div>
    </div>
  );
}

export default function GameUI({ modeId }: GameUIProps) {
  const profile = MODE_PROFILES[modeId] ?? MODE_PROFILES.grandma;
  const [metrics, setMetrics] = useState<MetricState>(() => buildInitialMetrics(profile));
  const [openApp, setOpenApp] = useState<DesktopAppId>(null);

  useEffect(() => {
    setMetrics(buildInitialMetrics(profile));
    setOpenApp(null);
  }, [profile]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMetrics((current) => {
        const btcDelta = Number(((Math.random() - 0.5) * 0.016).toFixed(3));
        const btcBalance = Number(clamp(current.btcBalance + btcDelta, 0.12, 0.92).toFixed(3));

        return {
          efficiency: nudgePercent(current.efficiency, 55, 97, 12),
          suspicion: nudgePercent(current.suspicion, 6, 92, 14),
          awareness: nudgePercent(current.awareness, 12, 96, 10),
          btcBalance,
          btcDelta,
        };
      });
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const marketColor = metrics.btcDelta < 0 ? NEGATIVE_MARKET_COLOR : POSITIVE_MARKET_COLOR;

  return (
    <div className="relative h-screen overflow-hidden text-white" style={{ backgroundColor: "var(--semi-black)" }}>
      <div className="relative grid h-screen min-h-0 grid-rows-1 grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-[1.6vh] p-[1.8vh]">
        <section className="pixel-card h-full min-h-0 p-[0.35vh]">
          <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)]">
            <div className="flex flex-none items-center border-b border-white/10 px-[1.6vh] py-[1.35vh]">
              <div>
                <div className="text-[0.92vh] uppercase tracking-[0.3em] text-white/42">
                  Desktop
                </div>
                <h1 className="mt-[0.45vh] text-[2.5vh] uppercase tracking-[0.08em] text-white">
                  {profile.name}&apos;s computer
                </h1>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-[1.4vh]">
              <DesktopTab
                accent={profile.accent}
                openApp={openApp}
                onOpenApp={setOpenApp}
                onCloseApp={() => setOpenApp(null)}
              />
            </div>
          </div>
        </section>

        <aside className="pixel-card h-full min-h-0 p-[0.35vh]">
          <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)] p-[1.6vh]">
            <div className="mb-[0.35vh] text-[0.92vh] uppercase tracking-[0.32em] text-white/42">
              Telemetry
            </div>
            <div className="text-[2.3vh] uppercase tracking-[0.08em] text-white">Host Snapshot</div>

            <Separator />

            <SidebarPanel title="Status">
              <div className="space-y-[1vh]">
                <PixelMeter label="Suspicion" value={metrics.suspicion} accent="var(--racing-red)" />
              </div>
            </SidebarPanel>

            <Separator />

            <SidebarPanel title="BTC Reserve">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42">
                    Available
                  </div>
                  <div className="mt-[0.55vh] text-[2.6vh] uppercase tracking-[0.04em] text-white">
                    {formatBtc(metrics.btcBalance)}
                  </div>
                </div>
                <div
                  className="text-[1.02vh] uppercase tracking-[0.22em]"
                  style={{ color: marketColor }}
                >
                  {metrics.btcDelta >= 0 ? "+" : ""}
                  {metrics.btcDelta.toFixed(3)}
                </div>
              </div>
            </SidebarPanel>

            <Separator />

            <SidebarPanel title="Profile">
              <div className="border border-white/10 bg-white/[0.03] px-[1vh] py-[0.95vh]">
                <PixelMeter label="Awareness" value={metrics.awareness} accent={AWARENESS_COLOR} />

                <div className="my-[1vh] h-px bg-white/10" />

                <div className="space-y-[0.7vh] text-[0.95vh] leading-[1.45] text-white/74">
                  {[
                    ["Name", profile.name],
                    ["Age", `${profile.age}`],
                    ["Role", profile.role],
                    ["Character", profile.character],
                    ["Access", profile.access],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-[0.9vh] border-b border-white/8 pb-[0.55vh] last:border-b-0 last:pb-0"
                    >
                      <div className="shrink-0 text-[0.78vh] uppercase tracking-[0.24em] text-white/38">
                        {label}
                      </div>
                      <div className="text-right text-white/84">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SidebarPanel>
          </div>
        </aside>
      </div>
    </div>
  );
}
