import { auth } from "../firebase";

// Calls /api/send-sms, which sends through the church's SMS gateway phone.
export async function callSendSms(payload) {
  const token = await auth.currentUser.getIdToken();
  let res;
  try {
    res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("The SMS service could not be reached. Check your internet connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `The SMS service failed (HTTP ${res.status}).`);
  return data;
}
