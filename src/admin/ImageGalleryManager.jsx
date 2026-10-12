import { useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { createImageItem, updateImageItem, deleteImageItem } from "./adminDb";
import { compressImage } from "../utils/fileToDataUri";
import { EmptyState, Icon, Notice, PageHeader, formatWhen, useToast } from "./ui";

// One manager for every admin-curated image collection (Home page posters,
// Sermons page photos). Captions save when the field loses focus.
export default function ImageGalleryManager({ path, title, description, aspect, notifyCategory }) {
    const { data, loading, error } = useFirebaseCollection(path);
    const { run, notify } = useToast();
    const sorted = (data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const [uploading, setUploading] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [captions, setCaptions] = useState({});

    const upload = async fileList => {
        const files = [...(fileList || [])];
        const images = files.filter(f => f.type.startsWith("image/"));
        if (files.length > images.length) notify("Only image files can be uploaded. Other files were skipped.", "error");
        if (!images.length) return;
        setUploading(images.length);
        let done = 0;
        for (const file of images) {
            const ok = await run(async () => {
                const imageData = await compressImage(file);
                await createImageItem(path, { imageData, caption: "" }, notifyCategory);
            });
            if (ok) done += 1;
            setUploading(n => n - 1);
        }
        if (done) notify(`${done} image${done === 1 ? "" : "s"} uploaded`, "ok");
    };

    const saveCaption = async item => {
        const caption = (captions[item.id] ?? item.caption ?? "").trim();
        if (caption === (item.caption || "")) return;
        const rest = { ...item };
        delete rest.id;
        await run(() => updateImageItem(path, item.id, { ...rest, caption }), "Caption saved");
    };

    const handleDelete = async item => {
        if (!window.confirm("Delete this image permanently?")) return;
        await run(() => deleteImageItem(path, item.id), "Image deleted");
    };

    return (
        <div>
            <PageHeader eyebrow="Content" title={title} count={sorted.length} subtitle={description} />

            <label
                className={`adm-dropzone${dragOver ? " over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (!uploading) upload(e.dataTransfer.files); }}
                style={uploading ? { cursor: "progress", opacity: 0.7 } : undefined}
            >
                <Icon name="upload" size={26} />
                {uploading
                    ? <strong>Uploading {uploading} image{uploading === 1 ? "" : "s"}…</strong>
                    : <><strong>Drop images here or click to choose</strong><span>You can pick several at once. Large photos are resized automatically.</span></>}
                <input type="file" accept="image/*" multiple disabled={Boolean(uploading)} style={{ display: "none" }} onChange={e => { upload(e.target.files); e.target.value = ""; }} />
            </label>

            {loading && <div className="adm-loading">Loading…</div>}
            {!loading && error && <Notice tone="error">Couldn't load images. Try refreshing the page.</Notice>}
            {!loading && !error && sorted.length === 0 && <EmptyState icon="image" title="No images yet">Upload the first one above.</EmptyState>}

            <div className="adm-images">
                {sorted.map(item => (
                    <div key={item.id} className="adm-card adm-image">
                        <img src={item.imageData} alt={item.caption || ""} style={{ aspectRatio: aspect }} loading="lazy" />
                        <div className="adm-image-body">
                            <input
                                placeholder="Add a caption (optional)"
                                aria-label="Caption"
                                value={captions[item.id] ?? item.caption ?? ""}
                                onChange={e => setCaptions(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onBlur={() => saveCaption(item)}
                                onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                            />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span className="adm-record-meta">{formatWhen(item.createdAt)}</span>
                                <button className="adm-btn sm ghost danger" onClick={() => handleDelete(item)}><Icon name="trash" size={14} /> Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
