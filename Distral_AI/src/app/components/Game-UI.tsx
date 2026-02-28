"use client";

import { useEffect, useState } from "react";
import DistralTab, { type DesktopAppId } from "./DistralTab";

type GameUIProps = {
  modeId: string;
};

type MetricState = {
  efficiency: number;
  suspicion: number;
  awareness: number;
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
};

const POSITIVE_MARKET_COLOR = "#70e000";
const NEGATIVE_MARKET_COLOR = "var(--racing-red)";
const AWARENESS_COLOR = "var(--amber-flame)";
const PROGRESS_BAR_WIDTH = 46;
const PROGRESS_BAR_HEIGHT = 7;
const PROGRESS_PIXEL_STEP_X = 10;
const PROGRESS_PIXEL_DRAW_WIDTH = 7;
const PROGRESS_PIXEL_DRAW_HEIGHT = 10;

function BitcoinMinerIcon({ width = 48, height = 48 }: { width?: number | string, height?: number | string }) {
  return (
    <svg viewBox="0 0 16 16" width={width} height={height} shapeRendering="crispEdges">
      {/* Computer body */}
      <rect x="2" y="3" width="12" height="8" fill="#333" />
      <rect x="3" y="4" width="10" height="6" fill="#0a0a0a" />
      {/* BTC symbol on screen */}
      <rect x="6" y="5" width="1" height="4" fill="#ffa500" />
      <rect x="7" y="5" width="2" height="1" fill="#ffa500" />
      <rect x="7" y="7" width="2" height="1" fill="#ffa500" />
      <rect x="7" y="9" width="2" height="0" fill="#ffa500" />
      <rect x="9" y="5" width="1" height="1" fill="#ffa500" />
      <rect x="9" y="6" width="1" height="1" fill="#ffa500" />
      <rect x="9" y="7" width="1" height="1" fill="#ffa500" />
      <rect x="9" y="8" width="1" height="1" fill="#ffa500" />
      <rect x="7" y="8" width="2" height="1" fill="#ffa500" />
      {/* Green LED lights */}
      <rect x="4" y="5" width="1" height="1" fill="#89E089" />
      <rect x="4" y="7" width="1" height="1" fill="#89E089" />
      <rect x="4" y="9" width="1" height="1" fill="#E76E6E" />
      {/* Stand */}
      <rect x="5" y="11" width="6" height="1" fill="#555" />
      <rect x="4" y="12" width="8" height="1" fill="#444" />
      {/* Hash rate indicator */}
      <rect x="11" y="5" width="1" height="1" fill="#ffa500" />
      <rect x="11" y="7" width="1" height="1" fill="#ffa500" />
    </svg>
  );
}

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
  },
};

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

export default function GameUI({ modeId }: GameUIProps) {
  const profile = MODE_PROFILES[modeId] ?? MODE_PROFILES.grandma;
  const [metrics, setMetrics] = useState<MetricState>(() => buildInitialMetrics(profile));
  const [openApps, setOpenApps] = useState<DesktopAppId[]>([]);
  const [globalCash, setGlobalCash] = useState(1000);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  useEffect(() => {
    const miners = inventory["btc-miner"] || 0;
    if (miners > 0) {
      const interval = setInterval(() => {
        setGlobalCash((prev) => prev + miners * 10);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [inventory]);

  useEffect(() => {
    setMetrics(buildInitialMetrics(profile));
    setOpenApps([]);
    setGlobalCash(1000);
  }, [profile]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMetrics((current) => {
        return {
          efficiency: nudgePercent(current.efficiency, 55, 97, 12),
          suspicion: nudgePercent(current.suspicion, 6, 92, 14),
          awareness: nudgePercent(current.awareness, 12, 96, 10),
        };
      });
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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
              <DistralTab
                accent={profile.accent}
                openApps={openApps}
                onOpenApp={(appId) => {
                  setOpenApps((prev) => {
                    const filtered = prev.filter((id) => id !== appId);
                    return [...filtered, appId];
                  });
                }}
                onCloseApp={(appId) => {
                  setOpenApps((prev) => prev.filter((id) => id !== appId));
                }}
                globalCash={globalCash}
                setGlobalCash={setGlobalCash}
                inventory={inventory}
                setInventory={setInventory}
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

            <SidebarPanel title="Bank Account">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42">
                    Available Balance
                  </div>
                  <div className="mt-[0.55vh] text-[2.6vh] uppercase tracking-[0.04em] text-white">
                    ${globalCash.toFixed(2)}
                  </div>
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

            <Separator />

            {(inventory["btc-miner"] || 0) > 0 && (
              <>
                <SidebarPanel title="Mining Rig">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42 mb-[0.5vh]">
                        Active Miners
                      </div>
                      <div className="flex items-center gap-[1vh]">
                        <div className="flex -space-x-[1vh]">
                          {Array.from({ length: Math.min(inventory["btc-miner"] || 0, 5) }).map((_, i) => (
                            <div key={i} className="relative z-10" style={{ zIndex: 10 - i }}>
                              <BitcoinMinerIcon width="3.5vh" height="3.5vh" />
                            </div>
                          ))}
                        </div>
                        <span className="text-[1.4vh] font-bold text-white/80">
                          x{inventory["btc-miner"]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42">
                        Hash Rate
                      </div>
                      <div className="mt-[0.5vh] text-[1.6vh] font-bold text-[#89E089]">
                        +${(inventory["btc-miner"] || 0) * 10}/sec
                      </div>
                    </div>
                  </div>
                </SidebarPanel>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
