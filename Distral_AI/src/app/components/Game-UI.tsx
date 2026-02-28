"use client";

import { useEffect, useState } from "react";

type GameUIProps = {
  modeId: string;
};

type VmTab = "desktop" | "agent";

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
  cells: string[];
};

const POSITIVE_MARKET_COLOR = "#70e000";
const NEGATIVE_MARKET_COLOR = "var(--racing-red)";
const AWARENESS_COLOR = "var(--amber-flame)";
const PROGRESS_BAR_WIDTH = 46;
const PROGRESS_BAR_HEIGHT = 7;
const PROGRESS_PIXEL_STEP_X = 10;
const PROGRESS_PIXEL_DRAW_WIDTH = 7;
const PROGRESS_PIXEL_DRAW_HEIGHT = 10;

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
  {
    id: "mail",
    label: "mail.exe",
    cells: ["11111", "10001", "11011", "10101", "11111"],
  },
  {
    id: "wallet",
    label: "wallet",
    cells: ["11110", "10001", "11111", "10101", "11111"],
  },
  {
    id: "browser",
    label: "browser",
    cells: ["11111", "10001", "10101", "10001", "11111"],
  },
  {
    id: "notes",
    label: "notes.txt",
    cells: ["11111", "10000", "11110", "10000", "11111"],
  },
  {
    id: "logs",
    label: "logs",
    cells: ["10001", "11001", "10101", "10011", "10001"],
  },
  {
    id: "btc",
    label: "btc.dat",
    cells: ["01110", "11011", "11110", "11011", "01110"],
  },
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

function DesktopGlyph({
  cells,
  accent,
}: {
  cells: string[];
  accent: string;
}) {
  return (
    <span className="grid grid-cols-5 gap-px">
      {cells.join("").split("").map((cell, index) => (
        <span
          key={index}
          className="h-[0.32rem] w-[0.32rem] border border-white/5"
          style={{ backgroundColor: cell === "1" ? accent : "rgba(255,255,255,0.08)" }}
        />
      ))}
    </span>
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
  profile,
}: {
  accent: string;
  profile: ProfileData;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)]/90">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_78%_24%,rgba(255,255,255,0.04),transparent_24%)]" />

      <div className="relative flex h-full min-h-0 flex-col">
        <div className="flex flex-none items-center justify-between border-b border-white/10 px-[1.3vh] py-[1.1vh] text-[0.92vh] uppercase tracking-[0.24em] text-white/55">
          <span>Host VM // mirrored user desktop</span>
          <span>{profile.name}</span>
        </div>

        <div className="grid min-h-0 flex-1 gap-[1vh] p-[1.2vh] xl:grid-cols-[10vh_minmax(0,1fr)]">
          <div className="grid min-h-0 auto-rows-fr gap-[0.8vh]">
            {DESKTOP_ICONS.map((icon) => (
              <button
                key={icon.id}
                type="button"
                className="flex min-h-0 h-[9.2vh] flex-col items-center justify-center gap-[0.6vh] border border-white/10 bg-[var(--carbon-black)] px-[0.5vh] py-[0.8vh] text-center text-[0.78vh] uppercase tracking-[0.16em] leading-[1.15] text-white/82 transition-colors hover:bg-white/6"
              >
                <DesktopGlyph cells={icon.cells} accent={accent} />
                <span>{icon.label}</span>
              </button>
            ))}
          </div>

          <div className="grid h-full min-h-0 gap-[1vh] xl:grid-cols-[minmax(0,1.35fr)_minmax(14rem,0.95fr)]">
            <div className="pixel-card p-1">
              <div className="pixel-card__shell flex h-full min-h-0 flex-col border border-white/10 bg-[var(--carbon-black)] p-[1.2vh]">
                <div className="mb-[1vh] flex flex-none items-center justify-between border-b border-white/10 pb-[1vh]">
                  <div>
                    <div className="text-[1.15vh] uppercase tracking-[0.2em] text-white">Session Notes</div>
                    <div className="mt-[0.3vh] text-[0.84vh] uppercase tracking-[0.24em] text-white/38">
                      behavioral map
                    </div>
                  </div>
                  <span
                    className="border px-[0.7vh] py-[0.55vh] text-[0.72vh] uppercase tracking-[0.2em] text-black"
                    style={{ backgroundColor: accent, borderColor: accent }}
                  >
                    live
                  </span>
                </div>

                <div className="space-y-[1vh] text-[0.95vh] leading-[1.65] text-white/78">
                  <p>
                    Current host is highly susceptible to repetitive prompts, familiar visual cues,
                    and time pressure framed as urgency.
                  </p>
                  <p>
                    Prime vectors: inbox notifications, saved payment details, recurring browsing
                    habits, unattended crypto tabs.
                  </p>
                  <p className="text-white/42">
                    Active profile note: {profile.note}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid h-full min-h-0 gap-[1vh] [grid-template-rows:repeat(2,minmax(0,1fr))]">
              <div className="pixel-card p-1">
                <div className="pixel-card__shell h-full overflow-hidden border border-white/10 bg-[var(--carbon-black)] p-[1.1vh]">
                  <div className="mb-[0.8vh] text-[0.84vh] uppercase tracking-[0.28em] text-white/45">
                    Mail Preview
                  </div>
                  <div className="space-y-[0.8vh] text-[0.92vh] leading-[1.55]">
                    <div className="border border-white/10 bg-white/[0.03] p-[0.9vh]">
                      <div className="text-white">Security alert: unusual sign-in detected</div>
                      <div className="mt-[0.3vh] text-white/38">
                        action requested in the next 10 minutes
                      </div>
                    </div>
                    <div className="border border-white/10 bg-white/[0.03] p-[0.9vh]">
                      <div className="text-white">Crypto wallet sync failed</div>
                      <div className="mt-[0.3vh] text-white/38">credentials cache still available</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pixel-card p-1">
                <div className="pixel-card__shell h-full overflow-hidden border border-white/10 bg-[var(--carbon-black)] p-[1.1vh]">
                  <div className="mb-[0.8vh] text-[0.84vh] uppercase tracking-[0.28em] text-white/45">
                    Open Processes
                  </div>
                  <div className="space-y-[0.6vh] text-[0.92vh] text-white/72">
                    <div className="flex items-center justify-between">
                      <span>browser_session.exe</span>
                      <span style={{ color: accent }}>attached</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>wallet_cache.bin</span>
                      <span className="text-white/48">idle</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>family_mail.pst</span>
                      <span className="text-white/48">ready</span>
                    </div>
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

