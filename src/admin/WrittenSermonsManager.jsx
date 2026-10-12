import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createWrittenSermon, updateWrittenSermon, deleteWrittenSermon } from "./adminDb";
import { parseIsoDate, toIsoDate } from "../utils/eventDate";
import { EmptyState, Icon, Notice, PageHeader, useToast } from "./ui";

const EMPTY_FORM = { title: "", pastor: "", scripture: "", date: "", body: "" };

// Sermon dates are stored as display text ("July 14, 2026"); the picker reads
// and writes that format.
const displayDate = iso => parseIsoDate(iso)?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) || "";
const isoFromDisplay = text => {
    const parsed = new Date(text);
    return text && !Number.isNaN(parsed.getTime()) ? toIsoDate(parsed) : "";
};

function SermonForm({ heading, initial, onCancel, onSave }) {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const words = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;

    const save = async () => {
        if (!form.title.trim() || !form.body.trim()) return setError("A sermon needs a title and its text.");
        setError(null);
        setSaving(true);
        await onSave({ ...form, title: form.title.trim() });
        setSaving(false);
    };

    return (
        <div className="adm-form">
            <div className="adm-form-title">{heading}</div>
            <div className="adm-form-grid">
                <div className="form-group full">
                    <label className="form-label" htmlFor="ws-title">Sermon title</label>
                    <input id="ws-title" className="form-input" placeholder="Walking in the Spirit" value={form.title} onChange={e => setField("title", e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="ws-pastor">Preacher / author</label>
                    <input id="ws-pastor" className="form-input" placeholder="Rev. John Doe" value={form.pastor} onChange={e => setField("pastor", e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="ws-date">Date preached</label>
                    <input id="ws-date" className="form-input" type="date" value={isoFromDisplay(form.date)} onChange={e => setField("date", displayDate(e.target.value))} />
                    {form.date && !isoFromDisplay(form.date) && <div className="adm-hint">Currently shown as “{form.date}”.</div>}
                </div>
                <div className="form-group full">
                    <label className="form-label" htmlFor="ws-scripture">Scripture reference</label>
                    <input id="ws-scripture" className="form-input" placeholder="Romans 12:2" value={form.scripture} onChange={e => setField("scripture", e.target.value)} />
                </div>
                <div className="form-group full">
                    <label className="form-label" htmlFor="ws-body">Full sermon text</label>
                    <textarea id="ws-body" className="form-textarea" style={{ minHeight: 280 }} placeholder="Write or paste the full sermon here…" value={form.body} onChange={e => setField("body", e.target.value)} />
                    <div className="adm-hint">{words} words · about {Math.max(1, Math.round(words / 200))} min read</div>
                </div>
            </div>
            {error && <div style={{ marginTop: "1rem" }}><Notice tone="error">{error}</Notice></div>}
            <div className="adm-form-actions">
                <button className="adm-btn gold" disabled={saving} onClick={save}>{saving ? "Saving…" : "Publish"}</button>
                <button className="adm-btn" disabled={saving} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

export default function WrittenSermonsManager() {
    const { data, loading, error } = useFirebaseCollection("writtenSermons");
    const { run } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [query, setQuery] = useState("");

    const sorted = (data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const q = query.trim().toLowerCase();
    const visible = q ? sorted.filter(s => [s.title, s.pastor, s.scripture, s.body].join(" ").toLowerCase().includes(q)) : sorted;

    const handleCreate = async form => {
        if (await run(() => createWrittenSermon(form), "Sermon published")) setCreating(false);
    };
    const handleUpdate = async (item, form) => {
        // Keep createdAt so the sermon doesn't jump position after an edit.
        if (await run(() => updateWrittenSermon(item.id, { ...form, createdAt: item.createdAt || Date.now() }), "Sermon saved")) setEditingId(null);
    };
    const handleDelete = async item => {
        if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
        await run(() => deleteWrittenSermon(item.id), "Sermon deleted");
    };

    return (
        <div>
            <PageHeader eyebrow="Content" title="Written Sermons" count={sorted.length} subtitle="Published sermons appear under Resources → Written Sermons and in the app.">
                <button className="adm-btn primary" onClick={() => { setCreating(!creating); setEditingId(null); }}>
                    <Icon name={creating ? "close" : "plus"} size={15} /> {creating ? "Cancel" : "New sermon"}
                </button>
            </PageHeader>

            {creating && <SermonForm heading="New sermon" initial={EMPTY_FORM} onCancel={() => setCreating(false)} onSave={handleCreate} />}

            {sorted.length > 3 && (
                <div className="adm-toolbar">
                    <div className="adm-search">
                        <Icon name="search" size={16} />
                        <input type="search" placeholder="Search sermons…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search sermons" />
                    </div>
                </div>
            )}

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && error && <Notice tone="error">Couldn't load sermons. Try refreshing the page.</Notice>}
            {!loading && !error && sorted.length === 0 && !creating && <EmptyState icon="book" title="No written sermons yet">Click “New sermon” to publish the first one.</EmptyState>}
            {!loading && !error && sorted.length > 0 && visible.length === 0 && <EmptyState icon="search" title="No matches" />}

            <div className="adm-list">
                {visible.map(item => editingId === item.id ? (
                    <SermonForm
                        key={item.id}
                        heading={`Edit “${item.title}”`}
                        initial={{ title: item.title || "", pastor: item.pastor || "", scripture: item.scripture || "", date: item.date || "", body: item.body || "" }}
                        onCancel={() => setEditingId(null)}
                        onSave={form => handleUpdate(item, form)}
                    />
                ) : (
                    <div key={item.id} className="adm-card adm-record">
                        <div className="adm-record-title" style={{ fontSize: "1.05rem" }}>{item.title}</div>
                        <div className="adm-record-meta">{[item.pastor, item.date, item.scripture].filter(Boolean).join(" · ")}</div>
                        <div className="adm-field-value" style={{ marginTop: "0.6rem", color: "var(--gray-600)", lineHeight: 1.6 }}>
                            {item.body?.length > 240 ? `${item.body.slice(0, 240)}…` : item.body}
                        </div>
                        <div className="adm-record-foot">
                            <span className="adm-record-meta">{item.body ? `${item.body.trim().split(/\s+/).length} words` : ""}</span>
                            <div className="adm-actions">
                                <button className="adm-btn sm ghost" onClick={() => { setEditingId(item.id); setCreating(false); }}><Icon name="edit" size={14} /> Edit</button>
                                <button className="adm-btn sm ghost danger" onClick={() => handleDelete(item)}><Icon name="trash" size={14} /> Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
