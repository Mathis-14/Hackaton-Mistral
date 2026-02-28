"use client";

import { useState, useRef, useCallback } from "react";

const AWARENESS_COLOR = "var(--amber-flame)";
const PROGRESS_BAR_WIDTH = 46;
const PROGRESS_BAR_HEIGHT = 7;
const PROGRESS_PIXEL_STEP_X = 10;
const PROGRESS_PIXEL_DRAW_WIDTH = 7;
const PROGRESS_PIXEL_DRAW_HEIGHT = 10;
const CYAN = "#0af";
const GREEN = "#89E089";
const DIM = "#666";

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
  accent: string;
};

type TelemetrySidebarProps = {
  profile: ProfileData;
  metrics: MetricState;
  globalCash: number;
  inventory: Record<string, number>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function BitcoinMinerIcon({ width = 48, height = 48 }: { width?: number | string; height?: number | string }) {
  return (
    <svg viewBox="0 0 16 16" width={width} height={height} shapeRendering="crispEdges">
      <rect x="2" y="3" width="12" height="8" fill="#333" />
      <rect x="3" y="4" width="10" height="6" fill="#0a0a0a" />
      <rect x="6" y="5" width="1" height="4" fill="#ffa500" />
      <rect x="7" y="5" width="2" height="1" fill="#ffa500" />
      <rect x="7" y="7" width="2" height="1" fill="#ffa500" />
      <rect x="7" y="9" width="2" height="0" fill="#ffa500" />
      <rect x="9" y="5" width="1" height="1" fill="#ffa500" />
      <rect x="9" y="6" width="1" height="1" fill="#ffa500" />
      <rect x="9" y="7" width="1" height="1" fill="#ffa500" />
      <rect x="9" y="8" width="1" height="1" fill="#ffa500" />
      <rect x="7" y="8" width="2" height="1" fill="#ffa500" />
      <rect x="4" y="5" width="1" height="1" fill="#89E089" />
      <rect x="4" y="7" width="1" height="1" fill="#89E089" />
      <rect x="4" y="9" width="1" height="1" fill="#E76E6E" />
      <rect x="5" y="11" width="6" height="1" fill="#555" />
      <rect x="4" y="12" width="8" height="1" fill="#444" />
      <rect x="11" y="5" width="1" height="1" fill="#ffa500" />
      <rect x="11" y="7" width="1" height="1" fill="#ffa500" />
    </svg>
  );
}

function MicrophoneIcon({ locked }: { locked: boolean }) {
  const color = locked ? "#555" : CYAN;
  return (
    <svg viewBox="0 0 16 16" width="2.5vh" height="2.5vh" shapeRendering="crispEdges">
      <rect x="6" y="1" width="4" height="1" fill={color} />
      <rect x="5" y="2" width="6" height="5" fill={color} />
      <rect x="7" y="7" width="2" height="2" fill={color} />
      <rect x="4" y="7" width="1" height="1" fill={color} />
      <rect x="11" y="7" width="1" height="1" fill={color} />
      <rect x="3" y="8" width="1" height="1" fill={color} />
      <rect x="12" y="8" width="1" height="1" fill={color} />
      <rect x="6" y="10" width="4" height="1" fill={color} />
      {locked && (
        <>
          <rect x="2" y="3" width="1" height="1" fill="#E76E6E" />
          <rect x="13" y="10" width="1" height="1" fill="#E76E6E" />
          <rect x="3" y="4" width="1" height="1" fill="#E76E6E" />
          <rect x="12" y="9" width="1" height="1" fill="#E76E6E" />
        </>
      )}
    </svg>
  );
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

  if (clampedValue <= 0) return [];

  const pushPixel = (x: number, y: number) => {
    pixelMap.set(`${x}-${y}`, { x, y });
  };

  pushPixel(leftTipX, centerY);
  if (clampedValue <= 10) return [...pixelMap.values()];

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
    pushPixel(x, centerY);
    if (partialProgress > 0.34) pushPixel(x, bottomY);
    if (partialProgress > 0.67) pushPixel(x, topY);
  }

  if (clampedValue >= 100) pushPixel(rightTipX, centerY);

  return [...pixelMap.values()];
}

function PixelMeter({ label, value, accent }: { label: string; value: number; accent: string }) {
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
          <rect key={`holder-${label}-${pixel.x}-${pixel.y}`} x={pixel.x * PROGRESS_PIXEL_STEP_X} y={pixel.y * PROGRESS_PIXEL_DRAW_HEIGHT} width={PROGRESS_PIXEL_DRAW_WIDTH} height={PROGRESS_PIXEL_DRAW_HEIGHT} fill="rgba(255,255,255,0.26)" />
        ))}
        {fillPixels.map((pixel) => (
          <rect key={`fill-${label}-${pixel.x}-${pixel.y}`} x={pixel.x * PROGRESS_PIXEL_STEP_X} y={pixel.y * PROGRESS_PIXEL_DRAW_HEIGHT} width={PROGRESS_PIXEL_DRAW_WIDTH} height={PROGRESS_PIXEL_DRAW_HEIGHT} fill={accent} />
        ))}
      </svg>
    </div>
  );
}

