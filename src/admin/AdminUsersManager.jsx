import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createAdmin, updateAdminRole, resetAdminPassword, deleteAdmin } from "./adminUsersApi";

function randomPassword() {
    return Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5).toUpperCase() + "!2";
}

function displayRole(item) {
    // Legacy `true` entries lose their value when spread into an object by
    // useFirebaseCollection, leaving no `role`/`email` — treat as super.
    return item.role || "super";
}

function NewAdminForm({ onCancel, onCreated }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(randomPassword());
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
        try {
            await createAdmin(email.trim(), password, role);
            onCreated();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ padding: "1.25rem", background: "var(--cream)", borderRadius: 12, marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gap: "0.85rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="newadmin@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Temporary Password</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
                        <button className="btn btn-navy btn-sm" onClick={() => setPassword(randomPassword())}>New</button>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 4 }}>
                        Share this with the new admin directly — they can log in with it right away.
                    </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Role</label>
                    <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="admin">Admin</option>
                        <option value="super">Super User</option>
                    </select>
                </div>
            </div>
            {error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginTop: 10 }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
                <button className="btn btn-gold btn-sm" disabled={busy} onClick={handleCreate}>
                    {busy ? "Creating..." : "Create Admin"}
                </button>
                <button className="btn btn-navy btn-sm" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

function AdminRow({ item, currentUid }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [resetting, setResetting] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const role = displayRole(item);
    const isSelf = item.id === currentUid;

    // The admins list is a realtime subscription, so a successful call updates
    // the UI on its own — no manual refetch needed here.
    const run = async fn => {
        setBusy(true);
        setError(null);
        try {
            await fn();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleToggleRole = () => run(() => updateAdminRole(item.id, role === "super" ? "admin" : "super"));
    const handleDelete = () => {
        if (!window.confirm(`Remove ${item.email || "this admin"}? They'll immediately lose access.`)) return;
        run(() => deleteAdmin(item.id));
    };
    const handleResetPassword = () => {
        if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
        run(async () => { await resetAdminPassword(item.id, newPassword); setResetting(false); setNewPassword(""); });
    };

    return (
        <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                <div>
                    <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.95rem" }}>
                        {item.email || "—"} {isSelf && <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "0.78rem" }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--gray-400)", marginTop: 2 }}>
                        {item.addedAt ? `Added ${new Date(item.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Original admin account"}
                    </div>
                </div>
                <span style={{ background: role === "super" ? "rgba(201,168,76,0.15)" : "var(--gray-100)", color: role === "super" ? "var(--gold-dark)" : "var(--gray-600)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 20 }}>
                    {role === "super" ? "Super User" : "Admin"}
                </span>
            </div>

            {error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginTop: 10 }}>{error}</p>}

            {resetting && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
                    <input className="form-input" placeholder="New password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <button className="btn btn-gold btn-sm" disabled={busy} onClick={handleResetPassword}>Set</button>
                    <button className="btn btn-navy btn-sm" onClick={() => { setResetting(false); setNewPassword(""); }}>Cancel</button>
                </div>
            )}

            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.85rem", flexWrap: "wrap", borderTop: "1px solid var(--gray-200)", paddingTop: "0.85rem" }}>
                <button className="btn btn-navy btn-sm" disabled={busy} onClick={handleToggleRole}>
                    {role === "super" ? "Make Admin" : "Make Super User"}
                </button>
                <button className="btn btn-navy btn-sm" disabled={busy || resetting} onClick={() => setResetting(true)}>Reset Password</button>
                {!isSelf && (
                    <button className="btn btn-sm" style={{ background: "rgba(224,115,48,0.12)", color: "var(--orange)" }} disabled={busy} onClick={handleDelete}>
                        Remove Admin
                    </button>
                )}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.15rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>
                    Admin Users <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({admins.length})</span>
                </h2>
                <button className="btn btn-gold btn-sm" onClick={() => setCreating(!creating)}>
                    {creating ? "Cancel" : "+ Add Admin"}
                </button>
            </div>

            <p style={{ color: "var(--gray-400)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Super users can create, promote/demote, reset passwords for, and remove other admin accounts.
            </p>

            {creating && <NewAdminForm onCancel={() => setCreating(false)} onCreated={() => setCreating(false)} />}

            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load admin accounts. Check Firebase read permissions.</p>}

            <div style={{ display: "grid", gap: "1rem" }}>
                {admins.map(item => (
                    <AdminRow key={item.id} item={item} currentUid={currentUid} />
                ))}
            </div>
        </div>
    );
}
