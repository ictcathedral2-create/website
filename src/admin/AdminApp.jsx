import { styles } from "../App";
import { adminStyles } from "./adminStyles";
import { useAuth } from "../hooks/useAuth";
import { useAdminRole } from "../hooks/useAdminRole";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

function AdminGate({ user, onLogout }) {
    const role = useAdminRole(user.uid);

    if (role === undefined) {
        return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-400)" }}>Checking access…</div>;
    }
    if (!role) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", justifyContent: "center", color: "var(--gray-600)", padding: "2rem", textAlign: "center" }}>
                <p>You do not have permission to use the admin dashboard.</p>
                <button className="btn btn-navy" onClick={onLogout}>Log Out</button>
            </div>
        );
    }
    return <AdminDashboard user={user} onLogout={onLogout} />;
}

export default function AdminApp() {
    const { user, loading, login, logout } = useAuth();

    return (
        <>
            <style>{styles}</style>
            <style>{adminStyles}</style>
            {loading ? (
                <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-400)" }}>
                    Loading…
                </div>
            ) : !user ? (
                <AdminLogin onLogin={login} />
            ) : (
                <AdminGate user={user} onLogout={logout} />
            )}
        </>
    );
}
