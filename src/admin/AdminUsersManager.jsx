import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createAdmin, updateAdminRole, resetAdminPassword, deleteAdmin } from "./adminUsersApi";
import { Icon, Notice, PageHeader, formatWhen, useToast } from "./ui";

// 12 characters from a cryptographically secure source, avoiding look-alikes (0/O, 1/l/I).
function randomPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint32Array(12));
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
}

function displayRole(item) {
    // Legacy `true` entries lose their value when spread into an object by
    // useFirebaseCollection, leaving no `role`/`email`, so treat as super.
    return item.role || "super";
}

function NewAdminForm({ onCancel, onCreated }) {
    const { run } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(randomPassword);
    const [role, setRole] = useState("admin");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const handleCreate = async () => {
        if (!email.trim() || password.length < 6) {
            setError("Enter an email and a password of at least 6 characters.");
            return;
        }
        setBusy(true);
        setError(null);
        if (await run(() => createAdmin(email.trim(), password, role), `Admin account created for ${email.trim()}`)) onCreated();
        setBusy(false);
    };

    return (
        <div className="adm-form">
            <div className="adm-form-title">New admin account</div>
            <div className="adm-form-grid">
                <div className="form-group">
                    <label className="form-label" htmlFor="na-email">Email</label>
                    <input id="na-email" className="form-input" type="email" placeholder="newadmin@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="na-role">Role</label>
                    <select id="na-role" className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="admin">Admin: manages content and submissions</option>
                        <option value="super">Super admin: can also manage admin accounts</option>
                    </select>
                </div>
                <div className="form-group full">
                    <label className="form-label" htmlFor="na-password">Temporary password</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input id="na-password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} style={{ fontFamily: "monospace" }} />
                        <button type="button" className="adm-btn" onClick={() => setPassword(randomPassword())}>Generate</button>
                        <button type="button" className="adm-btn" onClick={() => navigator.clipboard?.writeText(password)}>Copy</button>
                    </div>
                    <div className="adm-hint">Share this with the new admin privately. They can sign in with it right away.</div>
                </div>
            </div>
            {error && <div style={{ marginTop: "1rem" }}><Notice tone="error">{error}</Notice></div>}
            <div className="adm-form-actions">
                <button className="adm-btn gold" disabled={busy} onClick={handleCreate}>{busy ? "Creating…" : "Create admin"}</button>
                <button className="adm-btn" disabled={busy} onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

function AdminRow({ item, currentUid }) {
    const { run } = useToast();
    const [busy, setBusy] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const role = displayRole(item);
    const isSelf = item.id === currentUid;

    // The admins list is a realtime subscription, so a successful call updates
    // the UI on its own; no manual refetch needed here.
    const act = async (fn, message) => {
        setBusy(true);
        const ok = await run(fn, message);
        setBusy(false);
        return ok;
    };

    const handleToggleRole = () => act(() => updateAdminRole(item.id, role === "super" ? "admin" : "super"), "Role updated");
    const handleDelete = () => {
        if (!window.confirm(`Remove ${item.email || "this admin"}? They'll immediately lose access.`)) return;
        act(() => deleteAdmin(item.id), "Admin removed");
    };
    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            await run(() => { throw new Error("Password must be at least 6 characters."); });
            return;
        }
        if (await act(() => resetAdminPassword(item.id, newPassword), "Password reset")) {
            setResetting(false);
            setNewPassword("");
        }
    };

    return (
        <div className="adm-card adm-record">
            <div className="adm-record-head">
                <div>
                    <div className="adm-record-title">{item.email || "Original admin account"} {isSelf && <span className="adm-record-meta">(you)</span>}</div>
                    <div className="adm-record-meta">{item.addedAt ? `Added ${formatWhen(item.addedAt)}` : "Created during setup"}</div>
                </div>
                <span className={`adm-pill ${role === "super" ? "tone-warn" : "tone-info"}`}>{role === "super" ? "Super admin" : "Admin"}</span>
            </div>

            {resetting && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
                    <input className="form-input" style={{ flex: 1, minWidth: 200, fontFamily: "monospace" }} placeholder="New password (min 6 characters)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <button className="adm-btn" onClick={() => setNewPassword(randomPassword())}>Generate</button>
                    <button className="adm-btn gold" disabled={busy} onClick={handleResetPassword}>Set password</button>
                    <button className="adm-btn" onClick={() => { setResetting(false); setNewPassword(""); }}>Cancel</button>
                </div>
            )}

            <div className="adm-record-foot">
                <span className="adm-record-meta">{role === "super" ? "Can manage admin accounts" : "Can manage content and submissions"}</span>
                <div className="adm-actions">
                    {!isSelf && (
                        <button className="adm-btn sm ghost" disabled={busy} onClick={handleToggleRole}>
                            {role === "super" ? "Make regular admin" : "Make super admin"}
                        </button>
                    )}
                    <button className="adm-btn sm ghost" disabled={busy || resetting} onClick={() => setResetting(true)}>Reset password</button>
                    {!isSelf && (
                        <button className="adm-btn sm ghost danger" disabled={busy} onClick={handleDelete}><Icon name="trash" size={14} /> Remove</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminUsersManager({ currentUid }) {
    const { data, loading, error } = useFirebaseCollection("admins");
    const admins = (data || []).slice().sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    const [creating, setCreating] = useState(false);

    return (
        <div>
            <PageHeader
                eyebrow="Settings"
                title="Admin Users"
                count={admins.length}
                subtitle="Super admins can add, promote, reset passwords for and remove other admin accounts. Only super admins can see this page."
            >
                <button className="adm-btn primary" onClick={() => setCreating(!creating)}>
                    <Icon name={creating ? "close" : "plus"} size={15} /> {creating ? "Cancel" : "Add admin"}
                </button>
            </PageHeader>

            {creating && <NewAdminForm onCancel={() => setCreating(false)} onCreated={() => setCreating(false)} />}

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && error && <Notice tone="error">Couldn't load admin accounts. Try refreshing the page.</Notice>}

            <div className="adm-list">
                {admins.map(item => <AdminRow key={item.id} item={item} currentUid={currentUid} />)}
            </div>
        </div>
    );
}
