import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createGalleryItem, updateGalleryItem, deleteGalleryItem } from "./adminDb";

const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.82;

// Resizes/compresses an image file in the browser and returns a JPEG data URI,
// so uploads stay small enough to store directly in Firebase (no extra
// storage service/account needed).
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height && width > MAX_DIMENSION) {
                    height = Math.round(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                } else if (height > MAX_DIMENSION) {
                    width = Math.round(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
            };
            img.onerror = () => reject(new Error("Couldn't read that image file."));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Couldn't read that file."));
        reader.readAsDataURL(file);
    });
}

export default function GalleryManager() {
    const { data, loading, error } = useFirebaseCollection("gallery");
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
            await createGalleryItem({ imageData, caption: "" });
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
            await updateGalleryItem(item.id, { ...rest, caption });
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async item => {
        if (!window.confirm("Delete this image permanently?")) return;
        setBusyId(item.id);
        try {
            await deleteGalleryItem(item.id);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
                    Gallery / Posters <span style={{ color: "var(--gray-400)", fontWeight: 500, fontSize: "1rem" }}>({sorted.length})</span>
                </h2>
                <label className="btn btn-gold btn-sm" style={{ cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? "Uploading..." : "+ Upload Image"}
                    <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: "none" }} />
                </label>
            </div>

            <p style={{ color: "var(--gray-400)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Images shown here rotate automatically on the Home page — upload event posters ahead of time, and photos after the event happens.
            </p>

            {uploadError && <p style={{ color: "var(--orange)", fontSize: "0.85rem", marginBottom: "1rem" }}>{uploadError}</p>}
            {loading && <p style={{ color: "var(--gray-400)" }}>Loading…</p>}
            {!loading && error && <p style={{ color: "var(--orange)" }}>Couldn't load the gallery. Check Firebase read permissions.</p>}
            {!loading && !error && sorted.length === 0 && <p style={{ color: "var(--gray-400)" }}>No images yet. Click "+ Upload Image" to add the first one.</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
                {sorted.map(item => (
                    <div key={item.id} className="card" style={{ overflow: "hidden" }}>
                        <img src={item.imageData} alt={item.caption || "Gallery image"} style={{ width: "100%", aspectRatio: "3 / 4", objectFit: "cover", display: "block" }} />
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
