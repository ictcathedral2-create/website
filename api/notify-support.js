const TYPE_LABELS = {
  prayer: "Prayer Request",
  pastoral: "Pastoral Care",
  general: "General Question",
  other: "Other Request",
};

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { type, name, phone, message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Missing message." });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Missing RESEND_API_KEY env var." });
  }

  const FROM = process.env.NEWSLETTER_FROM_EMAIL || "ACK St Pauls Youths <onboarding@resend.dev>";
  const TO = "ictcathedral2@gmail.com";
  const SITE_URL = "https://ackstpaulsyouths.vercel.app";
  const typeLabel = TYPE_LABELS[type] || "Support Request";

  const html = `
  <div style="background:#FDF8F0;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:#0E2044;padding:24px 28px;">
          <div style="color:#C9A84C;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">ACK St Pauls Youths · Support Center</div>
          <div style="color:#ffffff;font-family:Georgia,serif;font-size:20px;font-weight:700;margin-top:6px;">New ${typeLabel}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;">
          <div style="font-size:14px;color:#0E2044;margin-bottom:6px;"><strong>From:</strong> ${escapeHtml(name) || "Anonymous"}</div>
          <div style="font-size:14px;color:#0E2044;margin-bottom:14px;"><strong>Phone:</strong> ${escapeHtml(phone) || "—"}</div>
          <div style="background:#F5F5F0;border-radius:10px;padding:14px 16px;color:#3A3630;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 24px;">
          <a href="${SITE_URL}/#admin" style="color:#0E2044;font-size:13px;font-weight:600;text-decoration:none;">Reply in the admin dashboard →</a>
        </td>
      </tr>
    </table>
  </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: process.env.NEWSLETTER_REPLY_TO || TO,
        subject: `New ${typeLabel} — ${name || "Anonymous"}`,
        html,
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: detail });
    }
    return res.status(200).json({ sent: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to send notification." });
  }
}
