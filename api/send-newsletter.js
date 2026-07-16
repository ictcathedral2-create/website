import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const SITE_URL = "https://ackstpaulsyouths.vercel.app";
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_HANDLE = process.env.VITE_YOUTUBE_CHANNEL_HANDLE || "ackcathedralyouthembu";

function initFirebase() {
  if (getApps().length) return getApp();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Resolves a "day + short month" pair to the nearest upcoming date, rolling to next year once passed.
// Mirrors the logic in src/App.jsx so the digest matches what's shown on the site.
function resolveEventDate(day, monthAbbr) {
  const now = new Date();
  const monthIndex = new Date(`${monthAbbr} 1, 2000`).getMonth();
  let candidate = new Date(now.getFullYear(), monthIndex, Number(day), 23, 59, 59);
  if (candidate < now) candidate = new Date(now.getFullYear() + 1, monthIndex, Number(day), 23, 59, 59);
  return candidate;
}

async function getUpcomingEvents(db) {
  const snapshot = await db.ref("events").once("value");
  const events = [];
  snapshot.forEach(child => {
    const val = child.val();
    events.push({ ...val, date: resolveEventDate(val.day, val.month) });
  });
  return events.sort((a, b) => a.date - b.date).slice(0, 5);
}

async function getLatestSermon() {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${YOUTUBE_CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return null;

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${YOUTUBE_API_KEY}`
    );
    const playlistData = await playlistRes.json();
    const items = (playlistData.items || []).filter(item => item.snippet?.resourceId?.videoId);
    if (!items.length) return null;

    const latest = items.reduce((newest, item) =>
      new Date(item.snippet.publishedAt) > new Date(newest.snippet.publishedAt) ? item : newest
    );
    return {
      id: latest.snippet.resourceId.videoId,
      title: latest.snippet.title,
      thumbnail: latest.snippet.thumbnails?.medium?.url || latest.snippet.thumbnails?.default?.url || "",
    };
  } catch {
    return null;
  }
}

async function getActiveSubscribers(db) {
  const snapshot = await db.ref("submissions/newsletterSignups").once("value");
  const emails = [];
  snapshot.forEach(child => {
    const val = child.val();
    if (val?.email && val.status !== "archived") emails.push(val.email);
  });
  return [...new Set(emails)];
}

function buildEmailHtml({ events, sermon }) {
  const eventsHtml = events.length
    ? events
        .map(
          e => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #E8E4DC;">
            <div style="font-family:Georgia,serif;font-weight:700;color:#0E2044;font-size:16px;">${e.title}</div>
            <div style="color:#6B6358;font-size:13px;margin-top:2px;">${e.day} ${e.month} · ${e.time}</div>
            <div style="color:#6B6358;font-size:13px;margin-top:4px;line-height:1.5;">${e.desc || ""}</div>
          </td>
        </tr>`
        )
        .join("")
    : `<tr><td style="padding:12px 0;color:#6B6358;">No upcoming events right now — check back soon.</td></tr>`;

  const sermonHtml = sermon
    ? `
      <a href="https://youtube.com/watch?v=${sermon.id}" style="text-decoration:none;">
        <img src="${sermon.thumbnail}" alt="${sermon.title}" style="width:100%;max-width:560px;border-radius:10px;display:block;" />
        <div style="font-family:Georgia,serif;font-weight:700;color:#0E2044;font-size:16px;margin-top:10px;">${sermon.title}</div>
        <div style="color:#C9A84C;font-size:13px;font-weight:600;margin-top:4px;">▶ Watch on YouTube</div>
      </a>`
    : `<p style="color:#6B6358;">New sermons are on the way — check the site soon.</p>`;

  return `
  <div style="background:#FDF8F0;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:#0E2044;padding:28px 32px;">
          <div style="color:#C9A84C;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">ACK St Pauls Youths</div>
          <div style="color:#ffffff;font-family:Georgia,serif;font-size:22px;font-weight:700;margin-top:6px;">Your Weekly Update</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#9A7830;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Upcoming Events</div>
          <table role="presentation" width="100%">${eventsHtml}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#9A7830;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Latest Sermon</div>
          ${sermonHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;background:#F5F5F0;text-align:center;">
          <a href="${SITE_URL}" style="color:#0E2044;font-size:13px;font-weight:600;text-decoration:none;">Visit the site →</a>
          <div style="color:#A0998A;font-size:11px;margin-top:10px;">You're receiving this because you subscribed at ACK St Pauls Youths.</div>
        </td>
      </tr>
    </table>
  </div>`;
}

async function sendBatch(emails, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.NEWSLETTER_FROM_EMAIL || "ACK St Pauls Youths <onboarding@resend.dev>";
  const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || "ictcathedral2@gmail.com";
  const subject = "Your Weekly Update from ACK St Pauls Youths";

  const chunks = [];
  for (let i = 0; i < emails.length; i += 100) chunks.push(emails.slice(i, i + 100));

  let sent = 0;
  for (const chunk of chunks) {
    const payload = chunk.map(email => ({ from: FROM, to: [email], reply_to: REPLY_TO, subject, html }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) sent += chunk.length;
  }
  return sent;
}

export default async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.FIREBASE_DATABASE_URL) {
    return res.status(500).json({ error: "Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_DATABASE_URL env vars." });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Missing RESEND_API_KEY env var." });
  }

  try {
    const app = initFirebase();
    const db = getDatabase(app);

    const [subscribers, events, sermon] = await Promise.all([
      getActiveSubscribers(db),
      getUpcomingEvents(db),
      getLatestSermon(),
    ]);

    if (subscribers.length === 0) {
      return res.status(200).json({ sent: 0, message: "No active subscribers." });
    }

    const html = buildEmailHtml({ events, sermon });
    const sent = await sendBatch(subscribers, html);

    return res.status(200).json({ sent, subscribers: subscribers.length, events: events.length, sermon: sermon?.title || null });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to send newsletter." });
  }
}