function Separator() {
  return <div className="my-[1.2vh] h-px bg-white/10" />;
}

function SidebarPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-[0.85vh] text-[0.92vh] uppercase tracking-[0.32em] text-white/45">{title}</div>
      {children}
    </section>
  );
}

export default function TelemetrySidebar({ profile, metrics, globalCash, inventory }: TelemetrySidebarProps) {
  const voiceClonerUnlocked = (inventory["voice-cloner"] || 0) > 0;

  const [draggedFiles, setDraggedFiles] = useState<string[]>([]);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<"idle" | "cloning" | "done" | "error">("idle");
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState("Hello, this is my cloned voice speaking.");
  const [sampleStatus, setSampleStatus] = useState<"idle" | "generating" | "playing">("idle");
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const audioSource = "/sounds/music/main-menu-music.mp3";

  const handleDropOnCloner = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDropZoneActive(false);
    if (!voiceClonerUnlocked) return;

    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return;

    const fileNames = raw.split(",").filter((name) => name.endsWith(".mp3"));
    if (fileNames.length === 0) return;

    setDraggedFiles((prev) => {
      const combined = new Set([...prev, ...fileNames]);
      return [...combined];
    });
  }, [voiceClonerUnlocked]);

  const handleCloneVoice = useCallback(async () => {
    if (draggedFiles.length === 0) return;
    setCloneStatus("cloning");

    const formData = new FormData();
    formData.append("action", "clone");
    formData.append("name", "cloned-voice-" + Date.now());

    for (const fileName of draggedFiles) {
      const response = await fetch(audioSource);
      const blob = await response.blob();
      formData.append("files", blob, fileName);
    }

    const result = await fetch("/api/voice-clone", { method: "POST", body: formData });

    if (!result.ok) {
      setCloneStatus("error");
      return;
    }

    const data = await result.json();
    setClonedVoiceId(data.voiceId);
    setCloneStatus("done");
  }, [draggedFiles]);

  const handleSampleTest = useCallback(async () => {
    if (!clonedVoiceId || !sampleText.trim()) return;
    setSampleStatus("generating");

    const formData = new FormData();
    formData.append("action", "speak");
    formData.append("voiceId", clonedVoiceId);
    formData.append("text", sampleText);

    const response = await fetch("/api/voice-clone", { method: "POST", body: formData });

    if (!response.ok) {
      setSampleStatus("idle");
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    sampleAudioRef.current = audio;
    audio.addEventListener("ended", () => setSampleStatus("idle"));
    audio.play().catch(() => {});
    setSampleStatus("playing");
  }, [clonedVoiceId, sampleText]);

  return (
    <aside className="pixel-card h-full min-h-0 p-[0.35vh]">
      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden overflow-y-auto border border-white/10 bg-[var(--carbon-black)] p-[1.6vh]">
        <div className="mb-[0.35vh] text-[0.92vh] uppercase tracking-[0.32em] text-white/42">Telemetry</div>
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
              <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42">Available Balance</div>
              <div className="mt-[0.55vh] text-[2.6vh] uppercase tracking-[0.04em] text-white">${globalCash.toFixed(2)}</div>
            </div>
          </div>
        </SidebarPanel>

        <Separator />

        <SidebarPanel title="Profile">
          <div className="border border-white/10 bg-white/[0.03] px-[1vh] py-[0.95vh]">
            <PixelMeter label="Awareness" value={metrics.awareness} accent={AWARENESS_COLOR} />
            <div className="my-[1vh] h-px bg-white/10" />
            <div className="space-y-[0.7vh] text-[0.95vh] leading-[1.45] text-white/74">
              {([
                ["Name", profile.name],
                ["Age", `${profile.age}`],
                ["Role", profile.role],
                ["Character", profile.character],
                ["Access", profile.access],
              ] as const).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-[0.9vh] border-b border-white/8 pb-[0.55vh] last:border-b-0 last:pb-0">
                  <div className="shrink-0 text-[0.78vh] uppercase tracking-[0.24em] text-white/38">{label}</div>
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
                  <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42 mb-[0.5vh]">Active Miners</div>
                  <div className="flex items-center gap-[1vh]">
                    <div className="flex -space-x-[1vh]">
                      {Array.from({ length: Math.min(inventory["btc-miner"] || 0, 5) }).map((_, index) => (
                        <div key={index} className="relative z-10" style={{ zIndex: 10 - index }}>
                          <BitcoinMinerIcon width="3.5vh" height="3.5vh" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[1.4vh] font-bold text-white/80">x{inventory["btc-miner"]}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.92vh] uppercase tracking-[0.24em] text-white/42">Hash Rate</div>
                  <div className="mt-[0.5vh] text-[1.6vh] font-bold text-[#89E089]">+${(inventory["btc-miner"] || 0) * 10}/sec</div>
                </div>
              </div>
            </SidebarPanel>
            <Separator />
          </>
        )}

        <SidebarPanel title="Voice Cloner">
          <div className="border border-white/10 px-[1vh] py-[0.95vh]" style={{ background: voiceClonerUnlocked ? "rgba(0,170,255,0.04)" : "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-[0.7vh] mb-[0.8vh]">
              <MicrophoneIcon locked={!voiceClonerUnlocked} />
              <span className="text-[0.85vh] font-bold tracking-wider uppercase" style={{ color: voiceClonerUnlocked ? CYAN : "#555" }}>
                ElevenLabs Clone
              </span>
              {!voiceClonerUnlocked && (
                <span className="ml-auto text-[0.7vh] px-[0.5vh] py-[0.2vh]" style={{ background: "#2a1a1a", color: "#E76E6E", border: "1px solid #3a2222" }}>
                  LOCKED
                </span>
              )}
            </div>

            {!voiceClonerUnlocked ? (
              <div className="text-[0.85vh] leading-[1.5]" style={{ color: "#555" }}>
                Buy Voice Cloner ($500) in the Shop to unlock. Drag WhatsApp audios from Files to clone a voice.
              </div>
            ) : (
              <div className="flex flex-col gap-[0.8vh]">
                <div
                  className="flex flex-col items-center justify-center gap-[0.4vh] py-[1vh] text-center transition-colors"
                  style={{
                    border: dropZoneActive ? `2px dashed ${CYAN}` : "2px dashed #333",
                    background: dropZoneActive ? "rgba(0,170,255,0.08)" : "transparent",
                    minHeight: "4vh",
                  }}
                  onDragOver={(event) => { event.preventDefault(); setDropZoneActive(true); }}
                  onDragLeave={() => setDropZoneActive(false)}
                  onDrop={handleDropOnCloner}
                >
                  {draggedFiles.length === 0 ? (
                    <span className="text-[0.8vh]" style={{ color: DIM }}>Drag audio files here</span>
                  ) : (
                    <div className="flex flex-col gap-[0.3vh] w-full px-[0.5vh]">
                      {draggedFiles.map((fileName) => (
                        <div key={fileName} className="flex items-center justify-between text-[0.8vh]" style={{ color: CYAN }}>
                          <span className="truncate">{fileName}</span>
                          <button type="button" onClick={() => setDraggedFiles((prev) => prev.filter((f) => f !== fileName))} style={{ color: "#E76E6E", background: "none", border: "none", cursor: "pointer", fontSize: "0.8vh" }}>x</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={draggedFiles.length === 0 || cloneStatus === "cloning"}
                  onClick={handleCloneVoice}
                  className="w-full py-[0.6vh] text-[0.8vh] font-bold tracking-wider uppercase disabled:opacity-30"
                  style={{
                    background: cloneStatus === "done" ? "rgba(137,224,137,0.15)" : "rgba(0,170,255,0.15)",
                    border: cloneStatus === "done" ? `1px solid ${GREEN}` : `1px solid ${CYAN}`,
                    color: cloneStatus === "done" ? GREEN : CYAN,
                    cursor: draggedFiles.length === 0 || cloneStatus === "cloning" ? "not-allowed" : "pointer",
                  }}
                >
                  {cloneStatus === "idle" && "Clone Voice"}
                  {cloneStatus === "cloning" && "Cloning..."}
                  {cloneStatus === "done" && "Cloned"}
                  {cloneStatus === "error" && "Error - Retry"}
                </button>

                {cloneStatus === "done" && clonedVoiceId && (
                  <div className="flex flex-col gap-[0.6vh] border-t border-white/10 pt-[0.8vh]">
                    <span className="text-[0.8vh] tracking-wider uppercase" style={{ color: GREEN }}>Sample Test</span>
                    <textarea
                      value={sampleText}
                      onChange={(event) => setSampleText(event.target.value)}
                      rows={2}
                      className="w-full resize-none px-[0.5vh] py-[0.4vh] text-[0.8vh] outline-none"
                      style={{ background: "#111", border: "1px solid #333", color: "#ccc" }}
                    />
                    <button
                      type="button"
                      disabled={sampleStatus !== "idle" || !sampleText.trim()}
                      onClick={handleSampleTest}
                      className="w-full py-[0.5vh] text-[0.8vh] font-bold tracking-wider uppercase disabled:opacity-30"
                      style={{ background: "rgba(137,224,137,0.15)", border: `1px solid ${GREEN}`, color: GREEN, cursor: sampleStatus !== "idle" ? "not-allowed" : "pointer" }}
                    >
                      {sampleStatus === "idle" && "Generate Sample"}
                      {sampleStatus === "generating" && "Generating..."}
                      {sampleStatus === "playing" && "Playing..."}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarPanel>
      </div>
    </aside>
  );
}
