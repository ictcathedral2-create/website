import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import SubmissionSection from "./SubmissionSection";
import EventsManager from "./EventsManager";
import GalleryManager from "./GalleryManager";
import SupportChatsManager from "./SupportChatsManager";

function normalizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const SECTIONS = [
    {
        key: "manageEvents",
        label: "Manage Events",
        type: "events",
    },
    {
        key: "manageGallery",
        label: "Gallery / Posters",
        type: "gallery",
    },
    {
        key: "supportCenter",
        label: "Support Center",
        type: "support",
        rawPath: "supportChats",
        pendingStatus: "new",
    },
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
        key: "businessListings",
        label: "Business Listings",
        path: "businessListings",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            {
                key: "mediaType", label: "Media", render: (v, item) => {
                    if (v === "image" && item.mediaData) return <img src={item.mediaData} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />;
                    if (v === "video" && item.mediaUrl) return <a href={item.mediaUrl} target="_blank" rel="noreferrer">▶ Video</a>;
                    return "—";
                }
            },
            { key: "businessName", label: "Business" },
            { key: "ownerName", label: "Owner" },
            { key: "phone", label: "Phone" },
            { key: "category", label: "Category" },
            { key: "description", label: "Description" },
            { key: "websiteUrl", label: "Website", render: v => v ? <a href={normalizeUrl(v)} target="_blank" rel="noreferrer">🔗 Link</a> : "—" },
        ],
        fields: [
            { key: "businessName", label: "Business Name", type: "text" },
            { key: "ownerName", label: "Owner Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Retail & Shops", "Food & Catering", "Services", "Agriculture", "Technology", "Fashion & Beauty", "Transport", "Other"] },
            { key: "description", label: "Description", type: "textarea" },
            { key: "websiteUrl", label: "Website / Social Link", type: "text" },
        ],
        pendingStatus: "pending",
    },
    {
        key: "jobPostings",
        label: "Job Postings",
        path: "jobPostings",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            {
                key: "advertType", label: "Advert", render: (v, item) => {
                    if (v === "image" && item.advertData) return <img src={item.advertData} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />;
                    if (v === "pdf" && item.advertData) return <a href={item.advertData} target="_blank" rel="noreferrer">📄 PDF</a>;
                    return "—";
                }
            },
            { key: "jobTitle", label: "Job Title" },
            { key: "company", label: "Company" },
            { key: "contactPhone", label: "Phone" },
            { key: "jobType", label: "Type" },
            { key: "description", label: "Description" },
            { key: "jobUrl", label: "Link", render: v => v ? <a href={normalizeUrl(v)} target="_blank" rel="noreferrer">🔗 Link</a> : "—" },
        ],
        fields: [
            { key: "jobTitle", label: "Job Title", type: "text" },
            { key: "company", label: "Company / Organization", type: "text" },
            { key: "contactPhone", label: "Contact Phone", type: "text" },
            { key: "jobType", label: "Job Type", type: "select", options: ["Full-time", "Part-time", "Internship", "Volunteer", "Casual"] },
            { key: "description", label: "Description", type: "textarea" },
            { key: "jobUrl", label: "Application Link / Website", type: "text" },
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
            { key: "phone", label: "Phone" },
            { key: "request", label: "Request" },
            { key: "source", label: "Source" },
        ],
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
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
            { key: "firstName", label: "Name", render: (v, item) => `${item.firstName || ""} ${item.lastName || ""}`.trim() },
            { key: "eventTitle", label: "Event" },
            { key: "phone", label: "Phone" },
            { key: "specialRequirements", label: "Notes" },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "eventTitle", label: "Event", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "specialRequirements", label: "Notes", type: "textarea" },
        ],
        pendingStatus: "registered",
        groupByField: "eventTitle",
    },
    {
        key: "ministryRegistrations",
        label: "Ministry Registrations",
        path: "ministryRegistrations",
        statusOptions: ["new", "contacted", "archived"],
        columns: [
            { key: "firstName", label: "Name", render: (v, item) => `${item.firstName || ""} ${item.lastName || ""}`.trim() },
            { key: "phone", label: "Phone" },
            { key: "ministryTitle", label: "Ministry" },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "ministryTitle", label: "Ministry", type: "text" },
        ],
        pendingStatus: "new",
        groupByField: "ministryTitle",
        groupOptions: ["ICT Ministry", "Praise & Worship Ministry", "Care Ministry", "Ushering Ministry", "Intercessory Ministry", "Creative Ministry", "Pastoral Ministry"],
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
    {
        key: "mpesaTransactions",
        label: "M-Pesa Transactions",
        path: "mpesaTransactions",
        statusOptions: ["pending", "completed", "failed"],
        columns: [
            { key: "phone", label: "Phone" },
            { key: "accountType", label: "Giving Towards" },
            { key: "amount", label: "Amount", render: v => `KSh ${Number(v || 0).toLocaleString()}` },
            { key: "mpesaReceiptNumber", label: "Receipt" },
        ],
        fields: [
            { key: "phone", label: "Phone", type: "text" },
            { key: "accountType", label: "Giving Towards", type: "text" },
            { key: "amount", label: "Amount (KSh)", type: "number" },
            { key: "mpesaReceiptNumber", label: "M-Pesa Receipt", type: "text" },
        ],
        pendingStatus: "pending",
    },
];

function SidebarBadge({ path, rawPath, pendingStatus }) {
    const { data } = useFirebaseCollection(rawPath || `submissions/${path}`);
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
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", lineHeight: 0.9 }}>Admin</div>
                        <div style={{ fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--gold-light)", marginTop: 4 }}>ACK St Pauls Youths</div>
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
                                border: "none", cursor: "pointer", fontSize: "0.8rem", letterSpacing: "0.01em",
                                background: activeSection === s.key ? "rgba(201,168,76,0.15)" : "transparent",
                                color: activeSection === s.key ? "var(--gold-light)" : "rgba(255,255,255,0.75)",
                                fontWeight: activeSection === s.key ? 600 : 500,
                            }}
                        >
                            {s.label}
                            {s.pendingStatus && <SidebarBadge path={s.path} rawPath={s.rawPath} pendingStatus={s.pendingStatus} />}
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
                {current?.type === "events" ? (
                    <EventsManager />
                ) : current?.type === "gallery" ? (
                    <GalleryManager />
                ) : current?.type === "support" ? (
                    <SupportChatsManager />
                ) : current && (
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
