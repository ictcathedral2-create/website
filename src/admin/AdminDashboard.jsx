import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import SubmissionSection from "./SubmissionSection";

const SECTIONS = [
    {
        key: "testimonies",
        label: "Testimonies",
        path: "testimonies",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            { key: "title", label: "Title" },
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "story", label: "Story" },
        ],
        pendingStatus: "pending",
    },
    {
        key: "prayerRequests",
        label: "Prayer Requests",
        path: "prayerRequests",
        statusOptions: ["new", "prayed", "archived"],
        columns: [
            { key: "name", label: "Name", render: (v, item) => (item.anonymous ? "Anonymous" : v || "—") },
            { key: "request", label: "Request" },
            { key: "source", label: "Source" },
        ],
        pendingStatus: "new",
    },
    {
        key: "contactMessages",
        label: "Contact Messages",
        path: "contactMessages",
        statusOptions: ["new", "responded", "archived"],
        columns: [
            { key: "firstName", label: "Name", render: (v, item) => `${item.firstName || ""} ${item.lastName || ""}`.trim() },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "helpType", label: "Help Type" },
            { key: "message", label: "Message" },
        ],
        pendingStatus: "new",
    },
    {
        key: "eventRegistrations",
        label: "Event Registrations",
        path: "eventRegistrations",
        statusOptions: ["registered", "confirmed", "cancelled"],
        columns: [
            { key: "fullName", label: "Name" },
            { key: "eventTitle", label: "Event" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "specialRequirements", label: "Notes" },
        ],
        pendingStatus: "registered",
    },
    {
        key: "smallGroupSignups",
        label: "Small Group Signups",
        path: "smallGroupSignups",
        statusOptions: ["new", "assigned"],
        columns: [
            { key: "name", label: "Name" },
            { key: "preferredGroup", label: "Preferred Group" },
        ],
        pendingStatus: "new",
    },
    {
        key: "newsletterSignups",
        label: "Newsletter Signups",
        path: "newsletterSignups",
        statusOptions: ["new", "archived"],
        columns: [
            { key: "email", label: "Email" },
            { key: "source", label: "Source" },
        ],
        pendingStatus: "new",
    },
    {
        key: "givingRecords",
        label: "Giving Records",
        path: "givingRecords",
        statusOptions: ["new", "received"],
        columns: [
            { key: "firstName", label: "Name", render: (v, item) => `${item.firstName || ""} ${item.lastName || ""}`.trim() },
            { key: "email", label: "Email" },
            { key: "category", label: "Category" },
            { key: "amount", label: "Amount", render: v => `KSh ${Number(v || 0).toLocaleString()}` },
            { key: "frequency", label: "Frequency" },
        ],
        pendingStatus: "new",
    },
];

function SidebarBadge({ path, pendingStatus }) {
    const { data } = useFirebaseCollection(`submissions/${path}`);
    const count = (data || []).filter(item => item.status === pendingStatus).length;
    if (!count) return null;
    return (
        <span style={{ background: "var(--gold)", color: "white", fontSize: "0.7rem", fontWeight: 700, borderRadius: 10, padding: "1px 7px", marginLeft: "auto" }}>
            {count}
        </span>
    );
}

export default function AdminDashboard({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("testimonies");
    const [mobileOpen, setMobileOpen] = useState(false);
    const current = SECTIONS.find(s => s.key === activeSection);

    const selectSection = key => {
        setActiveSection(key);
        setMobileOpen(false);
    };

    return (
        <div className="admin-layout" style={{ height: "100vh", display: "flex", background: "var(--cream)", overflow: "hidden" }}>
            <button className="admin-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">☰</button>
            <div className={`admin-overlay${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />
            <aside
                className={`admin-sidebar${mobileOpen ? " open" : ""}`}
                style={{ width: 260, background: "var(--navy)", color: "white", padding: "1.75rem 1.25rem", flexShrink: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✝</div>
                    <div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "0.95rem" }}>Admin</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--gold-light)" }}>ACK St Pauls Youths</div>
                    </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {SECTIONS.map(s => (
                        <button
                            key={s.key}
                            onClick={() => selectSection(s.key)}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                textAlign: "left", padding: "0.65rem 0.85rem", borderRadius: 8,
                                border: "none", cursor: "pointer", fontSize: "0.88rem",
                                background: activeSection === s.key ? "rgba(201,168,76,0.15)" : "transparent",
                                color: activeSection === s.key ? "var(--gold-light)" : "rgba(255,255,255,0.75)",
                                fontWeight: activeSection === s.key ? 600 : 500,
                            }}
                        >
                            {s.label}
                            <SidebarBadge path={s.path} pendingStatus={s.pendingStatus} />
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem", wordBreak: "break-all" }}>{user?.email}</div>
                    <button className="btn btn-navy btn-sm" style={{ width: "100%", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }} onClick={onLogout}>
                        Log Out
                    </button>
                </div>
            </aside>
            <main className="admin-main" style={{ flex: 1, padding: "2.5rem 3rem", overflowY: "auto" }}>
                {current && (
                    <SubmissionSection
                        title={current.label}
                        path={current.path}
                        columns={current.columns}
                        statusOptions={current.statusOptions}
                    />
                )}
            </main>
        </div>
    );
}
