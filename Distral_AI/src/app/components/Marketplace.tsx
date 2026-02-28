"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const STARTING_CASH = 10_000;

const GREEN = "#89E089";
const RED = "#E76E6E";
const GOLD = "#ffd200";
const WHITE = "#d4d4d4";
const DIM = "#666666";
const DARK_GREEN = "#528A52";

// ──────────────────────────────────────
// Pixel-art icons (inline SVG components)
// ──────────────────────────────────────

function WallpaperIcon() {
    return (
        <svg viewBox="0 0 16 16" width="48" height="48" shapeRendering="crispEdges">
            {/* Frame */}
            <rect x="1" y="2" width="14" height="12" fill="#2a2a2a" />
            <rect x="2" y="3" width="12" height="10" fill="#1a6b8a" />
            {/* Sun */}
            <rect x="10" y="4" width="2" height="2" fill="#ffd200" />
            {/* Mountains */}
            <rect x="2" y="9" width="1" height="1" fill="#3a9a5a" />
            <rect x="3" y="8" width="1" height="2" fill="#3a9a5a" />
            <rect x="4" y="7" width="1" height="3" fill="#3a9a5a" />
            <rect x="5" y="8" width="1" height="2" fill="#3a9a5a" />
            <rect x="6" y="9" width="1" height="1" fill="#3a9a5a" />
            {/* Water */}
            <rect x="2" y="10" width="12" height="3" fill="#4a90c4" />
            <rect x="4" y="11" width="3" height="1" fill="#6ab4e8" />
            <rect x="9" y="11" width="2" height="1" fill="#6ab4e8" />
            {/* Sand */}
            <rect x="2" y="12" width="12" height="1" fill="#d4a24a" />
        </svg>
    );
}

