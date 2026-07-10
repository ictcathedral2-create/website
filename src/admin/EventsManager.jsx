import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createEvent, updateEvent, deleteEvent } from "./adminDb";

const EMPTY_FORM = { day: "", month: "", title: "", time: "", desc: "", startTime: "" };

function EventForm({ initial, onCancel, onSave, saving }) {
    const [formData, setFormData] = useState(initial);
    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    return (
        <div style={{ padding: "1.25rem", background: "var(--cream)", borderRadius: 12, marginBottom: "1rem" }}>
            <div style={{ display: "grid", gap: "0.85rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Day (2-digit)</label>
                        <input className="form-input" placeholder="02" value={formData.day} onChange={e => setField("day", e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Month (e.g. Aug)</label>
                        <input className="form-input" placeholder="Aug" value={formData.month} onChange={e => setField("month", e.target.value)} />
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Event Title</label>
                    <input className="form-input" placeholder="Worship Experience" value={formData.title} onChange={e => setField("title", e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Time / Schedule</label>
                    <input className="form-input" placeholder="Sun · 4:00 PM – 6:30 PM" value={formData.time} onChange={e => setField("time", e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Exact Start Time (optional)</label>
                    <input className="form-input" type="time" value={formData.startTime || ""} onChange={e => setField("startTime", e.target.value)} />
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 4 }}>
                        Powers the "Starting In" / "Happening Now" countdown on the Home page. Leave blank to skip that precision.
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={formData.desc} onChange={e => setField("desc", e.target.value)} />
                </div>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
                <button className="btn btn-gold btn-sm" disabled={saving} onClick={() => onSave(formData)}>
                    {saving ? "Saving..." : "Save"}
                </button>
                <button className="btn btn-navy btn-sm" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

export default function EventsManager() {
    const { data, loading, error } = useFirebaseCollection("events");
    const sorted = (data || []).slice().sort((a, b) => `${a.month}${String(a.day).padStart(2, "0")}`.localeCompare(`${b.month}${String(b.day).padStart(2, "0")}`));
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleCreate = async formData => {
        setBusy(true);
        try {
            await createEvent(formData);
            setCreating(false);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (id, formData) => {
        setBusy(true);
        try {
            await updateEvent(id, formData);
            setEditingId(null);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async item => {
        if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await deleteEvent(item.id);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
                    Manage Events <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
                </h2>
                <button className="btn btn-gold btn-sm" onClick={() => { setCreating(!creating); setEditingId(null); }}>
                    {creating ? "Cancel" : "+ Add New Event"}
                </button>
            </div>

            {creating && (
                <EventForm initial={EMPTY_FORM} saving={busy} onCancel={() => setCreating(false)} onSave={handleCreate} />
            )}

            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load events. Check Firebase read permissions.</p>}
            {!loading && !error && sorted.length === 0 && !creating && (
                <p style={{ color: "var(--gray-400)" }}>No events yet. Click "+ Add New Event" to create one.</p>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
                {sorted.map(item => (
                    <div key={item.id} className="card" style={{ padding: "1.5rem" }}>
                        {editingId === item.id ? (
                            <EventForm
                                initial={{ day: item.day, month: item.month, title: item.title, time: item.time, desc: item.desc, startTime: item.startTime || "" }}
                                saving={busy}
                                onCancel={() => setEditingId(null)}
                                onSave={formData => handleUpdate(item.id, formData)}
                            />
                        ) : (
                            <>
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <div style={{ width: 60, minWidth: 60, height: 60, background: "var(--navy)", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>{item.day}</div>
                                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>{item.month}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--navy)" }}>{item.title}</div>
                                        <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 2 }}>{item.time}</div>
                                        <div style={{ fontSize: "0.88rem", color: "var(--gray-600)", marginTop: 6, lineHeight: 1.55 }}>{item.desc}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", borderTop: "1px solid var(--gray-200)", paddingTop: "0.85rem" }}>
                                    <button className="btn btn-navy btn-sm" onClick={() => { setEditingId(item.id); setCreating(false); }}>Edit</button>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: "rgba(224,115,48,0.12)", color: "var(--orange)" }}
                                        disabled={busy}
                                        onClick={() => handleDelete(item)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
