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

// Safaricom calls this endpoint directly (no auth header we control) once the
// customer completes or cancels the STK push prompt on their phone.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) return res.status(200).json({ ResultCode: 0, ResultDesc: "Ignored" });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const app = initFirebase();
    const db = getDatabase(app);
    const ref = db.ref(`submissions/mpesaTransactions/${CheckoutRequestID}`);

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item || [];
      const get = name => items.find(i => i.Name === name)?.Value;
      await ref.update({
        status: "completed",
        mpesaReceiptNumber: get("MpesaReceiptNumber") || "",
        amountConfirmed: get("Amount") || null,
        completedAt: Date.now(),
      });
    } else {
      await ref.update({
        status: "failed",
        resultDesc: ResultDesc || "Payment was not completed.",
        completedAt: Date.now(),
      });
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Received" });
  } catch {
    // Always acknowledge with 200 so Safaricom doesn't endlessly retry a broken payload.
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Received" });
  }
}
