# M-Pesa STK Push Setup

The "Give Instantly" STK Push flow on the Give page is fully built, but needs Safaricom Daraja API credentials before it can actually send payment prompts. None of this involves touching code — it's account setup and environment variables, same pattern as the newsletter feature.

## How it works

1. A visitor picks what they're giving towards, an amount, and enters their phone number, then taps "Give Now".
2. `/api/stk-push` authenticates with Safaricom, then triggers an STK push (the payment prompt that pops up on the visitor's phone).
3. The visitor enters their M-Pesa PIN on their phone to approve it.
4. Safaricom calls `/api/mpesa-callback` with the result, which gets saved to Firebase.
5. The Give page polls `/api/stk-status` every 3 seconds (up to 1 minute) and shows a success message with the M-Pesa receipt number once payment completes.
6. Every transaction (pending, completed, or failed) shows up in the admin dashboard under **M-Pesa Transactions**.

## Important: this needs your own Till/Paybill, not just any paybill number

STK Push only works for a shortcode (Paybill or Till) that **you** have registered for API access on Safaricom's Daraja portal. The `400222` paybill currently shown on the Give page for manual entry may belong to a bank (e.g. Equity, KCB) rather than being directly API-accessible — check with whoever manages that account. You have two options:

- **Get your own dedicated Till Number** for STK Push specifically (can run alongside the existing paybill for manual gifts), or
- **Ask your bank** if they can provide Daraja-style API access to the existing paybill (some banks offer this, called "Bulk" or "API" paybill products — terms vary).

Either way, once you have a shortcode with API access, follow the steps below.

## Setup steps (one-time)

### 1. Create a Safaricom Daraja account
1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and sign up.
2. Create a new app in the dashboard — this gives you a **Consumer Key** and **Consumer Secret**.
3. Under **Lipa Na M-Pesa Online** (STK Push), you'll need the **Passkey** for your shortcode. For production, Safaricom issues this once your go-live application is approved. For testing, they provide a shared sandbox shortcode (`174379`) and passkey on the Daraja portal's test credentials page.

### 2. Add environment variables in Vercel
Go to your Vercel project → **Settings** → **Environment Variables** and add:

| Name | Value |
|---|---|
| `MPESA_CONSUMER_KEY` | From your Daraja app |
| `MPESA_CONSUMER_SECRET` | From your Daraja app |
| `MPESA_SHORTCODE` | Your Paybill/Till number (use `174379` for sandbox testing) |
| `MPESA_PASSKEY` | Your Lipa Na M-Pesa passkey |
| `MPESA_CALLBACK_URL` | `https://ackstpaulsyouths.vercel.app/api/mpesa-callback` (must be a public HTTPS URL — Safaricom cannot call `localhost`) |
| `MPESA_ENV` | `sandbox` while testing, or `production` (or leave unset) once you have live production credentials |
| `FIREBASE_SERVICE_ACCOUNT` | Same value already used for the newsletter feature — reuse it here too |
| `FIREBASE_DATABASE_URL` | Same value already used for the newsletter feature |

After adding these, redeploy (any new push does this automatically).

### 3. Test it
While `MPESA_ENV=sandbox`, use Safaricom's test shortcode (`174379`) and passkey, and a test phone number from the Daraja portal's simulator docs — sandbox payments don't move real money. Once you're confident it works, switch to your production shortcode/passkey and remove `MPESA_ENV` (or set it to `production`).

## Where records go

Every payment attempt is saved to Firebase under `submissions/mpesaTransactions/{checkoutRequestId}` with a `status` of `pending`, `completed`, or `failed`, and shows up in the admin dashboard's **M-Pesa Transactions** section — same Create/Edit/Delete/CSV export pattern as every other section.
