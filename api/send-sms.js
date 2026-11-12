import { getAuth } from "firebase-admin/auth";
import { getDatabase, ServerValue } from "firebase-admin/database";
import { initFirebase, requireAdmin } from "./_lib/firebaseAdmin.js";
import { buildRecipients, normalizePhone, renderMessage, smsParts, MAX_SMS_PARTS } from "../src/utils/sms.js";

// Sends personalised SMS through the church's own Android phone, using the
// SMS Gateway for Android app (https://sms-gate.app) in Cloud Server mode.
// The phone picks each message up and sends it from its own SIM.
//
// The admin panel drives a send in small batches ("start", then "batch" until
// done) so each request stays well inside Vercel's time limit and the admin
// sees progress.

const GATEWAY_URL = (process.env.SMS_GATEWAY_URL || "https://api.sms-gate.app/3rdparty/v1").replace(/\/$/, "");
const BATCH_SIZE = 25;
const CONCURRENCY = 5;

async function sendOne(phone, text) {
  const credentials = Buffer.from(`${process.env.SMS_GATEWAY_USERNAME}:${process.env.SMS_GATEWAY_PASSWORD}`).toString("base64");
  const response = await fetch(`${GATEWAY_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
    body: JSON.stringify({ textMessage: { text }, phoneNumbers: [phone] }),
  });
  if (response.status === 401) throw new Error("The SMS gateway rejected the username or password.");
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`SMS gateway error (HTTP ${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return response.json().catch(() => ({}));
}

// Runs `worker` over `items`, at most `limit` at a time.
async function mapLimited(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(lanes);
  return results;
}

function checkMessage(message) {
  if (!String(message || "").trim()) return "Write a message first.";
  // Measure with a long name so a personalised copy never goes over the limit.
  const { parts } = smsParts(renderMessage(message, { firstName: "Christopher", lastName: "Wanjohi Mwangi" }));
  if (parts > MAX_SMS_PARTS) return `That message is too long (over ${MAX_SMS_PARTS} SMS). Please shorten it.`;
  return null;
}

async function loadRecipients(db) {
  const [registrations, members, optOuts] = await Promise.all(
    ["submissions/joinUsRegistrations", "smsMembers", "smsOptOuts"].map(path => db.ref(path).once("value").then(s => s.val() || {}))
  );
  const asList = obj => Object.entries(obj).map(([id, value]) => ({ id, ...value }));
  return buildRecipients(asList(registrations), asList(members), optOuts).recipients;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DATABASE_URL) {
    return res.status(500).json({ error: "Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_DATABASE_URL env vars." });
  }
  if (!process.env.SMS_GATEWAY_USERNAME || !process.env.SMS_GATEWAY_PASSWORD) {
    return res.status(500).json({ error: "SMS sending isn't set up yet: add SMS_GATEWAY_USERNAME and SMS_GATEWAY_PASSWORD in Vercel (see docs/sms-setup.md)." });
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

  const { action, message, phone, campaignId, offset } = req.body || {};

  try {
    if (action === "test") {
      const problem = checkMessage(message);
      if (problem) return res.status(400).json({ error: problem });
      const to = normalizePhone(phone);
      if (!to) return res.status(400).json({ error: "Enter a valid Kenyan mobile number for the test, e.g. 0712 345 678." });
      await sendOne(to, renderMessage(message, { firstName: "Test" }));
      return res.status(200).json({ ok: true });
    }

    if (action === "start") {
      const problem = checkMessage(message);
      if (problem) return res.status(400).json({ error: problem });
      const recipients = await loadRecipients(db);
      if (!recipients.length) return res.status(400).json({ error: "There are no members with a valid phone number to send to." });

      // The list is frozen here so every batch works through the same people,
      // even if someone signs up mid-send. It's removed again once finished.
      const campaignRef = db.ref("smsCampaigns").push();
      await campaignRef.set({
        message: message.trim(),
        total: recipients.length,
        sent: 0,
        failed: 0,
        status: "sending",
        createdAt: Date.now(),
        createdBy: caller.email || caller.uid,
        recipients: recipients.map(({ phone: p, firstName, lastName }) => ({ phone: p, firstName, lastName })),
      });
      return res.status(200).json({ campaignId: campaignRef.key, total: recipients.length });
    }

    if (action === "batch" || action === "stop") {
      if (!campaignId) return res.status(400).json({ error: "Missing campaign." });
      const campaignRef = db.ref(`smsCampaigns/${campaignId}`);
      const campaign = (await campaignRef.once("value")).val();
      if (!campaign) return res.status(404).json({ error: "That send could not be found." });

      if (action === "stop") {
        await campaignRef.update({ status: "stopped", completedAt: Date.now(), recipients: null });
        return res.status(200).json({ ok: true });
      }
      if (campaign.status !== "sending") return res.status(400).json({ error: "This send has already finished." });

      const start = Math.max(0, Number(offset) || 0);
      const slice = (campaign.recipients || []).slice(start, start + BATCH_SIZE);
      const results = await mapLimited(slice, CONCURRENCY, async person => {
        try {
          await sendOne(person.phone, renderMessage(campaign.message, person));
          return null;
        } catch (err) {
          return { phone: person.phone, error: err.message || "Failed" };
        }
      });

      const failures = results.filter(Boolean);
      const nextOffset = start + slice.length;
      const done = nextOffset >= campaign.total;
      const updates = {
        sent: ServerValue.increment(slice.length - failures.length),
        failed: ServerValue.increment(failures.length),
      };
      failures.forEach(f => { updates[`failures/${f.phone}`] = f.error; });
      if (done) Object.assign(updates, { status: "done", completedAt: Date.now(), recipients: null });
      await campaignRef.update(updates);

      return res.status(200).json({ sent: slice.length - failures.length, failed: failures.length, nextOffset, done, lastError: failures[0]?.error || null });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Request failed." });
  }
}
