import { useState } from "react";
import logo from "../assets/logo.png";

export default function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await onLogin(email, password);
        } catch {
            setError("Invalid email or password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--gold-dark) 100%)",
                padding: "2rem",
            }}
        >
            <div style={{ background: "white", borderRadius: 20, padding: "3rem 2.5rem", maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <img src={logo} alt="ACK St Pauls crest" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", display: "block", margin: "0 auto 1rem", boxShadow: "0 4px 14px rgba(14,32,68,0.18)" }} />
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>Admin Dashboard</h1>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--gray-400)", marginTop: 8 }}>ACK St Pauls Youths</div>
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="admin-email">Email</label>
                    <input
                        id="admin-email"
                        autoComplete="username"
                        className="form-input"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="admin-password">Password</label>
                    <input
                        id="admin-password"
                        autoComplete="current-password"
                        className="form-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    />
                </div>
                {error && <p style={{ color: "var(--orange)", fontSize: "0.8rem", marginBottom: 8 }}>{error}</p>}
                <button className="btn btn-gold" style={{ width: "100%", justifyContent: "center" }} disabled={submitting} onClick={handleSubmit}>
                    {submitting ? "Signing in..." : "Sign In"}
                </button>
            </div>
        </div>
    );
}
