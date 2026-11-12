import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { collectContacts, formatPhone, normalizePhone, splitName } from "../utils/sms";
import { createSmsMember, updateSmsMember, deleteSmsMember, importSmsMembers, setSmsOptOut } from "./adminDb";
import { EmptyState, Icon, Notice, PageHeader, useToast } from "./ui";

const EMPTY_FORM = { firstName: "", lastName: "", phone: "" };

// Reads pasted lines such as "Mary Wanjiru, 0712345678" or a CSV/Excel copy
// (name and phone in any column order). Header rows and blank lines are ignored.
function parseImport(text, existingPhones) {
    const valid = [];
    const problems = [];
    const seen = new Set(existingPhones);
    text.split(/\r?\n/).forEach((line, index) => {
        const cells = line.split(/[,\t;]/).map(c => c.replace(/^"|"$/g, "").trim()).filter(Boolean);
        if (!cells.length) return;
        const phoneCell = cells.find(c => normalizePhone(c));
        if (!phoneCell) {
            if (index > 0 || !/name|phone/i.test(line)) problems.push(`Line ${index + 1}: no valid phone number (“${line.trim()}”)`);
            return;
        }
        const phone = normalizePhone(phoneCell);
        if (seen.has(phone)) return;
        seen.add(phone);
        const nameCells = cells.filter(c => c !== phoneCell);
        const { firstName, lastName } = nameCells.length >= 2 ? { firstName: nameCells[0], lastName: nameCells.slice(1).join(" ") } : splitName(nameCells[0]);
        valid.push({ firstName, lastName, phone });
    });
    return { valid, problems };
}

