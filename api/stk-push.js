import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const DARAJA_BASE = process.env.MPESA_ENV === "sandbox"
  ? "https://sandbox.safaricom.co.ke"
  : "https://api.safaricom.co.ke";

function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Normalizes a Kenyan phone number to the 2547XXXXXXXX / 2541XXXXXXXX format Safaricom requires.
function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
  if (digits.startsWith("1") && digits.length === 9) return `254${digits}`;
  return null;
}

async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data.errorMessage || "Failed to authenticate with Safaricom.");
  return data.access_token;
}

function buildTimestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const required = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_URL", "FIREBASE_SERVICE_ACCOUNT", "FIREBASE_DATABASE_URL"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    return res.status(500).json({ error: `M-Pesa isn't configured yet. Missing: ${missing.join(", ")}` });
  }

  const { phone, amount, accountType } = req.body || {};
  const normalizedPhone = normalizePhone(phone);
  const numericAmount = Math.round(Number(amount));

  if (!normalizedPhone) return res.status(400).json({ error: "Enter a valid Safaricom phone number (e.g. 07XXXXXXXX)." });
  if (!numericAmount || numericAmount < 1) return res.status(400).json({ error: "Enter a valid amount." });
  if (!accountType) return res.status(400).json({ error: "Choose what you're giving towards." });

  try {
    const accessToken = await getAccessToken();
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = buildTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const stkRes = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: numericAmount,
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: `ACK-${accountType}`.slice(0, 12),
        TransactionDesc: `${accountType} - ACK St Pauls Youths`,
      }),
    });
    const stkData = await stkRes.json();

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      throw new Error(stkData.errorMessage || stkData.ResponseDescription || "Safaricom declined the request.");
    }

    const app = initFirebase();
    const db = getDatabase(app);
    await db.ref(`submissions/mpesaTransactions/${stkData.CheckoutRequestID}`).set({
      phone: normalizedPhone,
      amount: numericAmount,
      accountType,
      status: "pending",
      createdAt: Date.now(),
    });

    return res.status(200).json({
      checkoutRequestId: stkData.CheckoutRequestID,
      message: "Check your phone and enter your M-Pesa PIN to complete the payment.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Something went wrong initiating the payment." });
  }
}
