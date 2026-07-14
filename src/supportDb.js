import { db, ref, push, set } from "./firebase";

// Support Center chats live outside submissions/* because, unlike other forms,
// the requester needs to read their own thread back (to see admin replies) —
// submissions/* is admin-read-only. Each chat is keyed by its own push id,
// which acts as an unguessable ticket link for the requester's read/write access.
export async function createSupportRequest({ type, name, phone, message }) {
  const newRef = push(ref(db, "supportChats"));
  const now = Date.now();
  await set(newRef, { type, name, phone, status: "new", createdAt: now, updatedAt: now });
  await addSupportMessage(newRef.key, "user", message);
  notifySupportTeam({ id: newRef.key, type, name, phone, message });
  return newRef.key;
}

export async function addSupportMessage(chatId, sender, text) {
  const msgRef = push(ref(db, `supportChats/${chatId}/messages`));
  await set(msgRef, { sender, text, at: Date.now() });
  await set(ref(db, `supportChats/${chatId}/updatedAt`), Date.now());
  if (sender === "admin") {
    await set(ref(db, `supportChats/${chatId}/status`), "responded");
  }
}

export async function closeSupportChat(chatId) {
  await set(ref(db, `supportChats/${chatId}/status`), "closed");
}

// Fire-and-forget email alert to the support team — a failed notify shouldn't
// block the requester's submission, since the request itself is already saved.
function notifySupportTeam(payload) {
  fetch("/api/notify-support", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
