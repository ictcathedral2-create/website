import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { db, ref, set, push, remove } from "../firebase";

const TYPE_LABELS = {
    prayer: "Prayer Request",
    pastoral: "Pastoral Care / Counseling",
    general: "General Question",
    other: "Something Else",
};

const STATUS_COLORS = {
    new: { bg: "rgba(224,115,48,0.12)", color: "var(--orange)" },
    responded: { bg: "rgba(78,150,110,0.15)", color: "#4E966E" },
    closed: { bg: "var(--gray-100)", color: "var(--gray-400)" },
};

async function sendAdminReply(chatId, text) {
    const msgRef = push(ref(db, `supportChats/${chatId}/messages`));
    await set(msgRef, { sender: "admin", text, at: Date.now() });
    await set(ref(db, `supportChats/${chatId}/updatedAt`), Date.now());
    await set(ref(db, `supportChats/${chatId}/status`), "responded");
}

async function setChatStatus(chatId, status) {
    await set(ref(db, `supportChats/${chatId}/status`), status);
}

async function deleteChat(chatId) {
    await remove(ref(db, `supportChats/${chatId}`));
}

function ChatCard({ chat }) {
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const messages = chat.messages ? Object.entries(chat.messages).sort((a, b) => a[1].at - b[1].at) : [];
    const colors = STATUS_COLORS[chat.status] || STATUS_COLORS.new;

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await sendAdminReply(chat.id, replyText.trim());
            setReplyText("");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this support request and its whole conversation? This cannot be undone.")) return;
        await deleteChat(chat.id);
    };

    return (
        <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                    <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>{TYPE_LABELS[chat.type] || "Support Request"}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--gray-600)", marginTop: 2 }}>{chat.name || "—"} · {chat.phone || "—"}</div>
                </div>
                <span style={{ background: colors.bg, color: colors.color, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    {chat.status}
                </span>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--gray-400)", marginBottom: "0.85rem" }}>
                Started {new Date(chat.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                {" · "}{messages.length} message{messages.length === 1 ? "" : "s"}
            </div>

            {!expanded ? (
                <button className="btn btn-navy btn-sm" onClick={() => setExpanded(true)}>View Conversation</button>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: 280, overflowY: "auto", marginBottom: "0.85rem", padding: "0.85rem", background: "var(--cream)", borderRadius: 10 }}>
                        {messages.map(([id, m]) => (
                            <div
                                key={id}
                                style={{
                                    maxWidth: "80%",
                                    alignSelf: m.sender === "admin" ? "flex-end" : "flex-start",
                                    background: m.sender === "admin" ? "linear-gradient(135deg, var(--gold), var(--gold-dark))" : "white",
                                    color: m.sender === "admin" ? "white" : "var(--gray-800)",
                                    padding: "0.55rem 0.8rem",
                                    borderRadius: 12,
                                    fontSize: "0.85rem",
                                    lineHeight: 1.45,
                                }}
                            >
                                {m.text}
                                <div style={{ fontSize: "0.65rem", opacity: 0.7, marginTop: 3 }}>
                                    {m.sender === "admin" ? "You" : chat.name || "Requester"} · {new Date(m.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
                        <textarea
                            className="form-textarea"
                            style={{ minHeight: 42, flex: 1 }}
                            placeholder="Type a reply..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                        />
                        <button className="btn btn-gold btn-sm" disabled={sending || !replyText.trim()} onClick={handleReply}>
                            {sending ? "..." : "Reply"}
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                        <button className="btn btn-navy btn-sm" onClick={() => setExpanded(false)}>Collapse</button>
                        {chat.status !== "closed" && (
                            <button className="btn btn-navy btn-sm" onClick={() => setChatStatus(chat.id, "closed")}>Mark Closed</button>
                        )}
                        {chat.status === "closed" && (
                            <button className="btn btn-navy btn-sm" onClick={() => setChatStatus(chat.id, "responded")}>Reopen</button>
                        )}
                        <button className="btn btn-sm" style={{ background: "rgba(224,115,48,0.12)", color: "var(--orange)" }} onClick={handleDelete}>Delete</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function SupportChatsManager() {
    const { data, loading, error } = useFirebaseCollection("supportChats");
    const [filter, setFilter] = useState("all");
    const sorted = (data || []).slice().sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    const filtered = filter === "all" ? sorted : sorted.filter(c => c.status === filter);

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.15rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>
                    Support Center <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({filtered.length})</span>
                </h2>
                <div className="tab-nav" style={{ marginBottom: 0 }}>
                    {["all", "new", "responded", "closed"].map(f => (
                        <button key={f} className={`tab-btn${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
                    ))}
                </div>
            </div>

            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load support requests. Check Firebase read permissions.</p>}
            {!loading && !error && filtered.length === 0 && <p style={{ color: "var(--gray-400)" }}>No support requests here yet.</p>}

            <div style={{ display: "grid", gap: "1rem" }}>
                {filtered.map(chat => <ChatCard key={chat.id} chat={chat} />)}
            </div>
        </div>
    );
}
