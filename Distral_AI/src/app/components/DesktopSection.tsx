"use client";

import DistralTab, { type DesktopAppId } from "./DistralTab";

type DesktopSectionProps = {
  profileName: string;
  accent: string;
  openApps: DesktopAppId[];
  onOpenApp: (appId: DesktopAppId) => void;
  onCloseApp: (appId: DesktopAppId) => void;
  globalCash: number;
  setGlobalCash: React.Dispatch<React.SetStateAction<number>>;
  inventory: Record<string, number>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export default function DesktopSection({ profileName, accent, openApps, onOpenApp, onCloseApp, globalCash, setGlobalCash, inventory, setInventory }: DesktopSectionProps) {
  return (
    <section className="pixel-card h-full min-h-0 p-[0.35vh]">
      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-[var(--carbon-black)]">
        <div className="flex flex-none items-center border-b border-white/10 px-[1.6vh] py-[1.35vh]">
          <div>
            <div className="text-[0.92vh] uppercase tracking-[0.3em] text-white/42">Desktop</div>
            <h1 className="mt-[0.45vh] text-[2.5vh] uppercase tracking-[0.08em] text-white">
              {profileName}&apos;s computer
            </h1>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-[1.4vh]">
          <DistralTab
            accent={accent}
            openApps={openApps}
            onOpenApp={onOpenApp}
            onCloseApp={onCloseApp}
            globalCash={globalCash}
            setGlobalCash={setGlobalCash}
            inventory={inventory}
            setInventory={setInventory}
          />
        </div>
      </div>
    </section>
  );
}
