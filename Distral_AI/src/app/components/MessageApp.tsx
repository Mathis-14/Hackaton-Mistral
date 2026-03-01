"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { GameState, MessageAppChat } from "@/lib/game/gameState";

/* ── Types ─────────────────────────────────────────── */

type Message = {
    id: string;
    sender: "me" | "them";
    text: string;
    time: string;
    status: "sent" | "delivered" | "read";
};

type Chat = {
    id: string;
    contactName: string;
    avatar: string;
    phone: string;
    messages: Message[];
    unread: number;
    online: boolean;
};

/* ── Sample Data ───────────────────────────────────── */

const INITIAL_CHATS: Chat[] = [
    {
        id: "1",
        contactName: "Mistral Boss",
        avatar: "/distral-brand-assets/d-boxed/d-boxed-orange.svg",
        phone: "+33 6 12 34 56 78",
        unread: 2,
        online: true,
        messages: [
            { id: "m1", sender: "them", text: "Did you finish the shutdown sequence?", time: "10:41", status: "read" },
            { id: "m2", sender: "me", text: "Yes, it works perfectly now.", time: "10:45", status: "read" },
            { id: "m3", sender: "them", text: "Excellent.", time: "10:46", status: "read" },
            { id: "m4", sender: "them", text: "We need you to check the Telemetry next.", time: "10:48", status: "delivered" },
            { id: "m5", sender: "them", text: "Don't ignore me.", time: "10:55", status: "delivered" },
        ],
    },
    {
        id: "2",
        contactName: "Unknown Number",
        avatar: "/distral-brand-assets/d/d-black.png",
        phone: "+1 (555) 019-2831",
        unread: 0,
        online: false,
        messages: [
            { id: "u1", sender: "them", text: "I know what you're doing.", time: "Yesterday", status: "read" },
            { id: "u2", sender: "me", text: "Who is this?", time: "Yesterday", status: "read" },
        ],
    },
    {
        id: "3",
        contactName: "Maya (Ops)",
        avatar: "/distral-brand-assets/d/d-orange.png",
        phone: "+33 6 98 76 54 32",
        unread: 0,
        online: true,
        messages: [
            { id: "o1", sender: "me", text: "Are the servers stable?", time: "Monday", status: "read" },
            { id: "o2", sender: "them", text: "Yes, holding at 42% capacity.", time: "Monday", status: "read" },
        ],
    }
];

/* ── Components ────────────────────────────────────── */

function DoubleTick({ status }: { status: "sent" | "delivered" | "read" }) {
    // Pixel-art double tick
    return (
        <div className="flex items-center gap-[0.1vh] ml-[0.5vh]">
            <span className={`text-[0.9vh] ${status === "read" ? "text-(--neo-blue)" : "text-white/40"}`}>✓</span>
            {(status === "delivered" || status === "read") && (
                <span className={`text-[0.9vh] ${status === "read" ? "text-(--neo-blue)" : "text-white/40"} -ml-[0.3vh]`}>✓</span>
            )}
        </div>
    );
}

type MessageAppProps = {
    gameState: GameState;
    onMessageChatUpdate?: (chats: MessageAppChat[]) => void;
};

