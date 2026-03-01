"use client";

import Image from "next/image";
import type { MapNode } from "@/lib/map-types";
import {
  getAccessLabel,
  getInfectionLabel,
  isNodeRevealed,
} from "@/lib/map-utils";

type MapNodeCardProps = {
  node: MapNode;
  knownPeople: string[];
  selected: boolean;
  onSelect: (nodeId: MapNode["id"]) => void;
  centerName?: boolean;
  tiny?: boolean;
};

function splitNameForDisplay(name: string): [string, string | null] {
  const words = name.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [name.toUpperCase(), null];
  if (words.length === 2) return [words[0], words[1]];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function dotColor(node: MapNode) {
  if (node.infectionState === "infected") return "#ff8303";
  if (node.infectionState === "suspected") return "#ffb103";
  if (node.accessState === "reachable") return "#d4a520";
  return "#b09870";
}

function textColor(node: MapNode) {
  if (node.accessState === "current") return "#d47a18";
  if (node.accessState === "reachable") return "#c49320";
  return "#a08050";
}

export default function MapNodeCard({
  node,
  knownPeople,
  selected,
  onSelect,
  centerName = true,
  tiny = false,
}: MapNodeCardProps) {
  const revealed = isNodeRevealed(node, knownPeople);
  const displayName = revealed && node.fullName
    ? node.fullName
    : "Unknown";
  const isCurrent = node.accessState === "current";
  const isLocked = node.accessState === "locked";
  const nodeNumber = node.isServer
    ? "SRV"
    : String(node.maskedLabel.match(/\d+/)?.[0] ?? "00").padStart(2, "0");

  const tc = textColor(node);
  const dc = dotColor(node);

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`relative h-full w-full cursor-pointer text-left transition-all duration-150 ${tiny ? "flex flex-col items-center" : ""}`}
      style={{
        filter: isLocked && !selected
          ? "brightness(0.45) saturate(0.5)"
          : selected && isLocked
            ? "brightness(0.7) saturate(0.7)"
            : "none",
      }}
      aria-pressed={selected}
      aria-label={`${displayName}, ${getAccessLabel(node.accessState)}, ${getInfectionLabel(node.infectionState)}`}
    >
      <div className={`relative ${tiny ? "flex-1 w-full min-h-0" : "h-full w-full"}`}>
        <Image
          src="/image copy.png"
          alt=""
          width={400}
          height={320}
          className="h-full w-full object-contain [image-rendering:pixelated]"
          draggable={false}
          priority
        />

        {/* Screen overlay — positioned on the monitor screen area */}
        <div
          className="absolute"
          style={{
            top: "16%",
            left: "16%",
            right: "16%",
            bottom: "35%",
          }}
        >
          {/* Status dot — top left */}
          <span
            className={`absolute ${isCurrent ? "motion-safe:animate-pulse" : ""}`}
            style={{
              top: "4%",
              left: "4%",
              width: tiny ? "4px" : "10px",
              height: tiny ? "4px" : "10px",
              background: dc,
            }}
          />

          {!tiny && (
            <>
              {/* Node number — top right */}
              <span
                className="absolute font-[family-name:var(--font-vcr)] text-[11px] tracking-[0.12em]"
                style={{ top: "2%", right: "4%", color: tc }}
              >
                {nodeNumber}
              </span>

              {/* Name — centered in the screen area */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div
                  className={`font-[family-name:var(--font-vcr)] text-[11px] uppercase leading-tight tracking-[0.12em] ${centerName ? "text-center" : ""}`}
                  style={{
                    color: centerName ? (isLocked ? "#b07850" : "#ff8303") : tc,
                    textShadow: centerName ? "0 0 6px rgba(255,131,3,0.5)" : undefined,
                  }}
                >
                  {centerName ? (
                    (() => {
                      const [line1, line2] = splitNameForDisplay(displayName);
                      return (
                        <>
                          <div>{line1}</div>
                          {line2 && <div>{line2}</div>}
                        </>
                      );
                    })()
                  ) : (
                    displayName
                  )}
                </div>
              </div>

              {/* Separator + bottom row */}
              <div className="absolute bottom-0 left-0 right-0">
                <div style={{ height: "1px", background: tc, opacity: 0.5 }} />
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className="font-[family-name:var(--font-vcr)] text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: tc }}
                  >
                    {revealed ? "ID" : "---"}
                  </span>
                  <span
                    className="font-[family-name:var(--font-vcr)] text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: tc }}
                  >
                    {getAccessLabel(node.accessState)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tiny mode: name below the computer image */}
      {tiny && (
        <div
          className="w-full flex-1 flex items-center justify-center"
        >
          <span
            className="text-center font-[family-name:var(--font-vcr)] uppercase leading-none tracking-[0.08em] truncate w-full px-0.5"
            style={{
              fontSize: "9px",
              color: tc,
            }}
          >
            {displayName}
          </span>
        </div>
      )}
    </button>
  );
}
