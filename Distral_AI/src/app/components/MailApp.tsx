"use client";

import { useState } from "react";
import type { SentEmailRecord } from "@/lib/game/gameState";
import {
  getMailCtaCopyText,
  getMailCtaFailureText,
  type EmailDefinition,
  type MailCtaAction,
} from "@/lib/game/mailDefinitions";

type MailView = "inbox" | "sent" | "compose" | "reading";

type MailAppProps = {
  embedded?: boolean;
  emails: EmailDefinition[];
  readEmailIds?: string[];
  sentEmails?: SentEmailRecord[];
  onManagerEmailOpened?: () => void;
  onMailRead?: (emailId: string) => void;
  onMailSent?: (sent: SentEmailRecord) => void;
  onMailCtaClick?: (emailId: string, action: MailCtaAction) => void;
  onMailCopyText?: (text: string) => void | Promise<void>;
};

export default function MailApp({ embedded, emails, readEmailIds = [], sentEmails = [], onManagerEmailOpened, onMailRead, onMailSent, onMailCtaClick, onMailCopyText }: MailAppProps) {
  const [view, setView] = useState<MailView>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailDefinition | SentEmailRecord | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const isRead = (email: EmailDefinition | SentEmailRecord, isSent: boolean) => {
    if (isSent) return true;
    if (readEmailIds.includes(email.id)) return true;
    if ("read" in email && email.read) return true;
    return false;
  };
  const unreadCount = emails.filter((e) => !isRead(e, false)).length;

  const openEmail = (email: EmailDefinition | SentEmailRecord) => {
    const isSent = "to" in email && email.from === "me";
    if (!isRead(email, isSent)) onMailRead?.(email.id);
    setSelectedEmail(email);
    setView("reading");
    if (email.id === "manager") onManagerEmailOpened?.();
  };

  const sendEmail = () => {
    if (!composeTo.trim() || !composeSubject.trim()) return;
    const newSent: SentEmailRecord = {
      id: `sent-${Date.now()}`,
      from: "me",
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      preview: composeBody.slice(0, 80),
      body: composeBody,
      date: "Just now",
    };
    onMailSent?.(newSent);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    new Audio("/sounds/music/game%20effect/message-sent.wav").play().catch(() => { });
    setView("sent");
  };

  const handleMailAction = (emailId: string, action: MailCtaAction) => {
    new Audio("/sounds/music/game effect/claim.wav").play().catch(() => { });
    try {
      onMailCtaClick?.(emailId, action);
    } finally {
      if (action === "phishing") {
        const reason =
          getMailCtaFailureText(emailId, action) ??
          "Nice try. That was a phishing test. You failed. Access revoked.";
        window.dispatchEvent(new CustomEvent("trigger-shutdown", { detail: { reason } }));
      }
    }
  };

  const handleCopy = async (emailId: string, action: MailCtaAction, copyText: string) => {
    if (onMailCopyText) {
      await onMailCopyText(copyText);
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
    } catch (error) {
      console.error("[MailApp] clipboard copy failed:", error);
    }
  };

  const sidebar = (
    <div className="flex w-[14vh] flex-none flex-col border-r border-white/10 bg-white/2 py-[1vh] px-[0.6vh] gap-[0.6vh]">
      <button
        type="button"
        onClick={() => setView("compose")}
        className="flex items-center justify-center gap-[0.5vh] rounded-[0.4vh] border border-white/15 bg-(--princeton-orange)/20 px-[1vh] py-[0.8vh] text-[1.2vh] uppercase tracking-[0.14em] text-(--princeton-orange) cursor-pointer hover:bg-(--princeton-orange)/30 transition-colors"
      >
        <svg viewBox="0 0 16 16" className="h-[1.2vh] w-[1.2vh]" fill="var(--princeton-orange)">
          <path d="M12.1 1.5l2.4 2.4L5.2 13.2l-3.1.7.7-3.1L12.1 1.5zM12.1 0L2 10.1l-1 4.5 4.5-1L15.6 3.5 12.1 0z" />
        </svg>
        <span>New</span>
      </button>

      <button
        type="button"
        onClick={() => { setView("inbox"); setSelectedEmail(null); }}
        className={`flex items-center justify-between rounded-[0.3vh] px-[0.8vh] py-[0.6vh] text-[1.05vh] uppercase tracking-[0.16em] cursor-pointer transition-colors ${view === "inbox" || view === "reading"
          ? "bg-white/8 text-white"
          : "text-white/50 hover:bg-white/4 hover:text-white/70"
          }`}
      >
        <span>Inbox</span>
        {unreadCount > 0 && (
          <span className="rounded-[0.2vh] bg-(--princeton-orange) px-[0.4vh] py-[0.1vh] text-[0.85vh] text-black font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => { setView("sent"); setSelectedEmail(null); }}
        className={`flex items-center rounded-[0.3vh] px-[0.8vh] py-[0.6vh] text-[1.05vh] uppercase tracking-[0.16em] cursor-pointer transition-colors ${view === "sent"
          ? "bg-white/8 text-white"
          : "text-white/50 hover:bg-white/4 hover:text-white/70"
          }`}
      >
        <span>Sent</span>
      </button>
    </div>
  );

  const emailRow = (email: EmailDefinition | SentEmailRecord, isSent: boolean = false) => {
    const read = isSent || isRead(email, isSent);
    return (
      <button
        key={email.id}
        type="button"
        onClick={() => openEmail(email)}
        className={`flex w-full items-start gap-[1vh] border-b border-white/6 px-[1.2vh] py-[0.9vh] text-left cursor-pointer transition-colors hover:bg-white/6 ${!read ? "bg-white/4" : ""
          }`}
      >
        <div className="w-[0.6vh] flex-none pt-[0.3vh]">
          {!read && (
            <span className="block h-[0.5vh] w-[0.5vh] rounded-full bg-(--princeton-orange)" />
          )}
        </div>

        <div
          className={`w-[10vh] flex-none truncate text-[2vh] ${!read ? "text-white font-bold" : "text-white/60"
            }`}
          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
        >
          {isSent ? `To: ${email.to}` : email.from}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[0.3vh]">
          <span
            className={`truncate text-[2vh] ${!read ? "text-white font-bold" : "text-white/70"
              }`}
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            {email.subject}
          </span>
          <span className="truncate text-[2.1vh] text-white/30" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
            {email.preview}
          </span>
        </div>

        <div className="flex-none text-[1.1vh] text-white/40 pt-[0.3vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
          {email.date}
        </div>
      </button>
    );
  };

  const mainContent = () => {
    if (view === "reading" && selectedEmail) {
      const hasCta = "ctaButton" in selectedEmail && selectedEmail.ctaButton;
      const ctaAction = hasCta && selectedEmail.ctaButton ? selectedEmail.ctaButton.action : null;
      const copyText = ctaAction ? getMailCtaCopyText(ctaAction) : null;
      return (
        <div className="flex flex-1 flex-col min-h-0">
          <div className="flex items-center gap-[1vh] border-b border-white/6 px-[1.2vh] py-[0.7vh]">
            <button
              type="button"
              onClick={() => { setView("inbox"); setSelectedEmail(null); }}
              className="text-[1.05vh] uppercase tracking-[0.16em] text-white/50 hover:text-white cursor-pointer"
              style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
              &lt; Back
            </button>
          </div>

          <div className="border-b border-white/6 px-[1.6vh] py-[1.2vh]">
            <div className="text-[3.2vh] text-white mb-[0.6vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
              {selectedEmail.subject}
            </div>
            <div className="flex flex-col gap-[0.3vh]">
              <div className="text-[2vh] text-white/50" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                From: {selectedEmail.from}
              </div>
              <div className="text-[2vh] text-white/50" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                To: {selectedEmail.to}
              </div>
              <div className="text-[2vh] text-white/40" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                {selectedEmail.date}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-[1.6vh] py-[1.2vh]">
            <pre
              className="whitespace-pre-wrap text-[2vh] text-white/75 leading-[2.8vh]"
              style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
              {selectedEmail.body}
            </pre>
            {hasCta && selectedEmail.ctaButton && (
              <div className="mt-[1.5vh] flex flex-col gap-[1vh]">
                <button
                  type="button"
                  onClick={() => handleMailAction(selectedEmail.id, selectedEmail.ctaButton!.action)}
                  className="rounded-[0.3vh] border-2 border-(--princeton-orange) bg-(--princeton-orange)/20 px-[2.5vh] py-[1vh] text-[1.2vh] uppercase tracking-[0.16em] text-(--princeton-orange) cursor-pointer hover:bg-(--princeton-orange)/30 transition-colors"
                  style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                  {selectedEmail.ctaButton!.label}
                </button>
                {copyText && (
                  <div className="flex items-center gap-[1vh]">
                    <div
                      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.95vh] text-white/45"
                      style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                    >
                      {copyText}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedEmail.id, selectedEmail.ctaButton!.action, copyText)}
                      className="rounded-[0.25vh] border border-white/15 bg-white/6 px-[0.9vh] py-[0.45vh] text-[0.85vh] uppercase tracking-[0.14em] text-white/65 cursor-pointer hover:bg-white/10"
                      style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (view === "compose") {
      return (
        <div className="flex flex-1 flex-col min-h-0 px-[1.6vh] py-[1.2vh] pb-[1.8vh] gap-[0.8vh]">
          <div className="text-[1.15vh] uppercase tracking-[0.18em] text-white/50 mb-[0.4vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
            New Message
          </div>

          <div className="flex items-center gap-[0.6vh] border-b border-white/6 pb-[0.6vh]">
            <span className="text-[1vh] text-white/40 w-[5vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>To:</span>
            <input
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              className="flex-1 bg-transparent text-[1.15vh] text-white outline-none border-0"
              style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            />
          </div>

          <div className="flex items-center gap-[0.6vh] border-b border-white/6 pb-[0.6vh]">
            <span className="text-[1vh] text-white/40 w-[5vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>Subj:</span>
            <input
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="flex-1 bg-transparent text-[1.15vh] text-white outline-none border-0"
              style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            />
          </div>

          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            className="flex-1 min-h-0 bg-transparent text-[1.15vh] text-white/80 leading-[1.4vh] outline-none resize-none border-0"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          />

          <div className="flex justify-end pt-[0.6vh] pb-[0.4vh]">
            <button
              type="button"
              onClick={sendEmail}
              className="rounded-[0.3vh] border border-(--princeton-orange)/40 bg-(--princeton-orange)/20 px-[2vh] py-[0.6vh] text-[1.1vh] uppercase tracking-[0.16em] text-(--princeton-orange) cursor-pointer hover:bg-(--princeton-orange)/30 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      );
    }

    const list = view === "sent" ? sentEmails : emails;
    const isSent = view === "sent";

    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-auto">
        <div className="flex items-center border-b border-white/6 px-[1.2vh] py-[0.6vh]">
          <span className="text-[0.95vh] uppercase tracking-[0.18em] text-white/40" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
            {isSent ? "Sent Mail" : "Inbox"}
            {!isSent && unreadCount > 0 && ` (${unreadCount} unread)`}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[1.15vh] text-white/25" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
            {isSent ? "No sent messages" : "Inbox empty"}
          </div>
        ) : (
          list.map((email) => emailRow(email, isSent))
        )}
      </div>
    );
  };

  return (
    <div className={`flex h-full w-full min-h-0 ${embedded ? "" : ""}`}>
      {sidebar}
      <div className="flex flex-1 flex-col min-h-0">
        {mainContent()}
      </div>
    </div>
  );
}
