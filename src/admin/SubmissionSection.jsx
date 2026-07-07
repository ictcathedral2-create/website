import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { updateSubmissionStatus } from "./adminDb";

export default function SubmissionSection({ title, path, columns, statusOptions }) {
    const { data, loading, error } = useFirebaseCollection(`submissions/${path}`);
    const sorted = (data || []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const [updatingId, setUpdatingId] = useState(null);

    const handleStatusChange = async (item, status) => {
        setUpdatingId(item.id);
        try {
            await updateSubmissionStatus(path, item.id, status, item);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--navy)", marginBottom: "1.5rem" }}>
                {title} <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
            </h2>
            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load this data. Check Firebase read permissions.</p>}
            {!loading && !error && sorted.length === 0 && <p style={{ color: "var(--gray-400)" }}>No submissions yet.</p>}
            <div style={{ display: "grid", gap: "1rem" }}>
                {sorted.map(item => (
                    <div key={item.id} className="card" style={{ padding: "1.5rem" }}>
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
                    </div>
                ))}
            </div>
        </div>
    );
}
