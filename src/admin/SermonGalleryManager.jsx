import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createSermonGalleryItem, updateSermonGalleryItem, deleteSermonGalleryItem } from "./adminDb";
import { compressImage } from "../utils/fileToDataUri";

export default function SermonGalleryManager() {
    const { data, loading, error } = useFirebaseCollection("sermonGallery");
    const sorted = (data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [editingCaption, setEditingCaption] = useState({});
    const [busyId, setBusyId] = useState(null);

    const handleFileChange = async e => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setUploadError("Please choose an image file.");
            return;
        }
        setUploading(true);
        setUploadError(null);
        try {
            const imageData = await compressImage(file);
            await createSermonGalleryItem({ imageData, caption: "" });
        } catch (err) {
            setUploadError(err.message || "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const saveCaption = async item => {
        const caption = editingCaption[item.id] ?? item.caption ?? "";
        setBusyId(item.id);
        try {
            const rest = { ...item };
            delete rest.id;
            await updateSermonGalleryItem(item.id, { ...rest, caption });
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async item => {
        if (!window.confirm("Delete this image permanently?")) return;
        setBusyId(item.id);
        try {
            await deleteSermonGalleryItem(item.id);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2.15rem", fontWeight: 700, lineHeight: 1, color: "var(--navy)", margin: 0 }}>
                    Sermons Gallery <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
                </h2>
                <label className="btn btn-gold btn-sm" style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? "Uploading..." : "+ Upload Image"}
                    <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: "none" }} />
                </label>
            </div>

            <p style={{ color: "var(--gray-400)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Images shown here appear in the Gallery tab of the Sermons page — photos from services, preaching moments, and worship.
            </p>

            {uploadError && <p style={{ color: "var(--orange)", fontSize: "0.85rem", marginBottom: "1rem" }}>{uploadError}</p>}
            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load the gallery. Check Firebase read permissions.</p>}
            {!loading && !error && sorted.length === 0 && <p style={{ color: "var(--gray-400)" }}>No images yet. Click "+ Upload Image" to add the first one.</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
                {sorted.map(item => (
                    <div key={item.id} className="card" style={{ overflow: "hidden" }}>
                        <img src={item.imageData} alt={item.caption || "Sermon gallery image"} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                        <div style={{ padding: "1rem" }}>
                            <input
                                className="form-input"
                                placeholder="Caption (optional)"
                                style={{ fontSize: "0.85rem", padding: "0.6rem 0.8rem" }}
                                value={editingCaption[item.id] ?? item.caption ?? ""}
                                onChange={e => setEditingCaption(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onBlur={() => saveCaption(item)}
                            />
                            <button
                                className="btn btn-sm"
                                style={{ background: "rgba(224,115,48,0.12)", color: "var(--orange)", width: "100%", justifyContent: "center", marginTop: "0.75rem" }}
                                disabled={busyId === item.id}
                                onClick={() => handleDelete(item)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
