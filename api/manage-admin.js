import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// A legacy admin entry is a bare `true` (the original single-admin setup) —
// treated as super so the one existing admin doesn't get locked out when
// this feature ships. New entries are always written as objects with a role.
function roleOf(value) {
  if (value === true) return "super";
  if (value && typeof value === "object") return value.role || "admin";
  return null;
}

async function requireSuper(auth, db, req) {
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
  if (roleOf(snap.val()) !== "super") {
    return { error: "Only a super user can manage admin accounts.", status: 403 };
  }
  return { uid: decoded.uid };
}

async function countSupers(db) {
  const snap = await db.ref("admins").once("value");
  const all = snap.val() || {};
  return Object.values(all).filter(v => roleOf(v) === "super").length;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DATABASE_URL) {
    return res.status(500).json({ error: "Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_DATABASE_URL env vars." });
  }

  let auth, db, caller;
  try {
    const app = initFirebase();
    auth = getAuth(app);
    db = getDatabase(app);
    caller = await requireSuper(auth, db, req);
  } catch (err) {
    return res.status(500).json({ error: `Firebase Admin init failed: ${err.message || err}` });
  }
  if (caller.error) return res.status(caller.status).json({ error: caller.error });

  const { action, email, password, role, uid } = req.body || {};

  try {
    if (action === "create") {
      if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: "Email and a password of at least 6 characters are required." });
      }
      const roleToSet = role === "super" ? "super" : "admin";
      const userRecord = await auth.createUser({ email, password });
      await db.ref(`admins/${userRecord.uid}`).set({
        email,
        role: roleToSet,
        addedAt: Date.now(),
        addedBy: caller.uid,
      });
      return res.status(200).json({ uid: userRecord.uid });
    }

    if (action === "updateRole") {
      if (!uid || (role !== "super" && role !== "admin")) {
        return res.status(400).json({ error: "Missing uid or invalid role." });
      }
      const snap = await db.ref(`admins/${uid}`).once("value");
      const current = snap.val();
      if (!current) return res.status(404).json({ error: "Admin not found." });
      if (roleOf(current) === "super" && role === "admin" && (await countSupers(db)) <= 1) {
        return res.status(400).json({ error: "Can't demote the last super user." });
      }
      const email = typeof current === "object" ? current.email : (await auth.getUser(uid)).email;
      await db.ref(`admins/${uid}`).set({ email, role, addedAt: (current && current.addedAt) || Date.now(), addedBy: (current && current.addedBy) || caller.uid });
      return res.status(200).json({ ok: true });
    }

    if (action === "resetPassword") {
      if (!uid || !password || password.length < 6) {
        return res.status(400).json({ error: "Missing uid or password too short (min 6 characters)." });
      }
      await auth.updateUser(uid, { password });
      return res.status(200).json({ ok: true });
    }

    if (action === "delete") {
      if (!uid) return res.status(400).json({ error: "Missing uid." });
      if (uid === caller.uid) return res.status(400).json({ error: "You can't delete your own account while logged in as it." });
      const snap = await db.ref(`admins/${uid}`).once("value");
      if (roleOf(snap.val()) === "super" && (await countSupers(db)) <= 1) {
        return res.status(400).json({ error: "Can't delete the last super user." });
      }
      await auth.deleteUser(uid).catch(() => {});
      await db.ref(`admins/${uid}`).remove();
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Request failed." });
  }
}
