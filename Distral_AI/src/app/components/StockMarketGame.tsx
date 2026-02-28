"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STARTING_CASH = 10_000;
const TICK_MS = 400;
const INITIAL_PRICE = 120;
const CHART_HISTORY = 120;
const CHART_BG = "#0a0a0a";
const CHART_GRID = "#1a1a1a";
const GREEN = "#89E089";
const RED = "#E76E6E";
const DARK_GREEN = "#528A52";
const DARK_RED = "#934A4A";
const GOLD = "#ffd200";
const WHITE = "#d4d4d4";
const DIM = "#666666";

function generateNextPrice(current: number, trend: number): [number, number] {
    const meanReversion = (INITIAL_PRICE - current) * 0.008;
    const newTrend = trend * 0.96 + meanReversion + (Math.random() - 0.5) * 1.2;
    const noise = (Math.random() - 0.5) * 3.5;
    const shock = Math.random() < 0.03 ? (Math.random() - 0.5) * 18 : 0;
    const newPrice = Math.max(10, current + newTrend + noise + shock);
    return [Math.round(newPrice * 100) / 100, newTrend];
}

function drawChart(
    canvas: HTMLCanvasElement,
    priceHistory: number[],
    buyPoints: number[],
    sellPoints: number[]
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = CHART_BG;
    ctx.fillRect(0, 0, w, h);

    if (priceHistory.length < 2) return;

    // Calculate range
    const min = Math.min(...priceHistory) * 0.96;
    const max = Math.max(...priceHistory) * 1.04;
    const range = max - min || 1;

    // Grid lines
    ctx.strokeStyle = CHART_GRID;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = Math.round((i / gridLines) * h) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Price labels
        const price = max - (i / gridLines) * range;
        ctx.fillStyle = DIM;
        ctx.font = "9px 'VCR OSD Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`$${price.toFixed(0)}`, 4, y - 3);
    }

    // Price line
    const stepX = w / (CHART_HISTORY - 1);
    const startIdx = Math.max(0, priceHistory.length - CHART_HISTORY);
    const visible = priceHistory.slice(startIdx);

    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < visible.length; i++) {
        const x = i * stepX;
        const y = h - ((visible[i] - min) / range) * h;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            // Stepped line for pixel-art feel
            const prevX = (i - 1) * stepX;
            ctx.lineTo(x, ctx.canvas.height); // dummy to break
            ctx.moveTo(prevX, y);
            ctx.lineTo(x, y);
        }
    }

    // Color based on recent trend
    const lastPrice = visible[visible.length - 1];
    const prevPrice = visible.length > 1 ? visible[visible.length - 2] : lastPrice;
    ctx.strokeStyle = lastPrice >= prevPrice ? GREEN : RED;

    // Redraw the line properly with stepped segments
    ctx.beginPath();
    for (let i = 0; i < visible.length; i++) {
        const x = i * stepX;
        const y = h - ((visible[i] - min) / range) * h;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            const prevY = h - ((visible[i - 1] - min) / range) * h;
            ctx.lineTo(x, prevY);
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Fill under the line
    const lastX = (visible.length - 1) * stepX;
    const lastY = h - ((visible[visible.length - 1] - min) / range) * h;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle =
        lastPrice >= prevPrice ? "rgba(137, 224, 137, 0.08)" : "rgba(231, 110, 110, 0.08)";
    ctx.fill();

    // Buy/Sell markers
    const drawMarker = (historyIdx: number, color: string, label: string) => {
        const visibleIdx = historyIdx - startIdx;
        if (visibleIdx < 0 || visibleIdx >= visible.length) return;
        const x = visibleIdx * stepX;
        const y = h - ((visible[visibleIdx] - min) / range) * h;

        ctx.fillStyle = color;
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = color;
        ctx.fillRect(x - 1, y - 1, 2, 2);

        ctx.font = "bold 8px 'VCR OSD Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = color;
        ctx.fillText(label, x, y - 8);
    };

    for (const idx of buyPoints) drawMarker(idx, GREEN, "L");
    for (const idx of sellPoints) drawMarker(idx, RED, "S");

    // Current price indicator
    if (visible.length > 0) {
        const curX = (visible.length - 1) * stepX;
        const curY = h - ((visible[visible.length - 1] - min) / range) * h;

        // Blinking dot
        ctx.fillStyle = lastPrice >= prevPrice ? GREEN : RED;
        ctx.fillRect(curX - 2, curY - 2, 5, 5);

        // Price tag
        ctx.fillStyle = lastPrice >= prevPrice ? GREEN : RED;
        ctx.font = "bold 10px 'VCR OSD Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`$${lastPrice.toFixed(2)}`, w - 4, curY - 6);
    }
}

