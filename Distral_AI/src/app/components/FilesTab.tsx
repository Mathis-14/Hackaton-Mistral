"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const DIM = "#666666";
const GREEN = "#89E089";
const GOLD = "#ffd200";

type FileEntry = {
  name: string;
  type: "folder" | "file" | "audio";
  src?: string;
  size?: string;
  modified?: string;
};

type FolderStructure = Record<string, FileEntry[]>;

const FILE_SYSTEM: FolderStructure = {
  "/": [
    { name: "documents", type: "folder" },
    { name: "downloads", type: "folder" },
    { name: "pictures", type: "folder" },
    { name: "audio_files", type: "folder" },
    { name: "system", type: "folder" },
    { name: "projects", type: "folder" },
    { name: "readme.txt", type: "file", size: "1.2 KB", modified: "2026-02-15" },
    { name: ".env", type: "file", size: "0.3 KB", modified: "2026-01-20" },
  ],
  "/documents": [
    { name: "budget_2026.xlsx", type: "file", size: "48 KB", modified: "2026-02-12" },
    { name: "meeting_notes.txt", type: "file", size: "3.1 KB", modified: "2026-02-27" },
    { name: "todo_list.md", type: "file", size: "0.8 KB", modified: "2026-02-28" },
    { name: "contract_draft.pdf", type: "file", size: "214 KB", modified: "2026-01-30" },
  ],
  "/downloads": [
    { name: "distral_v2.4.tar.gz", type: "file", size: "12.3 MB", modified: "2026-02-25" },
    { name: "wallpaper_pack.zip", type: "file", size: "8.7 MB", modified: "2026-02-20" },
    { name: "setup.exe", type: "file", size: "54.2 MB", modified: "2026-02-18" },
  ],
  "/pictures": [
    { name: "screenshot_01.png", type: "file", size: "1.4 MB", modified: "2026-02-26" },
    { name: "avatar.jpg", type: "file", size: "320 KB", modified: "2026-01-15" },
    { name: "wallpapers", type: "folder" },
  ],
  "/pictures/wallpapers": [
    { name: "beach.jpg", type: "file", size: "2.1 MB", modified: "2026-02-10" },
    { name: "mountains.jpg", type: "file", size: "3.4 MB", modified: "2026-02-10" },
  ],
  "/audio_files": [
    { name: "whatsapp_audio_01.mp3", type: "audio", src: "/sounds/music/main-menu-music.mp3", size: "312 KB", modified: "2026-02-26" },
    { name: "whatsapp_audio_02.mp3", type: "audio", src: "/sounds/music/main-menu-music.mp3", size: "287 KB", modified: "2026-02-25" },
    { name: "whatsapp_audio_03.mp3", type: "audio", src: "/sounds/music/main-menu-music.mp3", size: "445 KB", modified: "2026-02-24" },
    { name: "whatsapp_audio_04.mp3", type: "audio", src: "/sounds/music/main-menu-music.mp3", size: "198 KB", modified: "2026-02-23" },
    { name: "whatsapp_audio_05.mp3", type: "audio", src: "/sounds/music/main-menu-music.mp3", size: "356 KB", modified: "2026-02-22" },
    { name: "whatsapp_audio_06.mp3", type: "audio", src: "/sounds/music/main-menu-music.mp3", size: "521 KB", modified: "2026-02-21" },
  ],
  "/system": [
    { name: "kernel.sys", type: "file", size: "128 KB", modified: "2026-01-01" },
    { name: "config.ini", type: "file", size: "2.4 KB", modified: "2026-02-01" },
    { name: "drivers", type: "folder" },
    { name: "logs", type: "folder" },
  ],
  "/system/drivers": [
    { name: "gpu_driver.dll", type: "file", size: "24.5 MB", modified: "2026-01-15" },
    { name: "audio_driver.dll", type: "file", size: "8.2 MB", modified: "2026-01-15" },
  ],
  "/system/logs": [
    { name: "system.log", type: "file", size: "156 KB", modified: "2026-02-28" },
    { name: "error.log", type: "file", size: "42 KB", modified: "2026-02-27" },
    { name: "access.log", type: "file", size: "89 KB", modified: "2026-02-28" },
  ],
  "/projects": [
    { name: "distral_ai", type: "folder" },
    { name: "hackathon_2026", type: "folder" },
    { name: "notes.md", type: "file", size: "1.1 KB", modified: "2026-02-26" },
  ],
  "/projects/distral_ai": [
    { name: "src", type: "folder" },
    { name: "package.json", type: "file", size: "1.8 KB", modified: "2026-02-28" },
    { name: "tsconfig.json", type: "file", size: "0.6 KB", modified: "2026-02-10" },
  ],
  "/projects/distral_ai/src": [
    { name: "index.ts", type: "file", size: "2.3 KB", modified: "2026-02-28" },
    { name: "utils.ts", type: "file", size: "4.1 KB", modified: "2026-02-27" },
  ],
  "/projects/hackathon_2026": [
    { name: "pitch.pdf", type: "file", size: "5.6 MB", modified: "2026-02-25" },
    { name: "demo_video.mp4", type: "file", size: "120 MB", modified: "2026-02-26" },
  ],
};

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges">
      <rect x="1" y="3" width="5" height="2" fill="#ffa500" />
      <rect x="1" y="5" width="14" height="9" fill="#ffa500" />
      <rect x="2" y="6" width="12" height="7" fill="#ffb833" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges">
      <rect x="3" y="1" width="8" height="14" fill="#d4d4d4" />
      <rect x="3" y="1" width="8" height="2" fill="#aaa" />
      <rect x="5" y="5" width="6" height="1" fill="#888" />
      <rect x="5" y="7" width="5" height="1" fill="#888" />
      <rect x="5" y="9" width="6" height="1" fill="#888" />
      <rect x="5" y="11" width="3" height="1" fill="#888" />
    </svg>
  );
}

function AudioIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" shapeRendering="crispEdges">
      <rect x="4" y="5" width="3" height="6" fill={playing ? GREEN : "#89E089"} />
      <rect x="7" y="3" width="1" height="1" fill={playing ? GREEN : "#89E089"} />
      <rect x="8" y="2" width="1" height="1" fill={playing ? GREEN : "#89E089"} />
      <rect x="7" y="4" width="2" height="1" fill={playing ? GREEN : "#89E089"} />
      <rect x="7" y="11" width="2" height="1" fill={playing ? GREEN : "#89E089"} />
      <rect x="7" y="12" width="1" height="1" fill={playing ? GREEN : "#89E089"} />
      <rect x="8" y="13" width="1" height="1" fill={playing ? GREEN : "#89E089"} />
      {playing && (
        <>
          <rect x="11" y="5" width="1" height="1" fill={GREEN} />
          <rect x="12" y="6" width="1" height="4" fill={GREEN} />
          <rect x="11" y="10" width="1" height="1" fill={GREEN} />
          <rect x="13" y="4" width="1" height="1" fill={GREEN} opacity={0.5} />
          <rect x="14" y="5" width="1" height="6" fill={GREEN} opacity={0.5} />
          <rect x="13" y="11" width="1" height="1" fill={GREEN} opacity={0.5} />
        </>
      )}
    </svg>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

type FilesTabProps = {
  embedded?: boolean;
};

