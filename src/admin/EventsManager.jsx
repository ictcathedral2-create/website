import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createEvent, updateEvent, deleteEvent } from "./adminDb";
import { MONTHS, eventDateOf, eventWarnings, parseIsoDate, resolveEventDate, suggestedTimeText, toIsoDate } from "../utils/eventDate";
import { EmptyState, Icon, Notice, PageHeader, useToast } from "./ui";

const EMPTY_FORM = { title: "", eventDate: "", startTime: "", endTime: "", time: "", desc: "" };

// Older events only stored day + month; start the date picker on the date the
// website currently shows for them so the admin just confirms or corrects it.
function formFromEvent(item) {
    const legacy = !item.eventDate && resolveEventDate(item.day, item.month);
    return {
        title: item.title || "",
        eventDate: item.eventDate || (legacy ? toIsoDate(legacy) : ""),
        startTime: item.startTime || "",
        endTime: item.endTime || "",
        time: item.time || "",
        desc: item.desc || "",
    };
}

// Saves the new fields plus the day/month/time ones the website cards and the
// mobile app already read.
function toRecord(form) {
    const date = parseIsoDate(form.eventDate);
    return {
        title: form.title.trim(),
        eventDate: form.eventDate,
        day: String(date.getDate()).padStart(2, "0"),
        month: MONTHS[date.getMonth()],
        startTime: form.startTime,
        endTime: form.endTime,
        time: form.time.trim() || suggestedTimeText(form),
        desc: form.desc.trim(),
    };
}

