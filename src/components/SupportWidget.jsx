import { useState, useEffect, useRef } from "react";
import { validatePhone } from "../validation";
import { createSupportRequest, addSupportMessage } from "../supportDb";
import { useFirebaseDoc } from "../hooks/useFirebaseDoc";

const STORAGE_KEY = "supportChatIds";
const SUPPORT_WHATSAPP = "0702426830";

const SERVICE_TYPES = [
    { value: "prayer", label: "Prayer Request" },
    { value: "pastoral", label: "Pastoral Care / Counseling" },
    { value: "general", label: "General Question" },
    { value: "other", label: "Something Else" },
];

function whatsappLink(phone, message) {
    const digits = String(phone || "").replace(/\D/g, "");
    const normalized = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function getStoredChatIds() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function addStoredChatId(id) {
    const ids = getStoredChatIds();
    if (!ids.includes(id)) localStorage.setItem(STORAGE_KEY, JSON.stringify([id, ...ids]));
}

function NewRequestForm({ onCreated }) {
    const [type, setType] = useState("prayer");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !message.trim()) {
            setError("Please fill in your name and message.");
            return;
        }
        if (!validatePhone(phone)) {
            setError("Enter a valid phone number: 10 digits starting with 01 or 07 (e.g. 0712345678).");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const id = await createSupportRequest({ type, name: name.trim(), phone, message: message.trim() });
            addStoredChatId(id);
            onCreated(id);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="form-group">
                <label className="form-label">What do you need?</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                    {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                    className="form-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="07XXXXXXXX or 01XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                    className="form-textarea"
                    style={{ minHeight: 70 }}
                    placeholder="Tell us how we can help..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
            </div>
            {error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{error}</p>}
            <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Sending..." : "Send Request"}
            </button>
            <p style={{ fontSize: "0.72rem", textAlign: "center", color: "var(--gray-400)", marginTop: 8 }}>
                Your request is kept confidential. Our team will respond right here.
            </p>
        </>
    );
}

function ChatThread({ chatId, onBack }) {
    const { data: chat, loading } = useFirebaseDoc(`supportChats/${chatId}`);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const threadRef = useRef(null);

    const messages = chat?.messages ? Object.entries(chat.messages).sort((a, b) => a[1].at - b[1].at) : [];

    useEffect(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [messages.length]);

    const handleReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            await addSupportMessage(chatId, "user", reply.trim());
            setReply("");
        } finally {
            setSending(false);
        }
    };

    if (loading) return <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>Loading…</p>;
    if (!chat) return <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>This request could not be found.</p>;

    const typeLabel = SERVICE_TYPES.find(t => t.value === chat.type)?.label || "Support Request";

    return (
        <>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "0.78rem", marginBottom: 10, padding: 0 }}>
                ← Back to your requests
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--navy)" }}>{typeLabel}</div>
                <span className={`chat-status-pill ${chat.status}`}>{chat.status}</span>
            </div>
            <div className="chat-thread" ref={threadRef}>
                {messages.map(([id, m]) => (
                    <div key={id} className={`chat-bubble ${m.sender}`}>
                        {m.text}
                        <div className="chat-bubble-meta">{new Date(m.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                ))}
            </div>
            <div className="chat-reply-row">
                <textarea
                    className="form-textarea"
                    placeholder="Type a message..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                />
                <button className="btn btn-gold btn-sm" disabled={sending || !reply.trim()} onClick={handleReply}>
                    {sending ? "..." : "Send"}
                </button>
            </div>
        </>
    );
}

function MyRequestsList({ chatIds, onOpen }) {
    if (chatIds.length === 0) {
        return <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>You haven't sent any requests from this device yet. Use "New Request" to get started.</p>;
    }
    return (
        <div>
            {chatIds.map(id => <RequestPreview key={id} chatId={id} onOpen={() => onOpen(id)} />)}
        </div>
    );
}

function RequestPreview({ chatId, onOpen }) {
    const { data: chat } = useFirebaseDoc(`supportChats/${chatId}`);
    if (!chat) return null;
    const typeLabel = SERVICE_TYPES.find(t => t.value === chat.type)?.label || "Support Request";
    return (
        <button className="chat-request-item" onClick={onOpen}>
            <span>
                <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--navy)" }}>{typeLabel}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>{new Date(chat.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
            </span>
            <span className={`chat-status-pill ${chat.status}`}>{chat.status}</span>
        </button>
    );
}

export default function SupportWidget() {
    const [open, setOpen] = useState(false);
    const [chatIds, setChatIds] = useState(() => getStoredChatIds());
    const [tab, setTab] = useState(() => (chatIds.length > 0 ? "mine" : "new"));
    const [activeChatId, setActiveChatId] = useState(null);

    const handleCreated = id => {
        setChatIds(getStoredChatIds());
        setActiveChatId(id);
        setTab("mine");
    };

    return (
        <div className="support-widget">
            <div className={`support-panel${open ? " open" : ""}`}>
                <div className="support-header">
                    <div className="support-title">Help Center</div>
                    <div className="support-subtitle">We're here for you, always.</div>
                </div>
                <div className="support-tab-nav">
                    <button className={`support-tab-btn${tab === "new" ? " active" : ""}`} onClick={() => { setTab("new"); setActiveChatId(null); }}>New Request</button>
                    <button className={`support-tab-btn${tab === "mine" ? " active" : ""}`} onClick={() => setTab("mine")}>My Requests</button>
                    <button className={`support-tab-btn${tab === "whatsapp" ? " active" : ""}`} onClick={() => setTab("whatsapp")}>WhatsApp</button>
                </div>
                <div className="support-body">
                    {tab === "new" && <NewRequestForm onCreated={handleCreated} />}
                    {tab === "mine" && (
                        activeChatId
                            ? <ChatThread chatId={activeChatId} onBack={() => setActiveChatId(null)} />
                            : <MyRequestsList chatIds={chatIds} onOpen={setActiveChatId} />
                    )}
                    {tab === "whatsapp" && (
                        <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                            <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: 14 }}>
                                Prefer to talk it through? Chat with our support team directly on WhatsApp.
                            </p>
                            <a
                                className="btn btn-gold"
                                style={{ width: "100%", justifyContent: "center" }}
                                href={whatsappLink(SUPPORT_WHATSAPP, "Hi, I'd like to talk to someone from ACK St Pauls Youths.")}
                                target="_blank"
                                rel="noreferrer"
                            >
                                💬 Chat on WhatsApp
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <button className="support-toggle" onClick={() => setOpen(!open)} aria-label="Help">❓</button>
        </div>
    );
}
