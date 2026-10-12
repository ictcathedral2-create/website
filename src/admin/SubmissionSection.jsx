import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { updateSubmissionStatus, createSubmission, updateSubmissionFields, deleteSubmission } from "./adminDb";
import { downloadCsv } from "./csvExport";
import { EmptyState, Icon, Notice, PageHeader, StatusPill, formatWhen, statusTone, useToast } from "./ui";

const LONG_TEXT_PREVIEW = 220;

function emptyFormData(fields) {
    const data = {};
    fields.forEach(f => { data[f.key] = f.type === "checkbox" ? false : (f.type === "select" && f.options?.length ? f.options[0] : ""); });
    return data;
}

function RecordForm({ title, fields, initial, onCancel, onSave }) {
    const [formData, setFormData] = useState(initial);
    const [saving, setSaving] = useState(false);
    const setField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const save = async () => {
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="adm-form">
            {title && <div className="adm-form-title">{title}</div>}
            <div className="adm-form-grid">
                {fields.map(f => (
                    <div key={f.key} className={`form-group${f.type === "textarea" || f.type === "checkbox" ? " full" : ""}`}>
                        <label className="form-label">{f.label}</label>
                        {f.type === "textarea" ? (
                            <textarea className="form-textarea" value={formData[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)} />
                        ) : f.type === "checkbox" ? (
                            <label className="adm-check">
                                <input type="checkbox" checked={Boolean(formData[f.key])} onChange={e => setField(f.key, e.target.checked)} />
                                {f.helpText || "Enabled"}
                            </label>
                        ) : f.type === "select" ? (
                            <select className="form-select" value={formData[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)}>
                                {/* Keep a stored value visible even if it is no longer one of the options. */}
                                {formData[f.key] && !f.options.includes(formData[f.key]) && <option>{formData[f.key]}</option>}
                                {f.options.map(opt => <option key={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input className="form-input" type={f.type === "number" ? "number" : "text"} value={formData[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)} />
                        )}
                    </div>
                ))}
            </div>
            <div className="adm-form-actions">
                <button className="adm-btn gold" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
                <button className="adm-btn" disabled={saving} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

function LongText({ text }) {
    const [expanded, setExpanded] = useState(false);
    const value = String(text || "");
    if (!value) return "—";
    if (value.length <= LONG_TEXT_PREVIEW || expanded) {
        return (
            <span className="adm-longtext">
                {value}
                {expanded && <button className="adm-more" onClick={() => setExpanded(false)}>Show less</button>}
            </span>
        );
    }
    return (
        <span className="adm-longtext">
            {value.slice(0, LONG_TEXT_PREVIEW).trimEnd()}…
            <button className="adm-more" onClick={() => setExpanded(true)}>Read more</button>
        </span>
    );
}

const cellContent = (col, item) => {
    if (col.long) return <LongText text={item[col.key]} />;
    const value = col.render ? col.render(item[col.key], item) : item[col.key];
    return value === "" || value === null || value === undefined ? "—" : value;
};

function RecordCard({ item, section, onStatusChange, onEdit, onDelete, updating }) {
    const [titleCol, ...rest] = section.columns;
    return (
        <div className="adm-card adm-record">
            <div className="adm-record-head">
                <div>
                    <div className="adm-record-title">{cellContent(titleCol, item)}</div>
                    <div className="adm-record-meta">{item.createdAt ? `Submitted ${formatWhen(item.createdAt)}` : "Added by an admin"}</div>
                </div>
                <StatusPill status={item.status} />
            </div>
            <div className="adm-fields">
                {rest.map(col => (
                    <div key={col.key} className={`adm-field${col.long ? " wide" : ""}`}>
                        <div className="adm-field-label">{col.label}</div>
                        <div className="adm-field-value">{cellContent(col, item)}</div>
                    </div>
                ))}
            </div>
            <div className="adm-record-foot">
                <div className="adm-status-set" role="group" aria-label="Set status">
                    <span>Mark as</span>
                    {section.statusOptions.map(s => (
                        <button
                            key={s}
                            className={`adm-pill tone-${statusTone(s)}${item.status === s ? " selected" : ""}`}
                            aria-pressed={item.status === s}
                            disabled={updating || item.status === s}
                            onClick={() => onStatusChange(item, s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="adm-actions">
                    <button className="adm-btn sm ghost" onClick={() => onEdit(item.id)}><Icon name="edit" size={14} /> Edit</button>
                    <button className="adm-btn sm ghost danger" onClick={() => onDelete(item)}><Icon name="trash" size={14} /> Delete</button>
                </div>
            </div>
        </div>
    );
}

const searchText = (item, columns) => columns.map(c => {
    const raw = c.csv ? c.csv(item[c.key], item) : c.render ? c.render(item[c.key], item) : item[c.key];
    return typeof raw === "object" ? item[c.key] : raw;
}).join(" ").toLowerCase();

export default function SubmissionSection({ section }) {
    const { path, label, columns, fields, statusOptions, groupByField, groupOptions, description } = section;
    const { data, loading, error } = useFirebaseCollection(`submissions/${path}`);
    const { run } = useToast();
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const sorted = (data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const counts = Object.fromEntries(statusOptions.map(s => [s, sorted.filter(item => item.status === s).length]));
    const q = query.trim().toLowerCase();
    const visible = sorted.filter(item =>
        (statusFilter === "all" || item.status === statusFilter) && (!q || searchText(item, columns).includes(q))
    );

    const handleStatusChange = async (item, status) => {
        setUpdatingId(item.id);
        await run(() => updateSubmissionStatus(path, item.id, status), `Marked as ${status}`);
        setUpdatingId(null);
    };

    const handleCreate = async formData => {
        const ok = await run(() => createSubmission(path, { ...formData, status: statusOptions[0] }), "Added");
        if (ok) setCreating(false);
    };

    const handleUpdate = async (item, formData) => {
        const merged = { ...item, ...formData };
        delete merged.id;
        const ok = await run(() => updateSubmissionFields(path, item.id, merged), "Changes saved");
        if (ok) setEditingId(null);
    };

    const handleDelete = async item => {
        if (!window.confirm("Delete this record permanently? This cannot be undone.")) return;
        await run(() => deleteSubmission(path, item.id), "Deleted");
    };

    const exportColumns = [
        ...columns,
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Submitted", csv: v => (v ? new Date(v).toLocaleString("en-GB") : "") },
    ];
    const download = (suffix, items) => {
        downloadCsv(`${path}-${suffix.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`, exportColumns, items);
    };

    const groups = groupByField
        ? (groupOptions || [...new Set(sorted.map(item => item[groupByField]).filter(Boolean))])
            .map(value => ({ label: value, items: visible.filter(item => item[groupByField] === value) }))
            .filter(group => group.items.length || (!q && statusFilter === "all"))
        : [{ label: null, items: visible }];

    const renderItem = item => editingId === item.id ? (
        <RecordForm
            key={item.id}
            title="Edit record"
            fields={fields}
            initial={fields.reduce((acc, f) => ({ ...acc, [f.key]: item[f.key] ?? (f.type === "checkbox" ? false : "") }), {})}
            onCancel={() => setEditingId(null)}
            onSave={formData => handleUpdate(item, formData)}
        />
    ) : (
        <RecordCard
            key={item.id}
            item={item}
            section={section}
            updating={updatingId === item.id}
            onStatusChange={handleStatusChange}
            onEdit={id => { setEditingId(id); setCreating(false); }}
            onDelete={handleDelete}
        />
    );

    return (
        <div>
            <PageHeader eyebrow={section.group} title={label} count={sorted.length} subtitle={description}>
                <button className="adm-btn" onClick={() => download("all", visible)} disabled={!visible.length}>
                    <Icon name="download" size={15} /> Export CSV
                </button>
                <button className="adm-btn primary" onClick={() => { setCreating(!creating); setEditingId(null); }}>
                    <Icon name={creating ? "close" : "plus"} size={15} /> {creating ? "Cancel" : "Add new"}
                </button>
            </PageHeader>

            {creating && (
                <RecordForm title={`New ${label.toLowerCase()} record`} fields={fields} initial={emptyFormData(fields)} onCancel={() => setCreating(false)} onSave={handleCreate} />
            )}

            <div className="adm-toolbar">
                <div className="adm-search">
                    <Icon name="search" size={16} />
                    <input type="search" placeholder={`Search ${label.toLowerCase()}…`} value={query} onChange={e => setQuery(e.target.value)} aria-label={`Search ${label}`} />
                </div>
                <div className="adm-filters" role="group" aria-label="Filter by status">
                    {["all", ...statusOptions].map(s => (
                        <button key={s} className={`adm-filter${statusFilter === s ? " active" : ""}`} aria-pressed={statusFilter === s} onClick={() => setStatusFilter(s)}>
                            {s}<span>{s === "all" ? sorted.length : counts[s]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && error && <Notice tone="error">Couldn't load this data. You may not have permission, or the connection dropped. Try refreshing.</Notice>}

            {!loading && !error && sorted.length === 0 && (
                <EmptyState icon="inbox" title="Nothing here yet">New submissions from the website will appear here automatically.</EmptyState>
            )}
            {!loading && !error && sorted.length > 0 && visible.length === 0 && (
                <EmptyState icon="search" title="No matches">Try a different search or status filter.</EmptyState>
            )}

            {!loading && !error && visible.length > 0 && groups.map(group => (
                <div key={group.label || "all"}>
                    {group.label && (
                        <div className="adm-group-title">
                            <h3>{group.label}<small>{group.items.length}</small></h3>
                            <button className="adm-btn sm" onClick={() => download(group.label, group.items)} disabled={!group.items.length}>
                                <Icon name="download" size={14} /> CSV
                            </button>
                        </div>
                    )}
                    {group.items.length === 0
                        ? <div className="adm-row-sub" style={{ marginBottom: "0.5rem" }}>None yet.</div>
                        : <div className="adm-list">{group.items.map(renderItem)}</div>}
                </div>
            ))}
        </div>
    );
}
