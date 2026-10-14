import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// A legacy admin entry is a bare `true` — see api/manage-admin.js.
function roleOf(value) {
  if (value === true) return "super";
  if (value && typeof value === "object") return value.role || "admin";
  return null;
}

async function requireAdmin(auth, db, req) {
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
  return { uid: decoded.uid };
}

// Fans a notification out to every mobile app device subscribed to `category`.
// The app registers its Firebase Cloud Messaging token under deviceTokens/{id}
// (see st-pauls-youths-app/src/lib/notifications.js), and this sends through
// FCM with the service account already configured for this Vercel project
// (FIREBASE_SERVICE_ACCOUNT), so no Expo account or extra credentials are
// needed. Records holding an older Expo push token still go through Expo.
const EXPO_TOKEN = /^Expo(nent)?PushToken\[/;
const STALE_FCM_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

async function sendViaFcm(tokens, { title, body, data }) {
  const stale = [];
  // FCM data values must be strings.
  const stringData = Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)]));
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const result = await getMessaging(getApp()).sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      data: stringData,
      android: {
        priority: "high",
        notification: { channelId: "default", sound: "default", color: "#C9A84C" },
      },
    });
    result.responses.forEach((r, idx) => {
      if (!r.success && STALE_FCM_CODES.has(r.error?.code)) stale.push(batch[idx]);
    });
  }
  return stale;
}

async function sendViaExpo(tokens, { title, body, data }) {
  const messages = tokens.map(to => ({ to, sound: "default", title, body, data: data || {} }));
  for (let i = 0; i < messages.length; i += 100) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages.slice(i, i + 100)),
    }).catch(() => {});
  }
}

export async function sendPushToCategory(db, { category, title, body, data }) {
  const snap = await db.ref("deviceTokens").once("value");
  const records = Object.entries(snap.val() || {})
    .filter(([, r]) => r && typeof r.token === "string" && r.categories?.[category] !== false);
  if (!records.length) return { sent: 0 };

  const expoTokens = records.map(([, r]) => r.token).filter(t => EXPO_TOKEN.test(t));
  const fcmTokens = records.map(([, r]) => r.token).filter(t => !EXPO_TOKEN.test(t));
  const message = { title, body, data };

  const [stale] = await Promise.all([
    fcmTokens.length ? sendViaFcm(fcmTokens, message) : [],
    expoTokens.length ? sendViaExpo(expoTokens, message) : null,
  ]);

  // Drop devices that uninstalled the app so they aren't retried forever.
  if (stale.length) {
    const staleSet = new Set(stale);
    await Promise.all(records.filter(([, r]) => staleSet.has(r.token)).map(([id]) => db.ref(`deviceTokens/${id}`).remove()));
  }
  return { sent: records.length - stale.length, removed: stale.length };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DATABASE_URL) {
    return res.status(500).json({ error: "Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_DATABASE_URL env vars." });
  }

  const { category, title, body, data } = req.body || {};
  if (!category || !title || !body) {
    return res.status(400).json({ error: "category, title, and body are required." });
  }

  let auth, db;
  try {
    const app = initFirebase();
    auth = getAuth(app);
    db = getDatabase(app);
  } catch (err) {
    return res.status(500).json({ error: `Firebase Admin init failed: ${err.message || err}` });
  }

  const caller = await requireAdmin(auth, db, req);
  if (caller.error) return res.status(caller.status).json({ error: caller.error });

  try {
    const result = await sendPushToCategory(db, { category, title, body, data });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to send notifications." });
  }
}
