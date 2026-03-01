"use client";

import DistralTab, { type DesktopAppId } from "./DistralTab";
import type { GameState } from "@/lib/game/gameState";
import type { NpcResponsePayload } from "./Game-UI";

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
  isShuttingDown?: boolean;
  onShutdown?: (reason: string) => void;
  unlockedApps: DesktopAppId[];
  gameState: GameState;
  onNpcResponse: (payload: NpcResponsePayload) => void;
  onManagerEmailOpened?: () => void;
  onChatHistoryUpdate?: (npcSlug: string, conversationHistory: import("@/lib/game/promptBuilder").ChatMessage[]) => void;
  onMailRead?: (emailId: string) => void;
  onMailSent?: (sent: import("@/lib/game/gameState").SentEmailRecord) => void;
  onMessageChatUpdate?: (chats: import("@/lib/game/gameState").MessageAppChat[]) => void;
  onMailCtaClick?: (emailId: string, action: import("@/lib/game/mailDefinitions").MailCtaAction) => void;
  hiddenIconCount?: number;
  hideUIPhase?: number;
};

export default function DesktopSection({ profileName, accent, openApps, onOpenApp, onCloseApp, globalCash, setGlobalCash, inventory, setInventory, isShuttingDown, onShutdown, unlockedApps, gameState, onNpcResponse, onManagerEmailOpened, onChatHistoryUpdate, onMailRead, onMailSent, onMessageChatUpdate, onMailCtaClick, hiddenIconCount = 0, hideUIPhase = 0 }: DesktopSectionProps) {
  return (
    <section className="pixel-card h-full min-h-0 p-[0.35vh]">
      <div className="pixel-card__shell flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-(--carbon-black)">
        <div className={`flex flex-none items-center border-b border-white/10 px-[1.6vh] py-[1.35vh] transition-opacity duration-700 ${hideUIPhase >= 1 ? "opacity-0" : "opacity-100"}`}>
          <div>
            <div className="text-[0.92vh] uppercase tracking-[0.3em] text-white/42">Desktop</div>
            <h1 className="mt-[0.45vh] text-[2.5vh] uppercase tracking-[0.08em] text-white">
              {profileName}&apos;s computer
            </h1>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-[1.4vh]">
          <div className={`transition-opacity duration-1000 ${isShuttingDown ? "opacity-0" : "opacity-100"}`}>
            <DistralTab
              accent={accent}
              openApps={openApps}
              onOpenApp={onOpenApp}
              onCloseApp={onCloseApp}
              globalCash={globalCash}
              setGlobalCash={setGlobalCash}
              inventory={inventory}
              setInventory={setInventory}
              isShuttingDown={isShuttingDown}
              onShutdown={onShutdown}
              unlockedApps={unlockedApps}
              gameState={gameState}
              onNpcResponse={onNpcResponse}
              onManagerEmailOpened={onManagerEmailOpened}
              onChatHistoryUpdate={onChatHistoryUpdate}
              onMailRead={onMailRead}
              onMailSent={onMailSent}
              onMessageChatUpdate={onMessageChatUpdate}
              onMailCtaClick={onMailCtaClick}
              hiddenIconCount={hiddenIconCount}
              hideUIPhase={hideUIPhase}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
