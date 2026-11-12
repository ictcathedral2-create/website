# SMS Setup

The admin panel can send a personalised SMS ("Hi Mary, …") to every member. Messages go out from the church's own Android phone and SIM card, using the free **SMS Gateway for Android** app. There's no SMS provider account or sender name to register; members see the phone's number and can reply to it.

## How it works

- **Admin → People → SMS Members** lists everyone who receives SMS:
  - everyone in **Membership Sign-ups** (archived sign-ups are left out), included automatically;
  - plus members you add yourself, one at a time or by pasting a list from Excel.
  - Duplicate numbers get one SMS. Members marked **Opted out** get none.
- **Admin → People → Send SMS**: write the message, insert `{firstName}` or `{name}`, check the preview, send a test to your own phone, then **Send to all**.
- The website (`/api/send-sms`) passes each personalised message to the SMS Gateway cloud service. The phone picks them up and sends them from its SIM, one by one.
- Each send is logged under **History** (stored in `smsCampaigns` in Firebase).

## Setup steps (one-time)

### 1. Prepare the phone
1. Use an Android phone (Android 5 or newer) with a Safaricom (or other) SIM and an **SMS bundle**. A spare phone that can stay at the church office, plugged in, is ideal.
2. Install **SMS Gateway for Android** from Google Play, or from https://sms-gate.app.
3. Open the app and allow it to send SMS.
4. Turn **Cloud server** on, then tap **Start service** on the Home tab. In the dialog, keep **Sign up** and confirm. An account is created automatically (no email needed).
5. The **Cloud server** section now shows a **username** and **password**. Write them down.
6. In the app's settings, set a **delay between messages** of a few seconds (e.g. 5–10 s). Sending hundreds of SMS back-to-back can get a line flagged by the network.
7. Turn off battery optimisation for the app (Android Settings → Apps → SMS Gateway → Battery → Unrestricted), so the phone doesn't pause it.

### 2. Add environment variables in Vercel
Go to the Vercel project → **Settings** → **Environment Variables** and add:

| Name | Value |
|---|---|
| `SMS_GATEWAY_USERNAME` | the username from the app |
| `SMS_GATEWAY_PASSWORD` | the password from the app |

`FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_DATABASE_URL` are already set for the other functions. Then **redeploy**: Deployments → ⋯ on the latest → Redeploy.

(Optional) If you later run your own gateway server instead of the free cloud one, also set `SMS_GATEWAY_URL` to its `.../3rdparty/v1` address.

### 3. Allow the new lists in the Firebase database rules
In the [Firebase Console](https://console.firebase.google.com) → `ack-youth` → **Realtime Database** → **Rules**, add these three entries inside `"rules": { … }`, next to the existing ones:

```json
"smsMembers": {
  ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
  ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
},
"smsOptOuts": {
  ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
  ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
},
"smsCampaigns": {
  ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
  ".write": false
}
```

Click **Publish**. Without these, the SMS pages show "Couldn't load the member list".

## Sending

1. Keep the gateway phone **on, charged and connected to the internet** (Wi-Fi or data).
2. In **Send SMS**, write the message, e.g. `Hi {firstName}, join us this Sunday at 2 PM for the Youth Service at the Cathedral. God bless!`
3. Click **Send test** with your own number and check it arrives.
4. Click **Send to all**. The progress bar shows messages being queued. The phone then sends them over the next minutes; with a 5-second delay, 300 members take about 25 minutes.

## Good to know

- **Cost:** each SMS uses the phone's bundle. A message over 160 characters counts as 2 or more SMS (the page shows the count). Emoji and curly quotes reduce the limit to 70 characters.
- **Opt-outs:** if someone asks to stop receiving messages, open **SMS Members** and click **Opt out** next to them. It also works for Membership sign-ups.
- **Privacy:** message text and numbers pass through the SMS Gateway cloud service (sms-gate.app) on their way to the phone. The app supports end-to-end encryption, and you can also run a private server; both are described in its docs.
- **Network limits:** Safaricom may restrict a line that sends very large volumes. For a few hundred members with a delay between messages this is normally fine. For thousands, consider a bulk SMS provider such as Africa's Talking instead.
