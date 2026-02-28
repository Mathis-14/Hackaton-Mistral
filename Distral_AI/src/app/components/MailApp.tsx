"use client";

import { useState } from "react";

/* ── Types ─────────────────────────────────────────── */

type Email = {
    id: string;
    from: string;
    to: string;
    subject: string;
    preview: string;
    body: string;
    date: string;
    read: boolean;
};

type MailView = "inbox" | "sent" | "compose" | "reading";

/* ── Sample Data ───────────────────────────────────── */

const INITIAL_EMAILS: Email[] = [
    {
        id: "1",
        from: "Maya Borel",
        to: "me",
        subject: "Q4 Performance Review",
        preview: "Hi, please find attached the Q4 performance metrics for your team...",
        body: "Hi,\n\nPlease find attached the Q4 performance metrics for your team. We need to discuss the throughput numbers before the board meeting on Friday.\n\nThe latency improvements look promising, but I have concerns about the error rate spike in week 47.\n\nLet me know when you're available for a sync.\n\nBest,\nMaya Borel\nInternal Operations Lead",
        date: "10:42 AM",
        read: false,
    },
    {
        id: "2",
        from: "IT Security",
        to: "all-staff",
        subject: "Mandatory Password Reset",
        preview: "All employees must complete the password rotation by end of week...",
        body: "Dear Staff,\n\nAs part of our quarterly security audit, all employees must complete the mandatory password rotation by end of this week.\n\nPlease use the internal portal at security.distral.internal to update your credentials.\n\nFailure to comply will result in temporary account lockout.\n\n-- IT Security Team",
        date: "9:15 AM",
        read: false,
    },
    {
        id: "3",
        from: "Lena Chen",
        to: "me",
        subject: "Re: API Documentation",
        preview: "Thanks for the updated docs. I noticed a few endpoints are missing...",
        body: "Thanks for the updated docs. I noticed a few endpoints are missing from the v3 section:\n\n- /api/v3/models/list\n- /api/v3/completions/stream\n\nCould you add those before we publish? The engineering team needs them for the SDK update.\n\nThanks,\nLena",
        date: "Yesterday",
        read: true,
    },
    {
        id: "4",
        from: "System Alerts",
        to: "ops-team",
        subject: "CPU Threshold Warning - Node 7",
        preview: "Alert: Node 7 CPU utilization exceeded 92% at 03:42 UTC...",
        body: "ALERT: CPU THRESHOLD WARNING\n\nNode: prod-inference-07\nMetric: CPU utilization\nValue: 92.4%\nThreshold: 90%\nTimestamp: 03:42 UTC\n\nAutoscaling triggered. Additional capacity provisioned.\n\nNo action required unless alert persists for > 30 minutes.\n\n-- Monitoring System",
        date: "Yesterday",
        read: true,
    },
    {
        id: "5",
        from: "HR Department",
        to: "all-staff",
        subject: "Office Closure - March 3rd",
        preview: "Please be advised that the main office will be closed on March 3rd...",
        body: "Dear Team,\n\nPlease be advised that the main office will be closed on March 3rd for scheduled maintenance of the HVAC system.\n\nRemote work is expected for all employees on that day. Please ensure you have VPN access configured.\n\nThank you for your understanding.\n\n-- HR Department",
        date: "Feb 26",
        read: true,
    },
];

/* ── Component ─────────────────────────────────────── */

