import { useState } from "react";

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
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "white", margin: "0 auto 1rem" }}>✝</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--navy)" }}>Admin Dashboard</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--gray-400)", marginTop: 4 }}>ACK St Pauls Youths</div>
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                        className="form-input"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
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
