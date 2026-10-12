import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { MONTHS, eventDateOf, eventWarnings } from "../utils/eventDate";
import { Icon, PageHeader } from "./ui";
import { hasPendingCount, usePendingCount } from "./usePendingCount";

function StatCard({ section, onOpen }) {
    const { count, total, loading } = usePendingCount(section);
    return (
        <button className="adm-card adm-stat" onClick={onOpen}>
            <div className="adm-stat-top">{section.label}<Icon name={section.icon} size={17} /></div>
            <div className={`adm-stat-num${count ? "" : " zero"}`}>{loading ? "…" : count}</div>
            <div className="adm-stat-note">{section.pendingLabel || "new"} · {total} total</div>
        </button>
    );
}

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Overview({ sections, open }) {
    const { data: events } = useFirebaseCollection("events");
    const counted = sections.filter(hasPendingCount);
    const all = (events || []).map(e => ({ ...e, when: eventDateOf(e), warnings: eventWarnings(e) }));
    const upcoming = all.filter(e => e.when).sort((a, b) => a.when - b.when).slice(0, 5);
    const flagged = all.filter(e => e.warnings.length);

    return (
        <>
            <PageHeader
                eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                title={greeting()}
                subtitle="Here's what needs your attention across the website and app."
            >
                <button className="adm-btn" onClick={() => open("gallery")}><Icon name="upload" size={15} /> Upload poster</button>
                <button className="adm-btn primary" onClick={() => open("events")}><Icon name="plus" size={15} /> New event</button>
            </PageHeader>

            {flagged.length > 0 && (
                <button className="adm-notice warn" style={{ width: "100%", border: "none", textAlign: "left", cursor: "pointer", font: "inherit" }} onClick={() => open("events")}>
                    <Icon name="alert" size={16} />
                    <div>
                        <strong>{flagged.length} event{flagged.length === 1 ? " needs" : "s need"} checking:</strong> {flagged.map(e => e.title).join(", ")}. Open Events to fix.
                    </div>
                </button>
            )}

            <div className="adm-stats">
                {counted.map(s => <StatCard key={s.key} section={s} onOpen={() => open(s.key)} />)}
            </div>

            <div className="adm-two-col">
                <div className="adm-card adm-panel">
                    <h3>Coming up</h3>
                    {upcoming.length === 0 && <div className="adm-row-sub">No upcoming events. Add one so the Home page countdown has something to show.</div>}
                    {upcoming.map(e => (
                        <div key={e.id} className="adm-row">
                            <div className="adm-date sm"><b>{e.when.getDate()}</b><span>{MONTHS[e.when.getMonth()]}</span></div>
                            <div className="adm-row-main">
                                <div className="adm-row-title">{e.title}</div>
                                <div className="adm-row-sub">{e.time || "No time set"}</div>
                            </div>
                            {e.warnings.length > 0 && <span className="adm-pill tone-warn">Check</span>}
                        </div>
                    ))}
                    <button className="adm-btn sm" style={{ marginTop: "0.75rem" }} onClick={() => open("events")}>Manage events</button>
                </div>
                <div className="adm-card adm-panel">
                    <h3>Quick links</h3>
                    {[
                        ["support", "Reply to support chats", "chat"],
                        ["testimonies", "Approve testimonies", "star"],
                        ["writtenSermons", "Post a written sermon", "book"],
                        ["eventRegistrations", "See who registered for events", "ticket"],
                    ].filter(([key]) => sections.some(s => s.key === key)).map(([key, label, icon]) => (
                        <div key={key} className="adm-row">
                            <Icon name={icon} size={17} />
                            <div className="adm-row-main"><div className="adm-row-title">{label}</div></div>
                            <button className="adm-btn sm ghost" onClick={() => open(key)}>Open</button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