function MemberForm({ heading, initial, onCancel, onSave }) {
    const [form, setForm] = useState(initial);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const save = async () => {
        const phone = normalizePhone(form.phone);
        if (!form.firstName.trim()) return setError("Enter the member's first name.");
        if (!phone) return setError("Enter a valid Kenyan mobile number, e.g. 0712 345 678.");
        setError(null);
        setSaving(true);
        await onSave({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone });
        setSaving(false);
    };

    return (
        <div className="adm-form">
            <div className="adm-form-title">{heading}</div>
            <div className="adm-form-grid">
                <div className="form-group">
                    <label className="form-label" htmlFor="sm-first">First name</label>
                    <input id="sm-first" className="form-input" value={form.firstName} onChange={e => setField("firstName", e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="sm-last">Last name</label>
                    <input id="sm-last" className="form-input" value={form.lastName} onChange={e => setField("lastName", e.target.value)} />
                </div>
                <div className="form-group full">
                    <label className="form-label" htmlFor="sm-phone">Phone</label>
                    <input id="sm-phone" className="form-input" type="tel" placeholder="0712 345 678" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                </div>
            </div>
            {error && <div style={{ marginTop: "1rem" }}><Notice tone="error">{error}</Notice></div>}
            <div className="adm-form-actions">
                <button className="adm-btn gold" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
                <button className="adm-btn" disabled={saving} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

function ImportForm({ existingPhones, onCancel, onImport }) {
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const { valid, problems } = parseImport(text, existingPhones);

    const save = async () => {
        setSaving(true);
        await onImport(valid);
        setSaving(false);
    };

    return (
        <div className="adm-form">
            <div className="adm-form-title">Import members</div>
            <div className="adm-hint" style={{ marginBottom: "0.6rem" }}>
                Paste one member per line: name and phone separated by a comma, or copy the two columns straight from Excel.
                Numbers already on the list are skipped.
            </div>
            <textarea className="form-textarea" style={{ minHeight: 160 }} placeholder={"Mary Wanjiru, 0712345678\nJohn Mwangi, 0722 111 222"} value={text} onChange={e => setText(e.target.value)} aria-label="Members to import" />
            {text.trim() && (
                <div className="adm-hint">
                    <strong>{valid.length}</strong> new member{valid.length === 1 ? "" : "s"} ready to add
                    {valid.slice(0, 3).map(p => <div key={p.phone}>{`${p.firstName} ${p.lastName}`.trim() || "No name"} · {formatPhone(p.phone)}</div>)}
                    {valid.length > 3 && <div>…and {valid.length - 3} more</div>}
                </div>
            )}
            {problems.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                    <Notice tone="warn">
                        These lines will be skipped:
                        <ul>{problems.slice(0, 8).map(p => <li key={p}>{p}</li>)}</ul>
                        {problems.length > 8 && `…and ${problems.length - 8} more`}
                    </Notice>
                </div>
            )}
            <div className="adm-form-actions">
                <button className="adm-btn gold" disabled={saving || !valid.length} onClick={save}>{saving ? "Importing…" : `Add ${valid.length || ""} member${valid.length === 1 ? "" : "s"}`}</button>
                <button className="adm-btn" disabled={saving} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

export default function SmsMembersManager({ open }) {
    const registrations = useFirebaseCollection("submissions/joinUsRegistrations");
    const members = useFirebaseCollection("smsMembers");
    const optOutList = useFirebaseCollection("smsOptOuts");
    const { run } = useToast();
    const [mode, setMode] = useState(null); // "add" | "import" | null
    const [editingId, setEditingId] = useState(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const loading = registrations.loading || members.loading || optOutList.loading;
    const loadError = registrations.error || members.error || optOutList.error;
    const optOuts = Object.fromEntries((optOutList.data || []).map(o => [o.id, true]));
    const memberById = Object.fromEntries((members.data || []).map(m => [m.id, m]));
    const { contacts, invalid } = collectContacts(registrations.data || [], members.data || []);
    const optedOutCount = contacts.filter(c => optOuts[c.phone]).length;

    const counts = {
        all: contacts.length,
        added: contacts.filter(c => c.source === "added").length,
        signup: contacts.filter(c => c.source === "signup").length,
        optedOut: optedOutCount,
    };
    const q = query.trim().toLowerCase();
    const visible = contacts
        .filter(c => filter === "all" || (filter === "optedOut" ? optOuts[c.phone] : c.source === filter))
        .filter(c => !q || `${c.firstName} ${c.lastName} ${c.phone} ${formatPhone(c.phone)}`.toLowerCase().includes(q))
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    const handleCreate = async form => {
        if (contacts.some(c => c.phone === form.phone)) return run(() => Promise.reject(new Error("That number is already on the list.")));
        if (await run(() => createSmsMember(form), "Member added")) setMode(null);
    };
    const handleUpdate = async (id, form) => {
        if (await run(() => updateSmsMember(id, { ...form, createdAt: memberById[id]?.createdAt || Date.now() }), "Member saved")) setEditingId(null);
    };
    const handleDelete = async contact => {
        if (!window.confirm(`Remove ${`${contact.firstName} ${contact.lastName}`.trim() || formatPhone(contact.phone)} from the SMS list?`)) return;
        await run(() => deleteSmsMember(contact.id), "Member removed");
    };
    const handleImport = async people => {
        if (await run(() => importSmsMembers(people), `${people.length} member${people.length === 1 ? "" : "s"} added`)) setMode(null);
    };
    const toggleOptOut = contact => {
        const nowOut = !optOuts[contact.phone];
        run(() => setSmsOptOut(contact.phone, nowOut), nowOut ? "Opted out: they won't receive SMS" : "They'll receive SMS again");
    };

    return (
        <div>
            <PageHeader eyebrow="People" title="SMS Members" count={contacts.length} subtitle="Everyone who receives SMS: Membership Sign-ups are included automatically, plus members you add here.">
                <button className="adm-btn" onClick={() => { setMode(mode === "import" ? null : "import"); setEditingId(null); }}><Icon name="upload" size={15} /> Import</button>
                <button className="adm-btn primary" onClick={() => { setMode(mode === "add" ? null : "add"); setEditingId(null); }}><Icon name={mode === "add" ? "close" : "plus"} size={15} /> {mode === "add" ? "Cancel" : "Add member"}</button>
                <button className="adm-btn gold" onClick={() => open("sendSms")}><Icon name="send" size={15} /> Send SMS</button>
            </PageHeader>

            {mode === "add" && <MemberForm heading="New member" initial={EMPTY_FORM} onCancel={() => setMode(null)} onSave={handleCreate} />}
            {mode === "import" && <ImportForm existingPhones={contacts.map(c => c.phone)} onCancel={() => setMode(null)} onImport={handleImport} />}

            {invalid.length > 0 && (
                <Notice tone="warn">
                    {invalid.length} member{invalid.length === 1 ? " has" : "s have"} a missing or invalid phone number and won't receive SMS:{" "}
                    {invalid.slice(0, 5).map(p => `${p.name} (“${p.phone || "none"}”)`).join(", ")}{invalid.length > 5 ? "…" : ""}.
                    Fix sign-ups under Membership Sign-ups.
                </Notice>
            )}

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && loadError && <Notice tone="error">Couldn't load the member list. Check that the database rules allow admins to read smsMembers and smsOptOuts (see docs/sms-setup.md).</Notice>}

            {!loading && !loadError && (
                <>
                    <div className="adm-toolbar">
                        <div className="adm-search">
                            <Icon name="search" size={16} />
                            <input type="search" placeholder="Search name or number…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search members" />
                        </div>
                        <div className="adm-filters">
                            {[["all", "All"], ["signup", "Sign-ups"], ["added", "Added by you"], ["optedOut", "Opted out"]].map(([key, label]) => (
                                <button key={key} className={`adm-filter${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>{label}<span>{counts[key]}</span></button>
                            ))}
                        </div>
                    </div>

                    {contacts.length === 0 && !mode && <EmptyState icon="users" title="No members yet">Add members one by one, or import a list from Excel.</EmptyState>}
                    {contacts.length > 0 && visible.length === 0 && <EmptyState icon="search" title="No matches" />}

                    <div className="adm-card" style={{ padding: visible.length ? "0.4rem 1.25rem" : 0 }}>
                        {visible.map(c => editingId === c.id && c.source === "added" ? (
                            <div key={c.phone} style={{ padding: "0.75rem 0" }}>
                                <MemberForm
                                    heading="Edit member"
                                    initial={{ firstName: c.firstName, lastName: c.lastName, phone: formatPhone(c.phone) }}
                                    onCancel={() => setEditingId(null)}
                                    onSave={form => handleUpdate(c.id, form)}
                                />
                            </div>
                        ) : (
                            <div key={c.phone} className="adm-row" style={{ padding: "0.7rem 0", opacity: optOuts[c.phone] ? 0.55 : 1 }}>
                                <div className="adm-row-main">
                                    <div className="adm-row-title">{`${c.firstName} ${c.lastName}`.trim() || "No name"}</div>
                                    <div className="adm-row-sub">{formatPhone(c.phone)} · {c.source === "signup" ? "Membership sign-up" : "Added by you"}{optOuts[c.phone] ? " · opted out" : ""}</div>
                                </div>
                                <div className="adm-actions">
                                    <button className="adm-btn sm ghost" onClick={() => toggleOptOut(c)}>{optOuts[c.phone] ? "Opt back in" : "Opt out"}</button>
                                    {c.source === "added" && <button className="adm-btn sm ghost" onClick={() => { setEditingId(c.id); setMode(null); }} aria-label="Edit"><Icon name="edit" size={14} /></button>}
                                    {c.source === "added" && <button className="adm-btn sm ghost danger" onClick={() => handleDelete(c)} aria-label="Remove"><Icon name="trash" size={14} /></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
