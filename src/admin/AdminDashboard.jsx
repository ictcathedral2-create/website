import { useEffect, useState } from "react";
import { useAdminRole } from "../hooks/useAdminRole";
import logo from "../assets/logo.png";
import { GROUPS, SECTIONS } from "./sections";
import { Icon, ToastProvider } from "./ui";
import { hasPendingCount, usePendingCount } from "./usePendingCount";
import Overview from "./Overview";
import SubmissionSection from "./SubmissionSection";
import EventsManager from "./EventsManager";
import ImageGalleryManager from "./ImageGalleryManager";
import SupportChatsManager from "./SupportChatsManager";
import WrittenSermonsManager from "./WrittenSermonsManager";
import AdminUsersManager from "./AdminUsersManager";

// The open section lives in the URL (#admin/events) so a refresh or a shared
// link lands on the same page.
const sectionFromHash = () => window.location.hash.replace(/^#admin\/?/, "") || "overview";

function NavBadge({ section }) {
    const { count } = usePendingCount(section);
    return count ? <span className="adm-badge" title={`${count} ${section.pendingLabel || "new"}`}>{count}</span> : null;
}

function SectionBody({ section, sections, user, open }) {
    switch (section.type) {
        case "overview": return <Overview sections={sections} open={open} />;
        case "events": return <EventsManager />;
        case "gallery":
            return (
                <ImageGalleryManager
                    path="gallery"
                    title="Posters & Photos"
                    description="These rotate on the Home page. Upload event posters ahead of time, and photos after the event."
                    aspect="3 / 4"
                    notifyCategory="gallery"
                />
            );
        case "sermonGallery":
            return (
                <ImageGalleryManager
                    path="sermonGallery"
                    title="Sermon Photos"
                    description="These appear in the Gallery tab of the Sermons page: photos from services, preaching and worship."
                    aspect="1 / 1"
                    notifyCategory="gallery"
                />
            );
        case "writtenSermons": return <WrittenSermonsManager />;
        case "support": return <SupportChatsManager />;
        case "adminUsers": return <AdminUsersManager currentUid={user?.uid} />;
        default: return <SubmissionSection key={section.key} section={section} />;
    }
}

export default function AdminDashboard({ user, onLogout }) {
    const [activeKey, setActiveKey] = useState(sectionFromHash);
    const [menuOpen, setMenuOpen] = useState(false);
    const role = useAdminRole(user?.uid);
    const sections = SECTIONS.filter(s => !s.superOnly || role === "super");
    const current = sections.find(s => s.key === activeKey) || sections[0];

    useEffect(() => {
        const onHashChange = () => setActiveKey(sectionFromHash());
        window.addEventListener("hashchange", onHashChange);
        window.addEventListener("popstate", onHashChange);
        return () => {
            window.removeEventListener("hashchange", onHashChange);
            window.removeEventListener("popstate", onHashChange);
        };
    }, []);

    const open = key => {
        window.history.pushState(null, "", key === "overview" ? "#admin" : `#admin/${key}`);
        setActiveKey(key);
        setMenuOpen(false);
        document.querySelector(".adm-main")?.scrollTo(0, 0);
    };

    return (
        <ToastProvider>
            <div className="adm">
                <div className={`adm-overlay${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)} />
                <aside className={`adm-sidebar${menuOpen ? " open" : ""}`} aria-label="Admin navigation">
                    <div className="adm-brand">
                        <img src={logo} alt="" />
                        <div>
                            <div className="adm-brand-name">Admin</div>
                            <div className="adm-brand-sub">ACK St Pauls Youths</div>
                        </div>
                    </div>
                    <nav className="adm-nav">
                        {GROUPS.map(group => {
                            const items = sections.filter(s => s.group === group);
                            if (!items.length) return null;
                            return (
                                <div key={group} className="adm-nav-group">
                                    {group !== "Overview" && <div className="adm-nav-heading">{group}</div>}
                                    {items.map(s => (
                                        <button
                                            key={s.key}
                                            className={`adm-nav-item${current.key === s.key ? " active" : ""}`}
                                            aria-current={current.key === s.key ? "page" : undefined}
                                            onClick={() => open(s.key)}
                                        >
                                            <Icon name={s.icon} size={17} />
                                            {s.label}
                                            {hasPendingCount(s) && <NavBadge section={s} />}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </nav>
                    <div className="adm-user">
                        <div className="adm-user-role">{role === "super" ? "Super admin" : "Admin"}</div>
                        <div className="adm-user-email">{user?.email}</div>
                        <div className="adm-user-actions">
                            <a href="/" target="_blank" rel="noreferrer"><Icon name="external" size={14} /> View site</a>
                            <button onClick={onLogout}><Icon name="logout" size={14} /> Log out</button>
                        </div>
                    </div>
                </aside>
                <main className="adm-main">
                    <div className="adm-topbar">
                        <button onClick={() => setMenuOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
                        <strong>{current.label}</strong>
                    </div>
                    <div className="adm-content">
                        <SectionBody section={current} sections={sections} user={user} open={open} />
                    </div>
                </main>
            </div>
        </ToastProvider>
    );
}
