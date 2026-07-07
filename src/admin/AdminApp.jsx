import { styles } from "../App";
import { useAuth } from "../hooks/useAuth";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminApp() {
    const { user, loading, login, logout } = useAuth();

    return (
        <>
            <style>{styles}</style>
            {loading ? (
                <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-400)" }}>
                    Loading…
                </div>
            ) : !user ? (
                <AdminLogin onLogin={login} />
            ) : (
                <AdminDashboard user={user} onLogout={logout} />
            )}
        </>
    );
}
