// Shared Firebase Admin setup for API functions. Vercel doesn't deploy files
// under an underscore-prefixed folder as functions, so this is only a helper.
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";

export function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// A legacy admin entry is a bare `true`, treated as super (see manage-admin.js).
export function roleOf(value) {
  if (value === true) return "super";
  if (value && typeof value === "object") return value.role || "admin";
  return null;
}

export async function requireAdmin(auth, db, req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "Missing auth token.", status: 401 };

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return { error: "Invalid or expired session. Please log in again.", status: 401 };
  }

  const snap = await db.ref(`admins/${decoded.uid}`).once("value");
  if (!roleOf(snap.val())) return { error: "Admin access is required.", status: 403 };
  return { uid: decoded.uid, email: decoded.email || "" };
}