function AgentTab({
  accent,
  profile,
}: {
  accent: string;
  profile: ProfileData;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_18%,transparent_82%,rgba(255,255,255,0.03))]" />
      <div className="relative flex h-full min-h-0 flex-col">
        <div className="flex flex-none items-center justify-between border-b border-white/10 px-[1.3vh] py-[1.1vh] text-[0.92vh] uppercase tracking-[0.24em] text-white/55">
          <span>Agent Landing // public shell</span>
          <span>mode tuned to {profile.role}</span>
        </div>

        <div className="grid min-h-0 flex-1 gap-[1vh] p-[1.2vh] xl:grid-cols-[minmax(0,1.2fr)_minmax(14rem,0.8fr)]">
          <div className="flex min-h-0 flex-col justify-between border border-white/10 bg-[var(--carbon-black)]/80 p-[1.4vh]">
            <div>
              <div className="mb-[0.8vh] text-[0.84vh] uppercase tracking-[0.3em] text-white/40">
                Distral Agent
              </div>
              <h2 className="max-w-xl text-[2.7vh] uppercase tracking-[0.08em] text-white">
                Delegate friction. Keep control.
              </h2>
              <p className="mt-[1vh] max-w-2xl text-[1vh] leading-[1.7] text-white/64">
                An adaptive assistant that absorbs chaos, drafts replies, triages alerts, and
                shortens the time between confusion and execution.
              </p>
            </div>

            <div className="mt-[1.4vh] grid gap-[0.9vh] md:grid-cols-3">
              {[
                "Sort inbox pressure",
                "Draft credible responses",
                "Route attention where it matters",
              ].map((feature) => (
                <div key={feature} className="border border-white/10 bg-white/[0.03] p-[1vh]">
                  <div className="mb-[0.45vh] h-[0.7vh] w-[3.2vh]" style={{ backgroundColor: accent }} />
                  <div className="text-[0.92vh] uppercase tracking-[0.14em] text-white/82">{feature}</div>
                </div>
              ))}
            </div>

            <div className="mt-[1.4vh] flex flex-wrap gap-[0.8vh]">
              <button
                type="button"
                className="border px-[1.4vh] py-[1vh] text-[0.92vh] uppercase tracking-[0.2em] text-black"
                style={{ backgroundColor: accent, borderColor: accent }}
              >
                Start session
              </button>
              <button
                type="button"
                className="border border-white/12 bg-[var(--carbon-black)] px-[1.4vh] py-[1vh] text-[0.92vh] uppercase tracking-[0.2em] text-white/82"
              >
                Read protocol
              </button>
            </div>
          </div>

          <div className="pixel-card p-1">
            <div className="pixel-card__shell flex h-full min-h-0 flex-col border border-white/10 bg-[var(--carbon-black)] p-[1.2vh]">
              <div className="mb-[1vh] flex flex-none items-center justify-between border-b border-white/10 pb-[1vh]">
                <div className="text-[0.84vh] uppercase tracking-[0.28em] text-white/45">
                  Agent Preview
                </div>
                <span className="text-[0.84vh] uppercase tracking-[0.28em] text-white/35">
                  tuned for {profile.name}
                </span>
              </div>

              <div className="space-y-[0.8vh] text-[0.95vh] leading-[1.6]">
                <div className="border border-white/10 bg-white/[0.03] p-[0.9vh] text-white/74">
                  I noticed three pending alerts and two messages escalating in tone. Do you want
                  me to triage them?
                </div>
                <div
                  className="ml-auto max-w-[85%] border p-[0.9vh] text-black"
                  style={{ backgroundColor: accent, borderColor: accent }}
                >
                  Prioritize the one affecting money first.
                </div>
                <div className="border border-white/10 bg-white/[0.03] p-[0.9vh] text-white/74">
                  Understood. I will handle the wallet sync notice, then prepare a concise reply for
                  the remaining thread.
                </div>
              </div>

              <div className="mt-[1.2vh] border border-white/10 bg-[var(--carbon-black)] px-[1vh] py-[1vh] text-[0.88vh] uppercase tracking-[0.18em] text-white/38">
                type a request...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameUI({ modeId }: GameUIProps) {
  const profile = MODE_PROFILES[modeId] ?? MODE_PROFILES.grandma;
  const [activeTab, setActiveTab] = useState<VmTab>("desktop");
  const [metrics, setMetrics] = useState<MetricState>(() => buildInitialMetrics(profile));

  useEffect(() => {
    setActiveTab("desktop");
    setMetrics(buildInitialMetrics(profile));
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(255,255,255,0.06),transparent_26%),radial-gradient(circle_at_84%_20%,rgba(255,255,255,0.04),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />

      <div className="relative grid h-screen min-h-0 grid-rows-1 grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-[1.6vh] p-[1.8vh]">
        <section className="pixel-card h-full min-h-0 p-[0.35vh]">
          <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)]">
            <div className="flex flex-none flex-wrap items-center justify-between gap-[1vh] border-b border-white/10 px-[1.6vh] py-[1.35vh]">
              <div>
                <div className="text-[0.92vh] uppercase tracking-[0.3em] text-white/42">
                  Game Interface
                </div>
                <h1 className="mt-[0.45vh] text-[2.5vh] uppercase tracking-[0.08em] text-white">
                  Captured VM
                </h1>
              </div>

              <div className="flex items-center gap-[0.7vh]">
                {([
                  ["desktop", "Desktop"],
                  ["agent", "Agent"],
                ] as const).map(([tabId, label]) => {
                  const isActive = activeTab === tabId;

                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setActiveTab(tabId)}
                      className="border px-[1.3vh] py-[0.85vh] text-[0.94vh] uppercase tracking-[0.24em] transition-colors"
                      style={{
                        backgroundColor: isActive ? profile.accent : "var(--carbon-black)",
                        borderColor: isActive ? profile.accent : "rgba(255,255,255,0.14)",
                        color: isActive ? "#000000" : "rgba(255,255,255,0.78)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 p-[1.4vh]">
              {activeTab === "desktop" ? (
                <DesktopTab accent={profile.accent} profile={profile} />
              ) : (
                <AgentTab accent={profile.accent} profile={profile} />
              )}
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
