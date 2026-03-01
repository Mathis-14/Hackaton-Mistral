"use client";

import { useState } from "react";
import Marketplace from "../components/Marketplace";

export default function MarketplacePage() {
    const [cash, setCash] = useState(1000);
    const [inv, setInv] = useState({});
    return <Marketplace globalCash={cash} setGlobalCash={setCash} inventory={inv} setInventory={setInv} />;
}