function BitcoinMinerIcon() {
    return (
        <svg viewBox="0 0 16 16" width="48" height="48" shapeRendering="crispEdges">
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

function NeoRobotIcon() {
    return (
        <svg viewBox="0 0 16 16" width="48" height="48" shapeRendering="crispEdges">
            {/* Antenna */}
            <rect x="7" y="1" width="2" height="1" fill="#888" />
            <rect x="8" y="0" width="1" height="1" fill="#E76E6E" />
            {/* Head */}
            <rect x="5" y="2" width="6" height="5" fill="#aaa" />
            <rect x="5" y="2" width="6" height="1" fill="#888" />
            {/* Eyes */}
            <rect x="6" y="3" width="2" height="2" fill="#0af" />
            <rect x="9" y="3" width="2" height="2" fill="#0af" />
            <rect x="7" y="4" width="1" height="1" fill="#06a" />
            <rect x="10" y="4" width="1" height="1" fill="#06a" />
            {/* Mouth */}
            <rect x="6" y="6" width="4" height="1" fill="#555" />
            <rect x="7" y="6" width="1" height="1" fill="#89E089" />
            <rect x="9" y="6" width="1" height="1" fill="#89E089" />
            {/* Neck */}
            <rect x="7" y="7" width="2" height="1" fill="#777" />
            {/* Body */}
            <rect x="4" y="8" width="8" height="5" fill="#999" />
            <rect x="4" y="8" width="8" height="1" fill="#777" />
            {/* Chest panel */}
            <rect x="6" y="9" width="4" height="3" fill="#333" />
            <rect x="7" y="10" width="2" height="1" fill="#ffd200" />
            {/* Arms */}
            <rect x="3" y="9" width="1" height="3" fill="#888" />
            <rect x="12" y="9" width="1" height="3" fill="#888" />
            {/* Legs */}
            <rect x="5" y="13" width="2" height="2" fill="#777" />
            <rect x="9" y="13" width="2" height="2" fill="#777" />
            {/* Feet */}
            <rect x="4" y="15" width="3" height="1" fill="#555" />
            <rect x="9" y="15" width="3" height="1" fill="#555" />
        </svg>
    );
}

// ──────────────────────────────────────
// Item definitions
// ──────────────────────────────────────

interface MarketItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
    preview?: string; // optional image preview
    maxOwned?: number;
}

const ITEMS: MarketItem[] = [
    {
        id: "wallpaper",
        name: "Beach Wallpaper",
        description: "A beach paradise wallpaper for your desktop.",
        price: 20,
        icon: <WallpaperIcon />,
        preview: "/beach.jpg",
        maxOwned: 1,
    },
    {
        id: "btc-miner",
        name: "Bitcoin Miner",
        description: "Mines BTC in the background, make some 100$ a minute. Stack them up!",
        price: 1000,
        icon: <BitcoinMinerIcon />,
    },
    {
        id: "neo-robot",
        name: "Neo the Robot",
        description: "Buy Neo the Robot, the best way to give a body to your favorite AI.",
        price: 20_000,
        icon: <NeoRobotIcon />,
        maxOwned: 1,
    },
];

// ──────────────────────────────────────
// Marketplace Component
// ──────────────────────────────────────

type MarketplaceProps = {
    onClose?: () => void;
    embedded?: boolean;
    onWallpaperChange?: (url: string) => void;
    globalCash: number;
    setGlobalCash: React.Dispatch<React.SetStateAction<number>>;
    inventory: Record<string, number>;
    setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export default function Marketplace({ onClose, embedded = false, onWallpaperChange, globalCash, setGlobalCash, inventory, setInventory }: MarketplaceProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<string | null>(null);
    const [buyFlash, setBuyFlash] = useState<string | null>(null);

    const buyAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        buyAudioRef.current = new Audio("/sounds/music/game effect/buy-sound.mp3");
        buyAudioRef.current.volume = 0.5;
    }, []);

    const playBuySound = useCallback(() => {
        if (buyAudioRef.current) {
            buyAudioRef.current.currentTime = 0;
            buyAudioRef.current.play().catch(() => { });
        }
    }, []);

    const handleBuy = (item: MarketItem) => {
        if (globalCash < item.price) return;
        const owned = inventory[item.id] || 0;
        if (item.maxOwned && owned >= item.maxOwned) return;

        setGlobalCash((c) => c - item.price);
        setInventory((inv) => ({ ...inv, [item.id]: (inv[item.id] || 0) + 1 }));
        setBuyFlash(item.id);
        playBuySound();
        setTimeout(() => setBuyFlash(null), 300);

        if (item.preview && onWallpaperChange) {
            onWallpaperChange(item.preview);
        }
    };

    const totalOwned = Object.values(inventory).reduce((a, b) => a + b, 0);

    const content = (
        <div
            className={embedded ? "h-full overflow-auto p-[1.45vh]" : "p-4"}
            style={{
                background: embedded ? "transparent" : "#111",
                border: embedded ? "none" : "2px solid #333",
                borderTop: embedded ? "none" : "none",
            }}
        >
            {/* Header stats */}
            <div className="mb-4 w-1/3">
                <div className="p-2" style={{ background: "#0a0a0a", border: "1px solid #222" }}>
                    <div className="text-[9px] tracking-wider" style={{ color: DIM }}>CASH</div>
                    <div className="text-sm text-white">${globalCash.toFixed(2)}</div>
                </div>
            </div>

            {/* Items grid */}
            <div className="space-y-2">
                {ITEMS.map((item) => {
                    const owned = inventory[item.id] || 0;
                    const canBuy = globalCash >= item.price && !(item.maxOwned && owned >= item.maxOwned);
                    const isMaxed = item.maxOwned ? owned >= item.maxOwned : false;
                    const isFlashing = buyFlash === item.id;

                    return (
                        <div
                            key={item.id}
                            className="flex flex-col gap-0 transition-all duration-150"
                            style={{
                                background: isFlashing
                                    ? "rgba(137, 224, 137, 0.1)"
                                    : hoveredItem === item.id
                                        ? "#151515"
                                        : "#0d0d0d",
                                border: isFlashing
                                    ? `1px solid ${GREEN}`
                                    : hoveredItem === item.id
                                        ? "1px solid #333"
                                        : "1px solid #1a1a1a",
                            }}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div className="flex items-center gap-3 p-3">
                                <div
                                    className="shrink-0 flex items-center justify-center"
                                    style={{
                                        width: 56,
                                        height: 56,
                                        background: "#0a0a0a",
                                        border: "1px solid #222",
                                        imageRendering: "pixelated" as React.CSSProperties["imageRendering"],
                                    }}
                                >
                                    {item.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-white tracking-wider">
                                            {item.name}
                                        </span>
                                        {owned > 0 && (
                                            <span
                                                className="text-[9px] px-1.5 py-0.5"
                                                style={{ background: DARK_GREEN, color: GREEN }}
                                            >
                                                OWNED{owned > 1 ? ` x${owned}` : ""}
                                            </span>
                                        )}
                                        {isMaxed && (
                                            <span
                                                className="text-[9px] px-1.5 py-0.5"
                                                style={{ background: "#3a3a1a", color: GOLD }}
                                            >
                                                MAX
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] leading-tight" style={{ color: DIM }}>
                                        {item.description}
                                    </div>

                                    {item.preview && (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewItem(previewItem === item.id ? null : item.id)}
                                            className="text-[9px] mt-1 tracking-wider"
                                            style={{ color: "#6ab4e8", cursor: "pointer", background: "none", border: "none" }}
                                        >
                                            {previewItem === item.id ? "▼ HIDE PREVIEW" : "▶ SHOW PREVIEW"}
                                        </button>
                                    )}
                                </div>

                                <div className="shrink-0 flex flex-col items-end gap-1.5">
                                    <div className="text-sm font-bold" style={{ color: GOLD }}>
                                        ${item.price.toLocaleString()}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleBuy(item)}
                                        disabled={!canBuy}
                                        className="px-4 py-1.5 text-[10px] font-bold tracking-wider transition-all duration-75 disabled:opacity-30"
                                        style={{
                                            background: canBuy ? DARK_GREEN : "#1a1a1a",
                                            border: canBuy ? `2px solid ${GREEN}` : "2px solid #333",
                                            color: canBuy ? "#fff" : "#555",
                                            cursor: canBuy ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        {isMaxed ? "OWNED" : "BUY"}
                                    </button>
                                </div>
                            </div>

                            {item.preview && previewItem === item.id && (
                                <div
                                    className="px-3 pb-3"
                                    style={{ background: "#0a0a0a" }}
                                >
                                    <img
                                        src={item.preview}
                                        alt={item.name}
                                        className="w-full h-28 object-cover"
                                        style={{ imageRendering: "auto", border: "1px solid #222" }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-black/80 p-4">
            <div
                className="w-full max-w-2xl select-none"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
                <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                        background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
                        borderBottom: "2px solid #333",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🏪</span>
                        <span className="text-xs text-white/80 tracking-wider">SHOP.exe</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-[#555] border border-[#777] flex items-center justify-center text-[7px] text-white/60">_</div>
                        <div className="w-3 h-3 bg-[#555] border border-[#777] flex items-center justify-center text-[7px] text-white/60">□</div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-3 h-3 bg-[#E76E6E] border border-[#ff8888] flex items-center justify-center text-[7px] text-white cursor-pointer hover:bg-[#ff8888]"
                        >
                            ×
                        </button>
                    </div>
                </div>
                {content}
            </div>
        </div >
    );
}
