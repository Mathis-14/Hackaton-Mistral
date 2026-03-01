"use client";

import { useMemo, useState } from "react";
import MapNodeCard from "@/components/map/MapNodeCard";
import { INITIAL_SANDBOX_MAP_STATE } from "@/lib/map-state";
import type { MapNode, MapNodeId } from "@/lib/map-types";

type Conn = { col: number; row: number; dir: "h" | "v"; fromIdx: number };

function buildGrid(n: number) {
    const cols = Math.min(4, Math.max(1, n));
    const rows = Math.ceil(n / 4);

    const colTemplate = Array(cols)
        .fill(null)
        .flatMap((_, i) => (i < cols - 1 ? ["1fr", "12px"] : ["1fr"]))
        .join(" ");
    const rowTemplate = Array(rows)
        .fill(null)
        .flatMap((_, i) => (i < rows - 1 ? ["1fr", "12px"] : ["1fr"]))
        .join(" ");

    const nodePositions: [number, number][] = [];
    const connections: Conn[] = [];

    let idx = 0;
    for (let r = 0; r < rows; r++) {
        const countInRow = Math.min(4, n - idx);
        const isReversed = r % 2 === 1;
        const colIndices = isReversed
            ? Array.from({ length: countInRow }, (_, i) => 2 * (countInRow - 1 - i) + 1)
            : Array.from({ length: countInRow }, (_, i) => 2 * i + 1);

        for (const c of colIndices) {
            nodePositions.push([c, 2 * r + 1]);
        }

        for (let i = 0; i < countInRow - 1; i++) {
            const col = isReversed ? colIndices[i] - 1 : colIndices[i] + 1;
            connections.push({ col, row: 2 * r + 1, dir: "h", fromIdx: idx + i });
        }

        idx += countInRow;

        if (idx < n && r < rows - 1) {
            const lastCol = colIndices[colIndices.length - 1];
            connections.push({ col: lastCol, row: 2 * r + 2, dir: "v", fromIdx: idx - 1 });
        }
    }

    return { nodePositions, connections, colTemplate, rowTemplate };
}

function isActive(a: MapNode, b: MapNode) {
    return a.accessState !== "locked" && b.accessState !== "locked";
}

type TinyInfectionMapProps = {
    maxComputers?: number;
    centerName?: boolean;
};

export default function TinyInfectionMap({ maxComputers = 3, centerName = false }: TinyInfectionMapProps) {
    const [mapState] = useState(INITIAL_SANDBOX_MAP_STATE);
    const [selectedNodeId, setSelectedNodeId] =
        useState<MapNodeId>(mapState.selectedNodeId);

    const visibleNodes = mapState.nodes.slice(0, maxComputers);
    const { nodePositions, connections, colTemplate, rowTemplate } = useMemo(
        () => buildGrid(visibleNodes.length),
        [visibleNodes.length],
    );

    return (
        <div
            style={{
                position: "fixed",
                bottom: 0,
                right: 0,
                width: "25vw",
                height: "30vh",
                zIndex: 50,
            }}
            className="bg-[#0e0e0e]/90 border-t border-l border-white/10 backdrop-blur-sm"
        >
            {/* Tiny header */}
            <div className="border-b border-white/10 px-2 py-1">
                <h2 className="font-[family-name:var(--font-vcr)] text-[7px] uppercase tracking-[0.18em] text-[#ff8303]">
                    Network Map
                </h2>
            </div>

            {/* Grid */}
            <div
                className="h-[calc(100%-20px)] w-full p-1 overflow-hidden"
                style={{
                    display: "grid",
                    gridTemplateColumns: colTemplate,
                    gridTemplateRows: rowTemplate.replace(/1fr/g, "auto"),
                    placeContent: "center",
                    gap: "4px",
                }}
            >
                {visibleNodes.map((node, i) => {
                    const [gc, gr] = nodePositions[i];
                    return (
                        <div key={node.id} style={{ gridColumn: gc, gridRow: gr }}>
                            <MapNodeCard
                                node={node}
                                knownPeople={mapState.knownPeople}
                                selected={node.id === selectedNodeId}
                                onSelect={setSelectedNodeId}
                                centerName={centerName}
                                tiny
                            />
                        </div>
                    );
                })}

                {connections.map((c) => {
                    const from = visibleNodes[c.fromIdx];
                    const to = visibleNodes[c.fromIdx + 1];
                    if (!to) return null;
                    const active = isActive(from, to);
                    const color = active
                        ? "rgba(210,155,60,0.6)"
                        : "rgba(142,114,70,0.25)";
                    const markerColor = active
                        ? "rgba(255,186,74,0.9)"
                        : "rgba(142,114,70,0.4)";

                    return (
                        <div
                            key={`c-${c.fromIdx}`}
                            className="relative flex items-center justify-center"
                            style={{ gridColumn: c.col, gridRow: c.row }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    background: color,
                                    ...(c.dir === "h"
                                        ? { left: 0, right: 0, top: "50%", height: "1px" }
                                        : { top: 0, bottom: 0, left: "50%", width: "1px" }),
                                }}
                            />
                            <div
                                style={{
                                    width: "4px",
                                    height: "4px",
                                    background: markerColor,
                                    transform: "rotate(45deg)",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