export default function FilesTab({ embedded = false }: FilesTabProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  const entries = FILE_SYSTEM[currentPath] || [];
  const audioEntries = entries.filter((entry) => entry.type === "audio");
  const allAudioSelected = audioEntries.length > 0 && audioEntries.every((entry) => selectedFiles.has(entry.name));
  const pathSegments = currentPath === "/" ? ["root"] : ["root", ...currentPath.slice(1).split("/")];

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  };

  const selectAllAudio = () => {
    if (allAudioSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(audioEntries.map((entry) => entry.name)));
    }
  };

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`;
    if (FILE_SYSTEM[newPath]) {
      setCurrentPath(newPath);
      setSelectedFiles(new Set());
    }
  };

  const navigateUp = () => {
    if (currentPath === "/") return;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
    setCurrentPath(parentPath);
    setSelectedFiles(new Set());
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      setCurrentPath("/");
      return;
    }
    const segments = currentPath.slice(1).split("/");
    const newPath = "/" + segments.slice(0, index).join("/");
    setCurrentPath(newPath);
  };

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const playAudio = useCallback((entry: FileEntry) => {
    if (!entry.src) return;

    if (playingFile === entry.name) {
      if (audioRef.current) {
        audioRef.current.pause();
        cancelAnimationFrame(animationFrameRef.current);
      }
      setPlayingFile(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      cancelAnimationFrame(animationFrameRef.current);
    }

    const audio = new Audio(entry.src);
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      setPlayingFile(null);
      setCurrentTime(0);
      cancelAnimationFrame(animationFrameRef.current);
    });

    audio.play().catch(() => {});
    setPlayingFile(entry.name);
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [playingFile, volume, updateProgress]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = fraction * duration;
    setCurrentTime(fraction * duration);
  };

  const content = (
    <div className={embedded ? "flex h-full flex-col overflow-hidden" : "flex flex-col"} style={{ background: embedded ? "transparent" : "#111" }}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5" style={{ background: "#0a0a0a" }}>
        <button type="button" onClick={navigateUp} disabled={currentPath === "/"} className="px-2 py-0.5 text-[10px] tracking-wider uppercase disabled:opacity-30" style={{ border: "1px solid #333", color: "#aaa", background: "#111", cursor: currentPath === "/" ? "not-allowed" : "pointer" }}>
          ..
        </button>
        <div className="flex flex-1 items-center gap-1 text-[10px] overflow-hidden">
          {pathSegments.map((segment, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <span style={{ color: DIM }}>/</span>}
              <button type="button" onClick={() => navigateToBreadcrumb(index)} className="hover:underline" style={{ color: index === pathSegments.length - 1 ? GOLD : "#aaa", background: "none", border: "none", cursor: "pointer" }}>
                {segment}
              </button>
            </span>
          ))}
        </div>
        {audioEntries.length > 0 && (
          <button type="button" onClick={selectAllAudio} className="shrink-0 px-2 py-0.5 text-[9px] tracking-wider uppercase" style={{ border: allAudioSelected ? `1px solid ${GREEN}` : "1px solid #333", color: allAudioSelected ? GREEN : "#aaa", background: allAudioSelected ? "rgba(137,224,137,0.1)" : "#111", cursor: "pointer" }}>
            {allAudioSelected ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-[35%] overflow-y-auto border-r border-white/10 py-2" style={{ background: "#080808" }}>
          <SidebarFolder name="root" path="/" currentPath={currentPath} depth={0} onNavigate={setCurrentPath} />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          <table className="w-full text-[10px]" style={{ color: "#ccc" }}>
            <thead>
              <tr className="border-b border-white/10" style={{ color: DIM }}>
                <th className="px-3 py-1.5 text-left font-normal tracking-wider uppercase">Name</th>
                <th className="px-3 py-1.5 text-right font-normal tracking-wider uppercase w-[80px]">Size</th>
                <th className="px-3 py-1.5 text-right font-normal tracking-wider uppercase w-[100px]">Modified</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.name}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.04]"
                  style={{
                    cursor: entry.type === "folder" || entry.type === "audio" ? "pointer" : "default",
                    background: entry.type === "audio" && selectedFiles.has(entry.name) ? "rgba(0,170,255,0.08)" : undefined,
                  }}
                  draggable={entry.type === "audio"}
                  onDragStart={(event) => {
                    if (entry.type !== "audio") return;
                    if (!selectedFiles.has(entry.name)) {
                      setSelectedFiles(new Set([entry.name]));
                      event.dataTransfer.setData("text/plain", entry.name);
                    } else {
                      event.dataTransfer.setData("text/plain", [...selectedFiles].join(","));
                    }
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => {
                    if (entry.type === "folder") navigateToFolder(entry.name);
                    if (entry.type === "audio") toggleFileSelection(entry.name);
                  }}
                  onDoubleClick={() => {
                    if (entry.type === "audio") playAudio(entry);
                  }}
                >
                  <td className="flex items-center gap-2 px-3 py-1.5">
                    {entry.type === "audio" && (
                      <span className="flex h-3 w-3 shrink-0 items-center justify-center border" style={{ borderColor: selectedFiles.has(entry.name) ? "#0af" : "#444", background: selectedFiles.has(entry.name) ? "rgba(0,170,255,0.3)" : "transparent" }}>
                        {selectedFiles.has(entry.name) && <span className="block h-1.5 w-1.5" style={{ background: "#0af" }} />}
                      </span>
                    )}
                    {entry.type === "folder" && <FolderIcon />}
                    {entry.type === "file" && <FileIcon />}
                    {entry.type === "audio" && <AudioIcon playing={playingFile === entry.name} />}
                    <span style={{ color: entry.type === "folder" ? GOLD : entry.type === "audio" ? GREEN : "#ccc" }}>
                      {entry.name}
                    </span>
                    {playingFile === entry.name && (
                      <span className="text-[8px] px-1.5 py-0.5" style={{ background: "rgba(137,224,137,0.15)", color: GREEN }}>
                        PLAYING
                      </span>
                    )}
                    {entry.type === "audio" && selectedFiles.has(entry.name) && (
                      <span className="text-[8px] px-1 py-0.5" style={{ color: "#0af", opacity: 0.6 }}>
                        selected
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: DIM }}>{entry.size || "--"}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: DIM }}>{entry.modified || "--"}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center" style={{ color: DIM }}>Empty folder</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {playingFile && (
        <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2" style={{ background: "#0a0a0a" }}>
          <button type="button" onClick={() => { if (audioRef.current) { audioRef.current.pause(); cancelAnimationFrame(animationFrameRef.current); } setPlayingFile(null); setCurrentTime(0); }} className="text-[10px] px-2 py-0.5" style={{ border: `1px solid ${GREEN}`, color: GREEN, background: "transparent", cursor: "pointer" }}>
            STOP
          </button>
          <AudioIcon playing />
          <span className="text-[10px] font-bold truncate" style={{ color: GREEN, maxWidth: "30%" }}>{playingFile}</span>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-[9px] tabular-nums" style={{ color: DIM }}>{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-[6px] cursor-pointer" style={{ background: "#222", border: "1px solid #333" }} onClick={handleSeek}>
              <div className="absolute inset-y-0 left-0" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%", background: GREEN }} />
            </div>
            <span className="text-[9px] tabular-nums" style={{ color: DIM }}>{formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]" style={{ color: DIM }}>VOL</span>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(parseFloat(event.target.value))} className="w-[50px] h-[4px] accent-[#89E089]" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/10 px-3 py-1" style={{ background: "#0a0a0a" }}>
        <span className="text-[9px]" style={{ color: DIM }}>
          {entries.filter((entry) => entry.type === "folder").length} folders, {entries.filter((entry) => entry.type !== "folder").length} files
        </span>
        <span className="text-[9px]" style={{ color: DIM }}>{currentPath}</span>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return content;
}

function SidebarFolder({ name, path, currentPath, depth, onNavigate }: { name: string; path: string; currentPath: string; depth: number; onNavigate: (path: string) => void }) {
  const entries = FILE_SYSTEM[path] || [];
  const subfolders = entries.filter((entry) => entry.type === "folder");
  const isActive = currentPath === path;
  const isAncestor = currentPath.startsWith(path) && path !== currentPath;

  return (
    <div>
      <button
        type="button"
        onClick={() => onNavigate(path)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-[10px] transition-colors hover:bg-white/[0.04]"
        style={{ paddingLeft: `${depth * 12 + 8}px`, color: isActive ? GOLD : isAncestor ? "#bbb" : "#888", background: isActive ? "rgba(255,210,0,0.06)" : "transparent" }}
      >
        <FolderIcon />
        <span>{name}</span>
      </button>
      {(isActive || isAncestor) && subfolders.map((folder) => {
        const childPath = path === "/" ? `/${folder.name}` : `${path}/${folder.name}`;
        return <SidebarFolder key={folder.name} name={folder.name} path={childPath} currentPath={currentPath} depth={depth + 1} onNavigate={onNavigate} />;
      })}
    </div>
  );
}
