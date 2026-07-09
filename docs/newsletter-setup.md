# Newsletter Setup

The newsletter feature is fully built and deployed, but needs a few one-time setup steps in Vercel before it can actually send emails. None of this involves touching code — it's all account creation and environment variables.

## How it works

- People subscribe via the newsletter form on the Home page (already live — saves to Firebase under `submissions/newsletterSignups`).
- A Vercel Cron Job runs automatically **every Wednesday, Friday, and Sunday at 8:00 AM Nairobi time** and calls `/api/send-newsletter`.
- That function builds an email digest (upcoming events pulled from the site + a link to the latest YouTube sermon) and sends it to every subscriber via [Resend](https://resend.com).
- Anyone marked `archived` in the admin dashboard's Newsletter Signups section is skipped (that's the unsubscribe mechanism for now — no self-serve unsubscribe link yet).

## Setup steps (one-time)

### 1. Create a Resend account and get an API key
1. Go to [resend.com](https://resend.com) and sign up (free tier: 3,000 emails/month, 100/day).
2. In the dashboard, go to **API Keys** → **Create API Key**. Copy it.
3. (Optional but recommended) Under **Domains**, add and verify your own domain so emails come from `newsletter@yourdomain.org` instead of the shared `onboarding@resend.dev` test address. Without this, emails still send fine but look less professional and are more likely to land in spam.

### 2. Generate a Firebase service account key
This lets the server-side function read the subscriber list securely (the app's public Firebase config isn't allowed to do this — by design, so random visitors can't read your subscriber emails).

1. Go to the [Firebase Console](https://console.firebase.google.com) → your `ack-youth` project → gear icon → **Project settings** → **Service accounts** tab.
2. Click **Generate new private key**. This downloads a `.json` file — keep it private, don't commit it to git.
3. Open that file — you'll paste its entire contents as one environment variable in the next step.

### 3. Add environment variables in Vercel
Go to your Vercel project → **Settings** → **Environment Variables** and add:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | The API key from step 1 |
| `NEWSLETTER_FROM_EMAIL` | e.g. `ACK St Pauls Youths <newsletter@yourdomain.org>` (or leave unset to use the Resend test address `onboarding@resend.dev`) |
| `NEWSLETTER_REPLY_TO` | Optional — defaults to `ictcathedral2@gmail.com`. Set this if replies should go somewhere else. |
| `FIREBASE_SERVICE_ACCOUNT` | The **entire contents** of the JSON file from step 2, pasted as-is (it's valid JSON, Vercel accepts multi-line values) |
| `FIREBASE_DATABASE_URL` | `https://ack-youth-default-rtdb.firebaseio.com` (same as `VITE_FIREBASE_DATABASE_URL`) |
| `CRON_SECRET` | Any random string you generate yourself (e.g. run `openssl rand -hex 32`) — this stops random people from triggering sends by hitting the URL directly |

After adding these, redeploy (any new push does this automatically).

**Note on the "From" address**: you cannot send email "from" a Gmail address (`ictcathedral2@gmail.com`) through Resend or any email API — only from a domain you've verified via DNS. Until you have a custom domain, emails send from Resend's shared `onboarding@resend.dev` address, but are configured with **Reply-To: ictcathedral2@gmail.com**, so any replies still land in that inbox. Once you get a custom domain and verify it in Resend, just update `NEWSLETTER_FROM_EMAIL` — no code changes needed.

### 4. Test it
Once env vars are set, you can trigger a manual send without waiting for the schedule:

```
curl -X GET https://ackstpaulsyouths.vercel.app/api/send-newsletter \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

It returns JSON like `{"sent": 12, "subscribers": 12, "events": 3, "sermon": "..."}`.

## Changing the schedule

The schedule lives in `vercel.json` at the project root:

```json
"schedule": "0 5 * * 0,3,5"
```

That's cron syntax for `05:00 UTC` (08:00 Nairobi time) on Sunday(0), Wednesday(3), Friday(5). Adjust the hour or days as needed — [crontab.guru](https://crontab.guru) is handy for building the expression.

## Content

The digest is fully automatic — no admin writing required:
- **Upcoming Events**: next 5 events from the admin-managed Events list, soonest first.
- **Latest Sermon**: whatever's most recently uploaded to the YouTube channel, with thumbnail and a watch link.

If you'd rather have an editable message admins can add on top of the auto digest, that's a follow-up feature — just ask.
