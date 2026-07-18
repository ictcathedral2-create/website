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

function RecordCard({ item, columns, fields, statusOptions, editing, busy, updatingId, onEdit, onCancelEdit, onSave, onStatusChange, onDelete }) {
    return (
        <div className="card" style={{ padding: "1.5rem" }}>
            {editing ? (
                <RecordForm
                    fields={fields}
                    initial={fields.reduce((acc, f) => ({ ...acc, [f.key]: item[f.key] ?? "" }), {})}
                    saving={busy}
                    onCancel={onCancelEdit}
                    onSave={onSave}
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
            {!editing && (
                <>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", borderTop: "1px solid var(--gray-200)", paddingTop: "0.85rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--gray-400)" }}>Status:</span>
                        {statusOptions.map(s => (
                            <button
                                key={s}
                                disabled={updatingId === item.id}
                                onClick={() => onStatusChange(item, s)}
                                className={`btn btn-sm ${item.status === s ? "btn-gold" : "btn-navy"}`}
                                style={{ opacity: item.status === s ? 1 : 0.55 }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
                        <button className="btn btn-navy btn-sm" onClick={() => onEdit(item.id)}>Edit</button>
                        <button
                            className="btn btn-sm"
                            style={{ background: "rgba(224,115,48,0.12)", color: "var(--orange)" }}
                            disabled={busy}
                            onClick={() => onDelete(item)}
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function RecordList({ heading, items, columns, fields, statusOptions, editingId, busy, updatingId, onEdit, onCancelEdit, onSave, onStatusChange, onDelete, onDownload }) {
    return (
        <div style={{ marginBottom: "2.5rem" }}>
            {heading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>
                        {heading} <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "0.9rem" }}>({items.length})</span>
                    </h3>
                    {onDownload && (
                        <button className="btn btn-navy btn-sm" onClick={onDownload} disabled={items.length === 0}>
                            Download CSV
                        </button>
                    )}
                </div>
            )}
            {items.length === 0 && <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>No submissions yet.</p>}
            <div style={{ display: "grid", gap: "1rem" }}>
                {items.map(item => (
                    <RecordCard
                        key={item.id}
                        item={item}
                        columns={columns}
                        fields={fields}
                        statusOptions={statusOptions}
                        editing={editingId === item.id}
                        busy={busy}
                        updatingId={updatingId}
                        onEdit={onEdit}
                        onCancelEdit={onCancelEdit}
                        onSave={formData => onSave(item, formData)}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}

export default function SubmissionSection({ title, path, columns, fields, statusOptions, groupByField, groupOptions }) {
    const { data, loading, error } = useFirebaseCollection(`submissions/${path}`);
    const sorted = (data || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const [updatingId, setUpdatingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState(null);

    const handleStatusChange = async (item, status) => {
        setUpdatingId(item.id);
        setActionError(null);
        try {
            await updateSubmissionStatus(path, item.id, status);
        } catch (err) {
            setActionError(err.message || "Could not update this submission.");
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

    const exportColumns = [
        ...columns,
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Submitted", render: v => (v ? new Date(v).toLocaleString("en-US") : "") },
    ];

    const downloadGroup = (label, items) => {
        downloadCsv(`${path}-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`, exportColumns, items);
    };

    const listProps = {
        columns, fields, statusOptions, editingId, busy, updatingId,
        onEdit: id => { setEditingId(id); setCreating(false); },
        onCancelEdit: () => setEditingId(null),
        onSave: handleUpdate,
        onStatusChange: handleStatusChange,
        onDelete: handleDelete,
    };

    let groups = null;
    if (groupByField) {
        const values = groupOptions || [...new Set(sorted.map(item => item[groupByField]).filter(Boolean))];
        groups = values.map(value => ({
            label: value,
            items: sorted.filter(item => item[groupByField] === value),
        }));
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.15rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>
                    {title} <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
                </h2>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                    {!groupByField && (
                        <button className="btn btn-navy btn-sm" onClick={() => downloadGroup("all", sorted)} disabled={sorted.length === 0}>
                            Download CSV
                        </button>
                    )}
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
            {actionError && <p style={{ color: "var(--orange)", marginBottom: "1rem" }}>{actionError}</p>}

            {!loading && !error && groups && (
                groups.map(group => (
                    <RecordList
                        key={group.label}
                        heading={group.label}
                        items={group.items}
                        onDownload={() => downloadGroup(group.label, group.items)}
                        {...listProps}
                    />
                ))
            )}

            {!loading && !error && !groups && (
                <RecordList heading={null} items={sorted} {...listProps} />
            )}
        </div>
    );
}
