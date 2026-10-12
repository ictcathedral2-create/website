/* eslint-disable react-refresh/only-export-components -- small shared UI kit: components plus their helpers */
import { createContext, useCallback, useContext, useRef, useState } from "react";

// Stroke icons (24px grid). Kept inline so the admin bundle needs no icon library.
const ICON_PATHS = {
    home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    calendar: "M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
    image: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-.01",
    book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7",
    camera: "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    chat: "M4 5h16v11H8l-4 4z",
    mail: "M4 6h16v12H4zM4 7l8 6 8-6",
    heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
    users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.1a3.5 3.5 0 0 1 0 6.8",
    userPlus: "M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6M16 11h6",
    ticket: "M3 8V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2 2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a2 2 0 0 0 0-4zM14 5v14",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
    store: "M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5",
    briefcase: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
    megaphone: "M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 8.5a4.5 4.5 0 0 1 0 7",
    gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7S10.5 3 8 3.5 7 7 12 7zM12 7s1.5-4 4-3.5S17 7 12 7z",
    phone: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    send: "M21 3 10 14M21 3l-7 18-4-7-7-4z",
    plus: "M12 5v14M5 12h14",
    download: "M12 4v11M7 10l5 5 5-5M5 20h14",
    edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6 6 18",
    external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10",
    alert: "M12 4 2.5 20h19zM12 10v4M12 17h.01",
    check: "M5 12.5 10 17 19 7",
    upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
    inbox: "M3 13h5l2 3h4l2-3h5M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
};

export function Icon({ name, size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICON_PATHS[name] || ICON_PATHS.inbox} />
        </svg>
    );
}

export function PageHeader({ eyebrow, title, count, subtitle, children }) {
    return (
        <div className="adm-header">
            <div>
                {eyebrow && <div className="adm-eyebrow">{eyebrow}</div>}
                <h1 className="adm-title">{title}{count !== undefined && <small>{count}</small>}</h1>
                {subtitle && <div className="adm-subtitle">{subtitle}</div>}
            </div>
            {children && <div className="adm-actions">{children}</div>}
        </div>
    );
}

// Colour family for a workflow status, so "new" always reads as needing action.
const STATUS_TONES = {
    new: "warn", pending: "warn", registered: "warn",
    approved: "ok", contacted: "ok", responded: "ok", prayed: "ok", confirmed: "ok", received: "ok", assigned: "ok", completed: "ok",
    rejected: "off", archived: "off", cancelled: "off", closed: "off", failed: "off",
};
export const statusTone = status => STATUS_TONES[status] || "info";

export function StatusPill({ status }) {
    return <span className={`adm-pill tone-${statusTone(status)}`}>{status || "—"}</span>;
}

export function EmptyState({ icon = "inbox", title, children }) {
    return (
        <div className="adm-card adm-empty">
            <Icon name={icon} size={30} />
            {title && <strong>{title}</strong>}
            {children}
        </div>
    );
}

export function Notice({ tone = "info", children }) {
    return (
        <div className={`adm-notice ${tone}`} role={tone === "error" ? "alert" : undefined}>
            <Icon name={tone === "info" ? "clock" : "alert"} size={16} />
            <div>{children}</div>
        </div>
    );
}

export function formatWhen(ms) {
    if (!ms) return "";
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    if (diff >= 0 && diff < 60_000) return "just now";
    if (diff >= 0 && diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff >= 0 && diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h ago`;
    return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    const push = useCallback((message, tone) => {
        const id = ++nextId.current;
        setToasts(list => [...list, { id, message, tone }]);
        setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), tone === "error" ? 6000 : 3000);
    }, []);

    // run(action, "Saved") awaits the action, shows the success message, and turns
    // any failure into an error toast. Returns true when the action succeeded.
    const run = useCallback(async (action, successMessage) => {
        try {
            await action();
            if (successMessage) push(successMessage, "ok");
            return true;
        } catch (err) {
            push(err?.message || "Something went wrong. Please try again.", "error");
            return false;
        }
    }, [push]);

    return (
        <ToastContext.Provider value={{ notify: push, run }}>
            {children}
            <div className="adm-toasts" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`adm-toast ${t.tone === "error" ? "error" : ""}`}>
                        <Icon name={t.tone === "error" ? "alert" : "check"} size={16} />
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
