import { useState, useEffect, useRef } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { db, ref, set, push, remove } from "../firebase";
import { EmptyState, Icon, Notice, PageHeader, StatusPill, formatWhen, useToast } from "./ui";

const TYPING_IDLE_MS = 2500;

const TYPE_LABELS = {
    prayer: "Prayer Request",
    pastoral: "Pastoral Care / Counseling",
    general: "General Question",
    other: "Something Else",
};

const FILTERS = [
    { key: "all", label: "All" },
    { key: "new", label: "Awaiting reply" },
    { key: "responded", label: "Responded" },
    { key: "closed", label: "Closed" },
];

async function sendAdminReply(chatId, text) {
    const msgRef = push(ref(db, `supportChats/${chatId}/messages`));
    await set(msgRef, { sender: "admin", text, at: Date.now() });
    await set(ref(db, `supportChats/${chatId}/updatedAt`), Date.now());
    await set(ref(db, `supportChats/${chatId}/status`), "responded");
}

async function setAdminTyping(chatId, typing) {
    await set(ref(db, `supportChats/${chatId}/adminTyping`), typing);
}

async function setChatStatus(chatId, status) {
    await set(ref(db, `supportChats/${chatId}/status`), status);
}

async function deleteChat(chatId) {
    await remove(ref(db, `supportChats/${chatId}`));
}

function ChatCard({ chat }) {
    const { run } = useToast();
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const messages = chat.messages ? Object.entries(chat.messages).sort((a, b) => a[1].at - b[1].at) : [];
    const lastMessage = messages[messages.length - 1]?.[1];
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    const stopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        if (isTypingRef.current) {
            isTypingRef.current = false;
            setAdminTyping(chat.id, false);
        }
    };

    // Clear the typing flag if the admin navigates away or collapses the card mid-reply.
    useEffect(() => () => stopTyping(), []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleReplyChange = e => {
        setReplyText(e.target.value);
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            setAdminTyping(chat.id, true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    };

    const handleReply = async () => {
        if (!replyText.trim() || sending) return;
        stopTyping();
        setSending(true);
        if (await run(() => sendAdminReply(chat.id, replyText.trim()), "Reply sent")) setReplyText("");
        setSending(false);
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this support request and its whole conversation? This cannot be undone.")) return;
        await run(() => deleteChat(chat.id), "Conversation deleted");
    };

    const toggle = () => {
        if (expanded) stopTyping();
        setExpanded(!expanded);
    };

    return (
        <div className="adm-card adm-record">
            <div className="adm-record-head">
                <div>
                    <div className="adm-record-title">{chat.name || "Anonymous"} · {TYPE_LABELS[chat.type] || "Support Request"}</div>
                    <div className="adm-record-meta">
                        {chat.phone ? <a href={`tel:${chat.phone}`}>{chat.phone}</a> : "No phone"}
                        {" · "}started {formatWhen(chat.createdAt)} · {messages.length} message{messages.length === 1 ? "" : "s"}
                    </div>
                </div>
                <StatusPill status={chat.status} />
            </div>

            {!expanded && lastMessage && (
                <div className="adm-field-value" style={{ marginTop: "0.75rem", color: "var(--gray-600)" }}>
                    <strong style={{ color: "var(--navy)" }}>{lastMessage.sender === "admin" ? "You" : chat.name || "Them"}:</strong>{" "}
                    {lastMessage.text?.length > 160 ? `${lastMessage.text.slice(0, 160)}…` : lastMessage.text}
                </div>
            )}

            {expanded && (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: 340, overflowY: "auto", margin: "0.9rem 0", padding: "0.9rem", background: "var(--adm-bg)", borderRadius: 12 }}>
                        {messages.map(([id, m]) => {
                            const mine = m.sender === "admin";
                            return (
                                <div
                                    key={id}
                                    style={{
                                        maxWidth: "80%",
                                        alignSelf: mine ? "flex-end" : "flex-start",
                                        background: mine ? "var(--navy)" : "white",
                                        color: mine ? "white" : "var(--gray-800)",
                                        border: mine ? "none" : "1px solid var(--adm-line)",
                                        padding: "0.55rem 0.8rem",
                                        borderRadius: 12,
                                        fontSize: "0.86rem",
                                        lineHeight: 1.45,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {m.text}
                                    <div style={{ fontSize: "0.66rem", opacity: 0.65, marginTop: 3 }}>
                                        {mine ? "You" : chat.name || "Requester"} · {formatWhen(m.at)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                        <textarea
                            className="form-textarea"
                            style={{ minHeight: 48, flex: 1 }}
                            placeholder="Type a reply… (Ctrl+Enter to send)"
                            aria-label="Reply"
                            value={replyText}
                            onChange={handleReplyChange}
                            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply(); }}
                        />
                        <button className="adm-btn gold" disabled={sending || !replyText.trim()} onClick={handleReply}>
                            <Icon name="send" size={15} /> {sending ? "Sending…" : "Send"}
                        </button>
                    </div>
                </>
            )}

            <div className="adm-record-foot">
                <button className="adm-btn sm" onClick={toggle}>
                    <Icon name="chat" size={14} /> {expanded ? "Hide conversation" : "Open conversation"}
                </button>
                <div className="adm-actions">
                    {chat.status !== "closed" ? (
                        <button className="adm-btn sm ghost" onClick={() => run(() => setChatStatus(chat.id, "closed"), "Marked closed")}>
                            <Icon name="check" size={14} /> Mark closed
                        </button>
                    ) : (
                        <button className="adm-btn sm ghost" onClick={() => run(() => setChatStatus(chat.id, "responded"), "Reopened")}>Reopen</button>
                    )}
                    <button className="adm-btn sm ghost danger" onClick={handleDelete}><Icon name="trash" size={14} /> Delete</button>
                </div>
            </div>
        </div>
    );
}

export default function SupportChatsManager() {
    const { data, loading, error } = useFirebaseCollection("supportChats");
    const [filter, setFilter] = useState("all");
    const sorted = (data || []).slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    const filtered = filter === "all" ? sorted : sorted.filter(c => c.status === filter);
    const countFor = key => (key === "all" ? sorted.length : sorted.filter(c => c.status === key).length);

    return (
        <div>
            <PageHeader
                eyebrow="Inbox"
                title="Support Chats"
                count={sorted.length}
                subtitle="Live conversations started from the help button on the website. Your replies reach the visitor instantly."
            />

            <div className="adm-toolbar">
                <div className="adm-filters" role="group" aria-label="Filter by status">
                    {FILTERS.map(f => (
                        <button key={f.key} className={`adm-filter${filter === f.key ? " active" : ""}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                            {f.label}<span>{countFor(f.key)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && error && <Notice tone="error">Couldn't load support chats. Try refreshing the page.</Notice>}
            {!loading && !error && filtered.length === 0 && (
                <EmptyState icon="chat" title="No conversations here">New chats from the website appear automatically.</EmptyState>
            )}

            <div className="adm-list">
                {filtered.map(chat => <ChatCard key={chat.id} chat={chat} />)}
            </div>
        </div>
    );
}
