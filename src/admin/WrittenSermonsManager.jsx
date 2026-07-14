import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createWrittenSermon, updateWrittenSermon, deleteWrittenSermon } from "./adminDb";

const EMPTY_FORM = { title: "", pastor: "", scripture: "", date: "", body: "" };

function SermonForm({ initial, onCancel, onSave, saving }) {
    const [formData, setFormData] = useState(initial);
    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    return (
        <div style={{ padding: "1.25rem", background: "var(--cream)", borderRadius: 12, marginBottom: "1rem" }}>
            <div style={{ display: "grid", gap: "0.85rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sermon Title</label>
                    <input className="form-input" placeholder="Walking in the Spirit" value={formData.title} onChange={e => setField("title", e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Pastor / Author</label>
                        <input className="form-input" placeholder="Rev. John Doe" value={formData.pastor} onChange={e => setField("pastor", e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input className="form-input" placeholder="July 14, 2026" value={formData.date} onChange={e => setField("date", e.target.value)} />
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Scripture Reference</label>
                    <input className="form-input" placeholder="Romans 12:2" value={formData.scripture} onChange={e => setField("scripture", e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Sermon Text</label>
                    <textarea className="form-textarea" style={{ minHeight: 220 }} placeholder="Write the full sermon here..." value={formData.body} onChange={e => setField("body", e.target.value)} />
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

export default function WrittenSermonsManager() {
    const { data, loading, error } = useFirebaseCollection("writtenSermons");
    const sorted = (data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleCreate = async formData => {
        setBusy(true);
        try {
            await createWrittenSermon(formData);
            setCreating(false);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (id, formData) => {
        setBusy(true);
        try {
            await updateWrittenSermon(id, formData);
            setEditingId(null);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async item => {
        if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await deleteWrittenSermon(item.id);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.15rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>
                    Written Sermons <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
                </h2>
                <button className="btn btn-gold btn-sm" onClick={() => { setCreating(!creating); setEditingId(null); }}>
                    {creating ? "Cancel" : "+ Add Written Sermon"}
                </button>
            </div>

            {creating && (
                <SermonForm initial={EMPTY_FORM} saving={busy} onCancel={() => setCreating(false)} onSave={handleCreate} />
            )}

            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load written sermons. Check Firebase read permissions.</p>}
            {!loading && !error && sorted.length === 0 && !creating && (
                <p style={{ color: "var(--gray-400)" }}>No written sermons yet. Click "+ Add Written Sermon" to create one.</p>
            )}

            <div style={{ display: "grid", gap: "1rem" }}>
                {sorted.map(item => (
                    <div key={item.id} className="card" style={{ padding: "1.5rem" }}>
                        {editingId === item.id ? (
                            <SermonForm
                                initial={{ title: item.title, pastor: item.pastor, scripture: item.scripture, date: item.date, body: item.body }}
                                saving={busy}
                                onCancel={() => setEditingId(null)}
                                onSave={formData => handleUpdate(item.id, formData)}
                            />
                        ) : (
                            <>
                                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)" }}>{item.title}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 6 }}>
                                    {item.pastor} {item.date && `· ${item.date}`} {item.scripture && `· ${item.scripture}`}
                                </div>
                                <div style={{ fontSize: "0.88rem", color: "var(--gray-600)", marginTop: 10, lineHeight: 1.6 }}>
                                    {item.body?.length > 220 ? `${item.body.slice(0, 220)}…` : item.body}
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