function EventForm({ heading, initial, legacyNote, onCancel, onSave }) {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const suggestion = suggestedTimeText(form);
    const draftWarnings = form.eventDate ? eventWarnings({ ...form, time: form.time || suggestion }) : [];

    const save = async () => {
        if (!form.title.trim()) return setError("Give the event a title.");
        if (!parseIsoDate(form.eventDate)) return setError("Pick the date of the event.");
        if (form.endTime && form.startTime && form.endTime <= form.startTime) return setError("The end time must be after the start time.");
        setError(null);
        setSaving(true);
        await onSave(toRecord(form));
        setSaving(false);
    };

    return (
        <div className="adm-form">
            <div className="adm-form-title">{heading}</div>
            {legacyNote && <Notice tone="info">This event was saved without a year. The date below is what the website currently shows. Correct it if needed, then save.</Notice>}
            <div className="adm-form-grid">
                <div className="form-group full">
                    <label className="form-label" htmlFor="ev-title">Event title</label>
                    <input id="ev-title" className="form-input" placeholder="Worship Experience" value={form.title} onChange={e => setField("title", e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="ev-date">Date</label>
                    <input id="ev-date" className="form-input" type="date" value={form.eventDate} onChange={e => setField("eventDate", e.target.value)} />
                </div>
                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                        <label className="form-label" htmlFor="ev-start">Starts</label>
                        <input id="ev-start" className="form-input" type="time" value={form.startTime} onChange={e => setField("startTime", e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label" htmlFor="ev-end">Ends (optional)</label>
                        <input id="ev-end" className="form-input" type="time" value={form.endTime} onChange={e => setField("endTime", e.target.value)} />
                    </div>
                </div>
                <div className="form-group full">
                    <label className="form-label" htmlFor="ev-time">Time shown to visitors</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input id="ev-time" className="form-input" placeholder={suggestion || "Sat · 2:00 PM – 5:00 PM"} value={form.time} onChange={e => setField("time", e.target.value)} />
                        {suggestion && form.time !== suggestion && (
                            <button type="button" className="adm-btn" onClick={() => setField("time", suggestion)}>Use “{suggestion}”</button>
                        )}
                    </div>
                    <div className="adm-hint">Leave blank to use the suggestion. Add extra detail if useful, e.g. “2nd Saturday of every month · 2:00 PM”.</div>
                </div>
                <div className="form-group full">
                    <label className="form-label" htmlFor="ev-desc">Description</label>
                    <textarea id="ev-desc" className="form-textarea" value={form.desc} onChange={e => setField("desc", e.target.value)} />
                </div>
            </div>
            {draftWarnings.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                    <Notice tone="warn"><ul>{draftWarnings.map(w => <li key={w}>{w}</li>)}</ul></Notice>
                </div>
            )}
            {error && <div style={{ marginTop: "1rem" }}><Notice tone="error">{error}</Notice></div>}
            <div className="adm-form-actions">
                <button className="adm-btn gold" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save event"}</button>
                <button className="adm-btn" disabled={saving} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

function EventCard({ item, onEdit, onDelete }) {
    const shown = item.when || parseIsoDate(item.eventDate) || resolveEventDate(item.day, item.month);
    return (
        <div className="adm-card adm-record">
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div className={`adm-date${item.when ? "" : " past"}`}>
                    <b>{shown ? shown.getDate() : item.day || "?"}</b>
                    <span>{shown ? MONTHS[shown.getMonth()] : item.month || "—"}</span>
                    {shown && <em>{shown.getFullYear()}</em>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="adm-record-title" style={{ fontSize: "1.05rem" }}>{item.title}</div>
                    <div className="adm-record-meta">{item.time || "No time set"}</div>
                    {item.desc && <div className="adm-field-value" style={{ marginTop: "0.5rem", color: "var(--gray-600)" }}>{item.desc.length > 200 ? `${item.desc.slice(0, 200)}…` : item.desc}</div>}
                </div>
            </div>
            {item.warnings.length > 0 && (
                <div style={{ marginTop: "0.9rem" }}>
                    <Notice tone="warn"><ul>{item.warnings.map(w => <li key={w}>{w}</li>)}</ul></Notice>
                </div>
            )}
            <div className="adm-record-foot">
                <span className="adm-record-meta">{item.when ? "Showing on the website" : "Hidden from the website"}</span>
                <div className="adm-actions">
                    <button className="adm-btn sm ghost" onClick={onEdit}><Icon name="edit" size={14} /> Edit</button>
                    <button className="adm-btn sm ghost danger" onClick={onDelete}><Icon name="trash" size={14} /> Delete</button>
                </div>
            </div>
        </div>
    );
}

export default function EventsManager() {
    const { data, loading, error } = useFirebaseCollection("events");
    const { run } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);

    const events = (data || []).map(e => ({ ...e, when: eventDateOf(e), warnings: eventWarnings(e) }));
    const upcoming = events.filter(e => e.when).sort((a, b) => a.when - b.when);
    const hidden = events.filter(e => !e.when);
    const flagged = events.filter(e => e.warnings.length).length;

    const handleCreate = async record => {
        if (await run(() => createEvent(record), "Event added")) setCreating(false);
    };
    const handleUpdate = async (id, record) => {
        if (await run(() => updateEvent(id, record), "Event saved")) setEditingId(null);
    };
    const handleDelete = async item => {
        if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
        await run(() => deleteEvent(item.id), "Event deleted");
    };

    const renderEvent = item => editingId === item.id ? (
        <EventForm
            key={item.id}
            heading={`Edit “${item.title}”`}
            initial={formFromEvent(item)}
            legacyNote={!item.eventDate}
            onCancel={() => setEditingId(null)}
            onSave={record => handleUpdate(item.id, record)}
        />
    ) : (
        <EventCard key={item.id} item={item} onEdit={() => { setEditingId(item.id); setCreating(false); }} onDelete={() => handleDelete(item)} />
    );

    return (
        <div>
            <PageHeader
                eyebrow="Content"
                title="Events"
                count={events.length}
                subtitle="Events appear on the Home page countdown, the Events page and the mobile app. Changes notify app users."
            >
                <button className="adm-btn primary" onClick={() => { setCreating(!creating); setEditingId(null); }}>
                    <Icon name={creating ? "close" : "plus"} size={15} /> {creating ? "Cancel" : "New event"}
                </button>
            </PageHeader>

            {creating && <EventForm heading="New event" initial={EMPTY_FORM} onCancel={() => setCreating(false)} onSave={handleCreate} />}

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && error && <Notice tone="error">Couldn't load events. Try refreshing the page.</Notice>}
            {!loading && !error && flagged > 0 && !creating && !editingId && (
                <Notice tone="warn">{flagged} event{flagged === 1 ? " has" : "s have"} something to check. See the notes on each card below.</Notice>
            )}
            {!loading && !error && events.length === 0 && !creating && (
                <EmptyState icon="calendar" title="No events yet">Click “New event” to add the first one.</EmptyState>
            )}

            {upcoming.length > 0 && (
                <>
                    <div className="adm-group-title"><h3>Upcoming<small>{upcoming.length}</small></h3></div>
                    <div className="adm-list">{upcoming.map(renderEvent)}</div>
                </>
            )}
            {hidden.length > 0 && (
                <>
                    <div className="adm-group-title"><h3>Past or hidden<small>{hidden.length}</small></h3></div>
                    <div className="adm-list">{hidden.map(renderEvent)}</div>
                </>
            )}
        </div>
    );
}
