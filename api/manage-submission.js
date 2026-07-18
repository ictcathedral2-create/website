import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const PUBLIC_MIRRORS = {
  testimonies: "publicTestimonies",
  businessListings: "publicBusinessListings",
  jobPostings: "publicJobPostings",
  jobSeekers: "publicJobSeekers",
  wantedPosts: "publicWantedPosts",
};

function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

function isAdmin(value) {
  return value === true || (value && typeof value === "object" && value.role);
}

async function requireAdmin(auth, db, req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { error: "Missing auth token.", status: 401 };

  try {
    const decoded = await auth.verifyIdToken(token);
    const admin = await db.ref(`admins/${decoded.uid}`).once("value");
    if (!isAdmin(admin.val())) return { error: "Admin access is required.", status: 403 };
    return { uid: decoded.uid };
  } catch {
    return { error: "Invalid or expired session.", status: 401 };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DATABASE_URL) {
    return res.status(500).json({ error: "Missing Firebase server configuration." });
  }

  let auth, db;
  try {
    const app = initFirebase();
    auth = getAuth(app);
    db = getDatabase(app);
  } catch {
    return res.status(500).json({ error: "Firebase server initialization failed." });
  }

  const caller = await requireAdmin(auth, db, req);
  if (caller.error) return res.status(caller.status).json({ error: caller.error });

  const { collection, id, status } = req.body || {};
  if (!collection || !id || !status) return res.status(400).json({ error: "Collection, record ID, and status are required." });

  try {
    const recordRef = db.ref(`submissions/${collection}/${id}`);
    const snapshot = await recordRef.once("value");
    const record = snapshot.val();
    if (!record) return res.status(404).json({ error: "Submission not found." });

    const updates = { [`submissions/${collection}/${id}/status`]: status };
    const publicPath = PUBLIC_MIRRORS[collection];
    if (publicPath) {
      updates[`${publicPath}/${id}`] = status === "approved"
        ? { ...record, status: "approved" }
        : null;
    }
    await db.ref().update(updates);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not update the submission." });
  }
}
