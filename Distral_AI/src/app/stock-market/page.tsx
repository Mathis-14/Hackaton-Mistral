"use client";

import { useState } from "react";
import StockMarketGame from "../components/StockMarketGame";

export default function StockMarketPage() {
    const [cash, setCash] = useState(1000);
    return <StockMarketGame globalCash={cash} setGlobalCash={setCash} />;
}