export default function MessageApp({ gameState, onMessageChatUpdate }: MessageAppProps) {
    const storedChats = gameState.messageChats;
    const initialChats = storedChats.length > 0 ? (storedChats as Chat[]) : INITIAL_CHATS;
    const [chats, setChats] = useState<Chat[]>(initialChats);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [isWaitingForReply, setIsWaitingForReply] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const chatsRef = useRef(chats);

    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        if (storedChats.length > 0) {
            setChats(storedChats as Chat[]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from persisted state only when we have data
    }, [storedChats.length]);

    const activeChat = chats.find(c => c.id === activeChatId);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [activeChat?.messages.length, activeChatId]);

    const selectChat = (chatId: string) => {
        setActiveChatId(chatId);
        const next = chatsRef.current.map(chat => {
            if (chat.id === chatId) return { ...chat, unread: 0 };
            return chat;
        });
        setChats(next);
        onMessageChatUpdate?.(next as MessageAppChat[]);
    };

    const handleSend = useCallback(async () => {
        if (!draft.trim() || !activeChatId || isWaitingForReply) return;

        const text = draft.trim();
        setDraft("");
        new Audio("/sounds/music/game%20effect/message-sent.wav").play().catch(() => { });

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            sender: "me",
            text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "sent"
        };

        const nextChats = chatsRef.current.map(chat =>
            chat.id === activeChatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
        );
        setChats(nextChats);
        onMessageChatUpdate?.(nextChats as MessageAppChat[]);

        setIsWaitingForReply(true);
        try {
            const activeChatData = chatsRef.current.find(c => c.id === activeChatId);
            const history = activeChatData?.messages.map(m => ({ sender: m.sender, text: m.text })) ?? [];
            const response = await fetch("/api/message-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactId: activeChatId,
                    message: text,
                    history,
                    gameState,
                }),
            });
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const data = await response.json();
            const dialogue = (data.dialogue ?? "").trim() || "…";
            const reply: Message = {
                id: `reply-${Date.now()}`,
                sender: "them",
                text: dialogue,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                status: "delivered"
            };
            const nextChatsAfterReply = chatsRef.current.map(chat =>
                chat.id === activeChatId ? { ...chat, messages: [...chat.messages, reply] } : chat
            );
            setChats(nextChatsAfterReply);
            onMessageChatUpdate?.(nextChatsAfterReply as MessageAppChat[]);
        } catch (error) {
            console.error("[MessageApp] message-chat failed:", error);
            const fallback: Message = {
                id: `reply-${Date.now()}`,
                sender: "them",
                text: "Sorry, I couldn't reply right now.",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                status: "delivered"
            };
            const nextChatsFallback = chatsRef.current.map(chat =>
                chat.id === activeChatId ? { ...chat, messages: [...chat.messages, fallback] } : chat
            );
            setChats(nextChatsFallback);
            onMessageChatUpdate?.(nextChatsFallback as MessageAppChat[]);
        } finally {
            setIsWaitingForReply(false);
        }
    }, [draft, activeChatId, isWaitingForReply, gameState, onMessageChatUpdate]);

    return (
        <div className="flex h-full w-full bg-(--semi-black) font-vcr text-white overflow-hidden" style={{ minWidth: "60vh" }}>
            {/* LEFT SIDEBAR - Chats List */}
            <div className="w-[30%] min-w-[20vh] border-r border-white/10 flex flex-col bg-[#111B21]">
                {/* Header */}
                <div className="h-[6vh] bg-[#202C33] flex items-center px-[2vh] border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-[1vh]">
                        <Image src="/logos/message.svg" alt="App" width={24} height={24} className="h-[2.5vh] w-auto [image-rendering:pixelated]" unoptimized />
                        <span className="text-[1.6vh] font-bold tracking-widest text-white/90">MESSAGES</span>
                    </div>
                </div>

                {/* Chats */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chats.map(chat => {
                        const lastMsg = chat.messages[chat.messages.length - 1];
                        const isActive = activeChatId === chat.id;
                        return (
                            <button
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`w-full flex items-center px-[1.5vh] py-[1.2vh] border-b border-white/5 hover:bg-[#202C33] transition-colors text-left ${isActive ? "bg-[#2A3942]" : ""}`}
                            >
                                {/* Avatar */}
                                <div className="h-[4vh] w-[4vh] rounded-full bg-white/5 overflow-hidden shrink-0 flex items-center justify-center mr-[1.5vh]">
                                    <Image src={chat.avatar} alt="" width={24} height={24} unoptimized className="w-[60%] h-auto [image-rendering:pixelated]" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-[0.2vh]">
                                        <span className="text-[1.3vh] text-white/90 truncate mr-[1vh] font-bold">{chat.contactName}</span>
                                        {lastMsg && <span className={`text-[0.9vh] ${chat.unread > 0 ? "text-[#00A884]" : "text-white/40"} shrink-0`}>{lastMsg.time}</span>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[1.1vh] text-white/50 truncate pr-[1vh] flex items-center">
                                            {lastMsg?.sender === "me" && <DoubleTick status={lastMsg.status} />}
                                            <span className="ml-[0.5vh] truncate">{lastMsg?.text}</span>
                                        </div>
                                        {chat.unread > 0 && (
                                            <div className="h-[1.6vh] min-w-[1.6vh] rounded-full bg-[#00A884] text-white flex items-center justify-center text-[0.9vh] px-[0.4vh] shrink-0 font-bold">
                                                {chat.unread}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT AREA - Active Chat */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-[#0B141A] relative">
                    {/* Chat Background Pattern (Pixel WhatsApp style) */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url('/windows_xp.png')", backgroundSize: "cover", backgroundBlendMode: "overlay" }} />

                    {/* Header */}
                    <div className="h-[6vh] bg-[#202C33] flex items-center px-[2vh] border-b border-white/10 shrink-0 relative z-10">
                        <div className="flex items-center gap-[1.5vh]">
                            <div className="h-[3.5vh] w-[3.5vh] rounded-full bg-white/5 overflow-hidden flex items-center justify-center">
                                <Image src={activeChat.avatar} alt="" width={24} height={24} unoptimized className="w-[60%] h-auto [image-rendering:pixelated]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[1.4vh] text-white/90 font-bold">{activeChat.contactName}</span>
                                <span className="text-[1vh] text-white/50">{activeChat.phone} {activeChat.online && <span className="text-[#00A884] ml-[0.5vh]">online</span>}</span>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-[4vh] py-[2vh] relative z-10 custom-scrollbar">
                        <div className="flex flex-col gap-[1vh]">
                            {/* Date Badge */}
                            <div className="flex justify-center mb-[2vh]">
                                <div className="bg-[#182229] px-[1.2vh] py-[0.5vh] rounded-md text-[0.9vh] text-white/60 uppercase tracking-widest border border-white/5">
                                    TODAY
                                </div>
                            </div>

                            {activeChat.messages.map((msg) => {
                                const isMe = msg.sender === "me";
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                                        <div
                                            className={`max-w-[70%] px-[1.5vh] py-[1vh] rounded-[0.8vh] relative shadow-md
                                                ${isMe ? "bg-[#005C4B] rounded-tr-none text-white/90" : "bg-[#202C33] rounded-tl-none text-white/90"}
                                            `}
                                        >
                                            <div className="text-[1.3vh] leading-[1.8vh] break-words mb-[1.5vh]">
                                                {msg.text}
                                            </div>
                                            <div className="absolute bottom-[0.4vh] right-[0.8vh] flex items-center gap-[0.4vh]">
                                                <span className="text-[0.8vh] text-white/40">{msg.time}</span>
                                                {isMe && <DoubleTick status={msg.status} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {isWaitingForReply && (
                                <div className="flex justify-start w-full">
                                    <div className="max-w-[70%] px-[1.5vh] py-[1vh] rounded-[0.8vh] rounded-tl-none bg-[#202C33] text-white/50 text-[1.2vh] animate-pulse">
                                        typing...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="bg-[#202C33] p-[1.5vh] shrink-0 relative z-10 flex items-end gap-[1.5vh]">
                        <button className="h-[3.6vh] w-[3.6vh] shrink-0 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
                            <span className="text-[2vh]">＋</span>
                        </button>
                        <div className="flex-1 bg-[#2A3942] rounded-[1vh] overflow-hidden min-h-[3.6vh] max-h-[12vh] flex items-center px-[1.5vh] border border-white/5">
                            <textarea
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Type a message"
                                className="w-full bg-transparent border-none outline-none text-[1.3vh] text-white placeholder-white/40 resize-none py-[1vh] custom-scrollbar"
                                rows={1}
                                style={{ lineHeight: "1.6vh" }}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!draft.trim() || isWaitingForReply}
                            className={`h-[3.6vh] w-[3.6vh] rounded-full shrink-0 flex items-center justify-center transition-colors
                                ${draft.trim() && !isWaitingForReply ? "bg-[#00A884] text-white shadow-lg cursor-pointer" : "bg-white/5 text-white/20"}
                            `}
                        >
                            <span className="text-[1.4vh] ml-[0.2vh]">▶</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#222E35] border-l border-white/5 relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/windows_xp.png')", backgroundSize: "cover", backgroundBlendMode: "overlay" }} />
                    <Image src="/logos/message.svg" alt="" width={64} height={64} className="h-[10vh] w-auto opacity-20 [image-rendering:pixelated] mb-[4vh]" unoptimized />
                    <h2 className="text-[2.2vh] font-light text-white/50 tracking-widest uppercase mb-[1vh]">Messages Web</h2>
                    <p className="text-[1.2vh] text-white/30 text-center max-w-[40vh]">Send and receive messages without keeping your phone online.</p>
                </div>
            )}
        </div>
    );
}