export default function MailApp({ embedded }: { embedded?: boolean }) {
    const [view, setView] = useState<MailView>("inbox");
    const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
    const [sentEmails, setSentEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [composeTo, setComposeTo] = useState("");
    const [composeSubject, setComposeSubject] = useState("");
    const [composeBody, setComposeBody] = useState("");

    const unreadCount = emails.filter((e) => !e.read).length;

    const openEmail = (email: Email) => {
        setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
        );
        setSelectedEmail({ ...email, read: true });
        setView("reading");
    };

    const sendEmail = () => {
        if (!composeTo.trim() || !composeSubject.trim()) return;
        const newEmail: Email = {
            id: `sent-${Date.now()}`,
            from: "me",
            to: composeTo.trim(),
            subject: composeSubject.trim(),
            preview: composeBody.slice(0, 80),
            body: composeBody,
            date: "Just now",
            read: true,
        };
        setSentEmails((prev) => [newEmail, ...prev]);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        new Audio("/sounds/music/game%20effect/message-sent.wav").play().catch(() => { });
        setView("sent");
    };

    /* ── Sidebar ── */
    const sidebar = (
        <div className="flex w-[14vh] flex-none flex-col border-r border-white/10 bg-white/[0.02] py-[1vh] px-[0.6vh] gap-[0.6vh]">
            {/* Compose button */}
            <button
                type="button"
                onClick={() => setView("compose")}
                className="flex items-center justify-center gap-[0.5vh] rounded-[0.4vh] border border-white/15 bg-[var(--princeton-orange)]/20 px-[1vh] py-[0.8vh] text-[1.2vh] uppercase tracking-[0.14em] text-[var(--princeton-orange)] cursor-pointer hover:bg-[var(--princeton-orange)]/30 transition-colors"
            >
                <svg viewBox="0 0 16 16" className="h-[1.2vh] w-[1.2vh]" fill="var(--princeton-orange)">
                    <path d="M12.1 1.5l2.4 2.4L5.2 13.2l-3.1.7.7-3.1L12.1 1.5zM12.1 0L2 10.1l-1 4.5 4.5-1L15.6 3.5 12.1 0z" />
                </svg>
                <span>New</span>
            </button>

            {/* Inbox */}
            <button
                type="button"
                onClick={() => { setView("inbox"); setSelectedEmail(null); }}
                className={`flex items-center justify-between rounded-[0.3vh] px-[0.8vh] py-[0.6vh] text-[1.05vh] uppercase tracking-[0.16em] cursor-pointer transition-colors ${view === "inbox" || view === "reading"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
            >
                <span>Inbox</span>
                {unreadCount > 0 && (
                    <span className="rounded-[0.2vh] bg-[var(--princeton-orange)] px-[0.4vh] py-[0.1vh] text-[0.85vh] text-black font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Sent */}
            <button
                type="button"
                onClick={() => { setView("sent"); setSelectedEmail(null); }}
                className={`flex items-center rounded-[0.3vh] px-[0.8vh] py-[0.6vh] text-[1.05vh] uppercase tracking-[0.16em] cursor-pointer transition-colors ${view === "sent"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                    }`}
            >
                <span>Sent</span>
            </button>
        </div>
    );

    /* ── Email List Row ── */
    const emailRow = (email: Email, isSent: boolean = false) => (
        <button
            key={email.id}
            type="button"
            onClick={() => openEmail(email)}
            className={`flex w-full items-center gap-[1vh] border-b border-white/[0.06] px-[1.2vh] py-[0.9vh] text-left cursor-pointer transition-colors hover:bg-white/[0.06] ${!email.read && !isSent ? "bg-white/[0.04]" : ""
                }`}
        >
            {/* Unread dot */}
            <div className="w-[0.6vh] flex-none">
                {!email.read && !isSent && (
                    <span className="block h-[0.5vh] w-[0.5vh] rounded-full bg-[var(--princeton-orange)]" />
                )}
            </div>

            {/* Sender */}
            <div
                className={`w-[10vh] flex-none truncate text-[1.15vh] ${!email.read && !isSent ? "text-white font-bold" : "text-white/60"
                    }`}
                style={{ fontFamily: "'VCR OSD Mono', monospace" }}
            >
                {isSent ? `To: ${email.to}` : email.from}
            </div>

            {/* Subject + preview */}
            <div className="flex min-w-0 flex-1 items-baseline gap-[0.6vh]">
                <span
                    className={`truncate text-[1.15vh] ${!email.read && !isSent ? "text-white font-bold" : "text-white/70"
                        }`}
                    style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                >
                    {email.subject}
                </span>
                <span className="hidden sm:inline truncate text-[1.05vh] text-white/30" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                    - {email.preview}
                </span>
            </div>

            {/* Date */}
            <div className="flex-none text-[0.95vh] text-white/40" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                {email.date}
            </div>
        </button>
    );

    /* ── Main Content ── */
    const mainContent = () => {
        // Reading view
        if (view === "reading" && selectedEmail) {
            return (
                <div className="flex flex-1 flex-col min-h-0">
                    {/* Back bar */}
                    <div className="flex items-center gap-[1vh] border-b border-white/[0.06] px-[1.2vh] py-[0.7vh]">
                        <button
                            type="button"
                            onClick={() => { setView("inbox"); setSelectedEmail(null); }}
                            className="text-[1.05vh] uppercase tracking-[0.16em] text-white/50 hover:text-white cursor-pointer"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        >
                            &lt; Back
                        </button>
                    </div>

                    {/* Email header */}
                    <div className="border-b border-white/[0.06] px-[1.6vh] py-[1.2vh]">
                        <div className="text-[1.6vh] text-white mb-[0.6vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                            {selectedEmail.subject}
                        </div>
                        <div className="flex flex-col gap-[0.3vh]">
                            <div className="text-[1vh] text-white/50" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                                From: {selectedEmail.from}
                            </div>
                            <div className="text-[1vh] text-white/50" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                                To: {selectedEmail.to}
                            </div>
                            <div className="text-[1vh] text-white/40" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                                {selectedEmail.date}
                            </div>
                        </div>
                    </div>

                    {/* Email body */}
                    <div className="flex-1 overflow-auto px-[1.6vh] py-[1.2vh]">
                        <pre
                            className="whitespace-pre-wrap text-[1.15vh] text-white/75 leading-[1.4vh]"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        >
                            {selectedEmail.body}
                        </pre>
                    </div>
                </div>
            );
        }

        // Compose view
        if (view === "compose") {
            return (
                <div className="flex flex-1 flex-col min-h-0 px-[1.6vh] py-[1.2vh] pb-[1.8vh] gap-[0.8vh]">
                    <div className="text-[1.15vh] uppercase tracking-[0.18em] text-white/50 mb-[0.4vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>
                        New Message
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-[0.6vh] border-b border-white/[0.06] pb-[0.6vh]">
                        <span className="text-[1vh] text-white/40 w-[5vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>To:</span>
                        <input
                            value={composeTo}
                            onChange={(e) => setComposeTo(e.target.value)}
                            className="flex-1 bg-transparent text-[1.15vh] text-white outline-none border-0"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        />
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-[0.6vh] border-b border-white/[0.06] pb-[0.6vh]">
                        <span className="text-[1vh] text-white/40 w-[5vh]" style={{ fontFamily: "'VCR OSD Mono', monospace" }}>Subj:</span>
                        <input
                            value={composeSubject}
                            onChange={(e) => setComposeSubject(e.target.value)}
                            className="flex-1 bg-transparent text-[1.15vh] text-white outline-none border-0"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        />
                    </div>

                    {/* Body */}
                    <textarea
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        className="flex-1 min-h-0 bg-transparent text-[1.15vh] text-white/80 leading-[1.4vh] outline-none resize-none border-0"
                        style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                    />

                    {/* Send button */}
                    <div className="flex justify-end pt-[0.6vh] pb-[0.4vh]">
                        <button
                            type="button"
                            onClick={sendEmail}
                            className="rounded-[0.3vh] border border-[var(--princeton-orange)]/40 bg-[var(--princeton-orange)]/20 px-[2vh] py-[0.6vh] text-[1.1vh] uppercase tracking-[0.16em] text-[var(--princeton-orange)] cursor-pointer hover:bg-[var(--princeton-orange)]/30 transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>
            );
        }

        // Inbox or Sent list
        const list = view === "sent" ? sentEmails : emails;
        const isSent = view === "sent";

        return (
            <div className="flex flex-1 flex-col min-h-0 overflow-auto">
                {/* List header */}
                <div className="flex items-center border-b border-white/[0.06] px-[1.2vh] py-[0.6vh]">
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