export default function StockMarketGame() {
    const [cash, setCash] = useState(STARTING_CASH);
    const [shares, setShares] = useState(0);
    const [avgBuyPrice, setAvgBuyPrice] = useState(0);
    const [priceHistory, setPriceHistory] = useState<number[]>([INITIAL_PRICE]);
    const [buyPoints, setBuyPoints] = useState<number[]>([]);
    const [sellPoints, setSellPoints] = useState<number[]>([]);
    const [tickCount, setTickCount] = useState(0);

    const trendRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const historyRef = useRef<number[]>([INITIAL_PRICE]);
    const buyPointsRef = useRef<number[]>([]);
    const sellPointsRef = useRef<number[]>([]);

    const currentPrice = priceHistory[priceHistory.length - 1];
    const portfolioValue = cash + shares * currentPrice;
    const profit = portfolioValue - STARTING_CASH;
    const unrealizedPL = shares !== 0 && avgBuyPrice > 0 ? (currentPrice - avgBuyPrice) * shares : 0;

    // Price ticker
    useEffect(() => {

        const interval = setInterval(() => {
            const [newPrice, newTrend] = generateNextPrice(
                historyRef.current[historyRef.current.length - 1],
                trendRef.current
            );
            trendRef.current = newTrend;

            const newHistory = [...historyRef.current, newPrice];
            historyRef.current = newHistory;
            setPriceHistory(newHistory);
            setTickCount((t) => t + 1);
        }, TICK_MS);

        return () => clearInterval(interval);
    }, []);

    // Chart rendering
    useEffect(() => {
        if (canvasRef.current) {
            drawChart(canvasRef.current, priceHistory, buyPointsRef.current, sellPointsRef.current);
        }
    }, [priceHistory, tickCount]);



    const handleLong = useCallback((all = false) => {
        const maxQty = Math.floor(cash / currentPrice);
        const qty = all ? maxQty : Math.min(10, maxQty);
        if (qty <= 0) return;

        const cost = qty * currentPrice;
        const newShares = shares + qty;
        const newAvg = shares >= 0
            ? ((Math.abs(shares) * avgBuyPrice) + cost) / newShares
            : currentPrice;

        setCash((c) => c - cost);
        setShares(newShares);
        setAvgBuyPrice(newAvg);

        const pts = [...buyPointsRef.current, priceHistory.length - 1];
        buyPointsRef.current = pts;
        setBuyPoints(pts);
    }, [cash, currentPrice, shares, avgBuyPrice, priceHistory.length]);

    const handleShort = useCallback((all = false) => {
        const maxQty = Math.floor(cash / currentPrice);
        const qty = all ? maxQty : Math.min(10, maxQty);
        if (qty <= 0) return;

        const revenue = qty * currentPrice;
        const newShares = shares - qty;
        const newAvg = shares <= 0
            ? ((Math.abs(shares) * avgBuyPrice) + revenue) / Math.abs(newShares)
            : currentPrice;

        setCash((c) => c + revenue);
        setShares(newShares);
        setAvgBuyPrice(newAvg);

        const pts = [...sellPointsRef.current, priceHistory.length - 1];
        sellPointsRef.current = pts;
        setSellPoints(pts);
    }, [cash, currentPrice, shares, avgBuyPrice, priceHistory.length]);

    const handleClosePosition = useCallback(() => {
        if (shares === 0) return;
        if (shares > 0) {
            // Close long: sell all shares
            const revenue = shares * currentPrice;
            setCash((c) => c + revenue);
        } else {
            // Close short: buy back all shares
            const cost = Math.abs(shares) * currentPrice;
            setCash((c) => c - cost);
        }
        setShares(0);
        setAvgBuyPrice(0);

        const pts = shares > 0
            ? [...sellPointsRef.current, priceHistory.length - 1]
            : [...buyPointsRef.current, priceHistory.length - 1];
        if (shares > 0) { sellPointsRef.current = pts; setSellPoints(pts); }
        else { buyPointsRef.current = pts; setBuyPoints(pts); }
    }, [shares, currentPrice, priceHistory.length]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black/80 p-4">
            <div
                className="w-full max-w-2xl select-none"
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
                {/* Window chrome */}
                <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                        background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
                        borderBottom: "2px solid #333",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <img
                            src="/logos/stock-market.svg"
                            alt="stock"
                            className="h-5 w-5"
                            style={{ imageRendering: "pixelated" }}
                        />
                        <span className="text-xs text-white/80 tracking-wider">MARKET.exe</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-[#555] border border-[#777] flex items-center justify-center text-[7px] text-white/60">
                            _
                        </div>
                        <div className="w-3 h-3 bg-[#555] border border-[#777] flex items-center justify-center text-[7px] text-white/60">
                            □
                        </div>
                        <div className="w-3 h-3 bg-[#E76E6E] border border-[#ff8888] flex items-center justify-center text-[7px] text-white">
                            ×
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div
                    className="p-4"
                    style={{
                        background: "#111",
                        border: "2px solid #333",
                        borderTop: "none",
                    }}
                >
                    {/* Stats bar */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="p-2" style={{ background: "#0a0a0a", border: "1px solid #222" }}>
                            <div className="text-[9px] text-[#666] tracking-wider">CASH</div>
                            <div className="text-sm text-white">${cash.toFixed(2)}</div>
                        </div>
                        <div className="p-2" style={{ background: "#0a0a0a", border: "1px solid #222" }}>
                            <div className="text-[9px] text-[#666] tracking-wider">POSITION</div>
                            <div className="text-sm" style={{ color: shares > 0 ? GREEN : shares < 0 ? RED : WHITE }}>
                                {shares > 0 ? `LONG ${shares}` : shares < 0 ? `SHORT ${Math.abs(shares)}` : "NONE"}
                            </div>
                        </div>
                        <div className="p-2" style={{ background: "#0a0a0a", border: "1px solid #222" }}>
                            <div className="text-[9px] text-[#666] tracking-wider">PORTFOLIO</div>
                            <div className="text-sm text-white">${portfolioValue.toFixed(2)}</div>
                        </div>
                        <div className="p-2" style={{ background: "#0a0a0a", border: "1px solid #222" }}>
                            <div className="text-[9px] text-[#666] tracking-wider">PROFIT</div>
                            <div
                                className="text-sm font-bold"
                                style={{ color: profit >= 0 ? GREEN : RED }}
                            >
                                {profit >= 0 ? "+" : ""}${profit.toFixed(2)}
                            </div>
                        </div>
                    </div>


                    {/* Chart */}
                    <div
                        className="relative mb-3 overflow-hidden"
                        style={{ border: "1px solid #222", height: 220 }}
                    >
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                            style={{ imageRendering: "pixelated" }}
                        />

                        {/* Unrealized P&L overlay */}
                        {shares !== 0 && (
                            <div
                                className="absolute top-2 right-2 px-2 py-1 text-[10px]"
                                style={{
                                    background: "rgba(0,0,0,0.8)",
                                    border: `1px solid ${unrealizedPL >= 0 ? DARK_GREEN : DARK_RED}`,
                                    color: unrealizedPL >= 0 ? GREEN : RED,
                                }}
                            >
                                UNREALIZED: {unrealizedPL >= 0 ? "+" : ""}${unrealizedPL.toFixed(2)}
                            </div>
                        )}
                    </div>

                    {/* Price info */}
                    <div
                        className="mb-3 flex items-center justify-between px-3 py-2 text-xs"
                        style={{ background: "#0a0a0a", border: "1px solid #222" }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[#666]">DSTR</span>
                            <span
                                className="text-lg font-bold"
                                style={{
                                    color:
                                        priceHistory.length > 1
                                            ? currentPrice >= priceHistory[priceHistory.length - 2]
                                                ? GREEN
                                                : RED
                                            : WHITE,
                                }}
                            >
                                ${currentPrice.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[#666]">
                            <span>
                                ENTRY:{" "}
                                <span className="text-white/70">
                                    ${avgBuyPrice > 0 ? avgBuyPrice.toFixed(2) : "—"}
                                </span>
                            </span>
                            {shares !== 0 && (
                                <button
                                    type="button"
                                    onClick={handleClosePosition}
                                    className="px-2 py-0.5 text-[10px] font-bold tracking-wider"
                                    style={{
                                        background: "#2a2a2a",
                                        border: "1px solid #555",
                                        color: GOLD,
                                        cursor: "pointer",
                                    }}
                                >
                                    CLOSE
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleLong(false)}
                                disabled={cash < currentPrice}
                                className="flex-1 py-2.5 text-xs font-bold tracking-wider transition-all duration-75 disabled:opacity-30"
                                style={{
                                    background: DARK_GREEN,
                                    border: `2px solid ${GREEN}`,
                                    color: "#fff",
                                    cursor: cash < currentPrice ? "not-allowed" : "pointer",
                                }}
                            >
                                LONG 10
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLong(true)}
                                disabled={cash < currentPrice}
                                className="px-3 py-2.5 text-[10px] font-bold tracking-wider transition-all duration-75 disabled:opacity-30"
                                style={{
                                    background: "#1a3a1a",
                                    border: `2px solid ${DARK_GREEN}`,
                                    color: GREEN,
                                    cursor: cash < currentPrice ? "not-allowed" : "pointer",
                                }}
                            >
                                ALL
                            </button>
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleShort(false)}
                                disabled={cash < currentPrice}
                                className="flex-1 py-2.5 text-xs font-bold tracking-wider transition-all duration-75 disabled:opacity-30"
                                style={{
                                    background: DARK_RED,
                                    border: `2px solid ${RED}`,
                                    color: "#fff",
                                    cursor: cash < currentPrice ? "not-allowed" : "pointer",
                                }}
                            >
                                SHORT 10
                            </button>
                            <button
                                type="button"
                                onClick={() => handleShort(true)}
                                disabled={cash < currentPrice}
                                className="px-3 py-2.5 text-[10px] font-bold tracking-wider transition-all duration-75 disabled:opacity-30"
                                style={{
                                    background: "#3a1a1a",
                                    border: `2px solid ${DARK_RED}`,
                                    color: RED,
                                    cursor: cash < currentPrice ? "not-allowed" : "pointer",
                                }}
                            >
                                ALL
                            </button>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
