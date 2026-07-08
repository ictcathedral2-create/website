import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { updateSubmissionStatus, createSubmission, updateSubmissionFields, deleteSubmission } from "./adminDb";
import { downloadCsv } from "./csvExport";

function emptyFormData(fields) {
    const data = {};
    fields.forEach(f => { data[f.key] = f.type === "select" && f.options?.length ? f.options[0] : ""; });
    return data;
}

function RecordForm({ fields, initial, onCancel, onSave, saving }) {
    const [formData, setFormData] = useState(initial);
    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    return (
        <div style={{ padding: "1.25rem", background: "var(--cream)", borderRadius: 12, marginBottom: "1rem" }}>
            <div style={{ display: "grid", gap: "0.85rem" }}>
                {fields.map(f => (
                    <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{f.label}</label>
                        {f.type === "textarea" ? (
                            <textarea className="form-textarea" value={formData[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)} />
                        ) : f.type === "select" ? (
                            <select className="form-select" value={formData[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)}>
                                {f.options.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input
                                className="form-input"
                                type={f.type === "number" ? "number" : "text"}
                                value={formData[f.key] ?? ""}
                                onChange={e => setField(f.key, e.target.value)}
                            />
                        )}
                    </div>
                ))}
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

export default function SubmissionSection({ title, path, columns, fields, statusOptions }) {
    const { data, loading, error } = useFirebaseCollection(`submissions/${path}`);
    const sorted = (data || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const [updatingId, setUpdatingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleStatusChange = async (item, status) => {
        setUpdatingId(item.id);
        try {
            await updateSubmissionStatus(path, item.id, status, item);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCreate = async formData => {
        setBusy(true);
        try {
            await createSubmission(path, { ...formData, status: statusOptions[0] });
            setCreating(false);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (item, formData) => {
        setBusy(true);
        try {
            const merged = { ...item, ...formData };
            delete merged.id;
            await updateSubmissionFields(path, item.id, merged);
            setEditingId(null);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async item => {
        if (!window.confirm("Delete this record permanently? This cannot be undone.")) return;
        setBusy(true);
        try {
            await deleteSubmission(path, item.id);
        } finally {
            setBusy(false);
        }
    };

    const handleDownload = () => {
        const exportColumns = [
            ...columns,
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Submitted", render: v => (v ? new Date(v).toLocaleString("en-US") : "") },
        ];
        downloadCsv(`${path}-${new Date().toISOString().slice(0, 10)}`, exportColumns, sorted);
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
                    {title} <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
                </h2>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button className="btn btn-navy btn-sm" onClick={handleDownload} disabled={sorted.length === 0}>
                        Download CSV
                    </button>
                    <button className="btn btn-gold btn-sm" onClick={() => { setCreating(!creating); setEditingId(null); }}>
                        {creating ? "Cancel" : "+ Add New"}
                    </button>
                </div>
            </div>

            {creating && (
                <RecordForm
                    fields={fields}
                    initial={emptyFormData(fields)}
                    saving={busy}
                    onCancel={() => setCreating(false)}
                    onSave={handleCreate}
                />
            )}

            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load this data. Check Firebase read permissions.</p>}
            {!loading && !error && sorted.length === 0 && !creating && <p style={{ color: "var(--gray-400)" }}>No submissions yet.</p>}
            <div style={{ display: "grid", gap: "1rem" }}>
                {sorted.map(item => (
                    <div key={item.id} className="card" style={{ padding: "1.5rem" }}>
                        {editingId === item.id ? (
                            <RecordForm
                                fields={fields}
                                initial={fields.reduce((acc, f) => ({ ...acc, [f.key]: item[f.key] ?? "" }), {})}
                                saving={busy}
                                onCancel={() => setEditingId(null)}
                                onSave={formData => handleUpdate(item, formData)}
                            />
                        ) : (
                            <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                                {columns.map(col => (
                                    <div key={col.key} style={{ fontSize: "0.9rem" }}>
                                        <span style={{ fontWeight: 700, color: "var(--navy)" }}>{col.label}: </span>
                                        <span style={{ color: "var(--gray-600)" }}>{col.render ? col.render(item[col.key], item) : (item[col.key] || "—")}</span>
                                    </div>
                                ))}
                                <div style={{ fontSize: "0.78rem", color: "var(--gray-400)" }}>
                                    Submitted {new Date(item.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                </div>
                            </div>
                        )}
                        {editingId !== item.id && (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", borderTop: "1px solid var(--gray-200)", paddingTop: "0.85rem" }}>
                                    <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gray-400)" }}>Status:</span>
                                    {statusOptions.map(s => (
                                        <button
                                            key={s}
                                            disabled={updatingId === item.id || item.status === s}
                                            onClick={() => handleStatusChange(item, s)}
                                            className={`btn btn-sm ${item.status === s ? "btn-gold" : "btn-navy"}`}
                                            style={{ opacity: item.status === s ? 1 : 0.55 }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
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
