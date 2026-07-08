import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import SubmissionSection from "./SubmissionSection";

const SECTIONS = [
    {
        key: "joinUsRegistrations",
        label: "Join Us Registrations",
        path: "joinUsRegistrations",
        statusOptions: ["new", "contacted", "archived"],
        columns: [
            { key: "firstName", label: "Name", render: (v, item) => `${item.firstName || ""} ${item.lastName || ""}`.trim() },
            { key: "phone", label: "Phone" },
            { key: "area", label: "Area" },
            { key: "gender", label: "Gender" },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "area", label: "Area", type: "text" },
            { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
        ],
        pendingStatus: "new",
    },
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
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "title", label: "Title", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Testimony / Personal Story", "Devotional Article", "Scripture Reflection", "Youth Experience"] },
            { key: "story", label: "Story", type: "textarea" },
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
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "request", label: "Request", type: "textarea" },
            { key: "source", label: "Source", type: "text" },
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
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "helpType", label: "Help Type", type: "select", options: ["I'm new and want to know more", "I'd like to join a ministry", "I need pastoral support", "Partnership or collaboration", "Other"] },
            { key: "message", label: "Message", type: "textarea" },
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
        fields: [
            { key: "fullName", label: "Full Name", type: "text" },
            { key: "eventTitle", label: "Event", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "specialRequirements", label: "Notes", type: "textarea" },
        ],
        pendingStatus: "registered",
        groupByField: "eventTitle",
    },
    {
        key: "smallGroupSignups",
        label: "Small Group Signups",
        path: "smallGroupSignups",
        statusOptions: ["new", "assigned"],
        columns: [
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "preferredGroup", label: "Preferred Group" },
        ],
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "preferredGroup", label: "Preferred Group", type: "select", options: ["Bible Study (Sunday · 11:00 AM)", "Missions", "Men's Fellowship (Friday · 5:00 PM)"] },
        ],
        pendingStatus: "new",
        groupByField: "preferredGroup",
        groupOptions: ["Bible Study (Sunday · 11:00 AM)", "Missions", "Men's Fellowship (Friday · 5:00 PM)"],
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
        fields: [
            { key: "email", label: "Email", type: "text" },
            { key: "source", label: "Source", type: "text" },
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
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Tithes & Offerings", "Youth Ministry Fund", "Mission & Outreach", "Building Fund", "Scholarship Fund"] },
            { key: "amount", label: "Amount (KSh)", type: "number" },
            { key: "frequency", label: "Frequency", type: "select", options: ["One-Time Gift", "Weekly", "Monthly"] },
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
                        fields={current.fields}
                        statusOptions={current.statusOptions}
                        groupByField={current.groupByField}
                        groupOptions={current.groupOptions}
                    />
                )}
            </main>
        </div>
    );
}
