import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Lets the Give page poll for the outcome of a pending STK push without exposing
// the whole transactions list (which requires admin auth to read).
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { checkoutRequestId } = req.query;
  if (!checkoutRequestId) return res.status(400).json({ error: "Missing checkoutRequestId" });

  try {
    const app = initFirebase();
    const db = getDatabase(app);
    const snapshot = await db.ref(`submissions/mpesaTransactions/${checkoutRequestId}`).once("value");
    const data = snapshot.val();
    if (!data) return res.status(404).json({ status: "unknown" });

    return res.status(200).json({
      status: data.status,
      mpesaReceiptNumber: data.mpesaReceiptNumber || null,
      resultDesc: data.resultDesc || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to check payment status." });
  }
}
