import { auth, db, ref, set, push, remove } from "../firebase";

// Collections whose approved records get mirrored to a public-readable path,
// since their `submissions/*` tree is admin-only for reads.
const PUBLIC_MIRRORS = {
  testimonies: "publicTestimonies",
  businessListings: "publicBusinessListings",
  jobPostings: "publicJobPostings",
  jobSeekers: "publicJobSeekers",
  wantedPosts: "publicWantedPosts",
};

// Notification category each mirrored collection maps to in the mobile app's
// Notification Settings screen (st-pauls-youths-app/src/lib/notifications.js).
const MIRROR_NOTIFY_CATEGORY = {
  testimonies: "testimonies",
  businessListings: "community",
  jobPostings: "community",
  jobSeekers: "community",
  wantedPosts: "community",
};

// Fans a push notification out to every subscribed mobile app device via
// /api/notify-devices — a best-effort call that never blocks or fails the
// content save itself. The mobile app and the website share one Firebase
// Realtime Database, so this is the only extra step needed to notify app
// users of the same add/edit/delete an admin already sees reflected live.
async function notifyContentChange(category, title, body) {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch("/api/notify-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, title, body }),
    });
  } catch {
    // Best-effort — see comment above.
  }
}

// Updates a submission's status. For mirrored collections, also syncs the
// public copy (added when approved, removed otherwise).
export async function updateSubmissionStatus(collection, id, status) {
  const token = await auth.currentUser?.getIdToken();
  let response;
  try {
    response = await fetch("/api/manage-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` },
      body: JSON.stringify({ action: "updateSubmissionStatus", collection, id, status }),
    });
  } catch {
    throw new Error("The admin update service could not be reached. Please try again shortly.");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `The admin update service failed (HTTP ${response.status}).`);
  }
}

// Creates a new submission record (admin-entered).
export async function createSubmission(collection, data) {
  const newRef = push(ref(db, `submissions/${collection}`));
  await set(newRef, { ...data, createdAt: Date.now(), status: data.status || "new" });
  return newRef.key;
}

// Updates a submission's full field set (not just status). For mirrored
// collections, re-syncs the public copy if it's currently approved so edits
// show up there too.
export async function updateSubmissionFields(collection, id, data) {
  await set(ref(db, `submissions/${collection}/${id}`), data);

  if (PUBLIC_MIRRORS[collection]) {
    await syncPublicMirror(collection, id, data.status, { id, ...data });
  }
}

// Permanently deletes a submission record.
export async function deleteSubmission(collection, id) {
  await remove(ref(db, `submissions/${collection}/${id}`));
  if (PUBLIC_MIRRORS[collection]) {
    await remove(ref(db, `${PUBLIC_MIRRORS[collection]}/${id}`));
  }
}

async function syncPublicMirror(collection, id, status, record) {
  const publicPath = PUBLIC_MIRRORS[collection];
  if (status === "approved" && record) {
    const rest = { ...record };
    delete rest.id;
    await set(ref(db, `${publicPath}/${id}`), { ...rest, status: "approved" });
    const label = record.businessName || record.jobTitle || record.name || record.title || "A listing";
    notifyContentChange(
      MIRROR_NOTIFY_CATEGORY[collection],
      collection === "testimonies" ? "Testimony Updated" : "Community Listing Updated",
      label
    );
  } else {
    await remove(ref(db, `${publicPath}/${id}`));
  }
}

// Public-facing events (day/month/title/time/desc), managed only by admins but readable by anyone.
export async function createEvent(data) {
  const newRef = push(ref(db, "events"));
  await set(newRef, data);
  notifyContentChange("events", "New Event Added", data.title || "A new event was added");
  return newRef.key;
}

export async function updateEvent(id, data) {
  await set(ref(db, `events/${id}`), data);
  notifyContentChange("events", "Event Updated", data.title || "An event was updated");
}

export async function deleteEvent(id) {
  await remove(ref(db, `events/${id}`));
  notifyContentChange("events", "Event Removed", "An event was cancelled or removed");
}

// Public-facing gallery (event posters / after-event photos), managed only by admins but readable by anyone.
export async function createGalleryItem(data) {
  const newRef = push(ref(db, "gallery"));
  await set(newRef, { ...data, createdAt: Date.now() });
  notifyContentChange("gallery", "New Photo Added", data.caption || "A new photo was added to the gallery");
  return newRef.key;
}

export async function updateGalleryItem(id, data) {
  await set(ref(db, `gallery/${id}`), data);
}

export async function deleteGalleryItem(id) {
  await remove(ref(db, `gallery/${id}`));
}

// Public-facing written sermons, managed only by admins but readable by anyone.
export async function createWrittenSermon(data) {
  const newRef = push(ref(db, "writtenSermons"));
  await set(newRef, { ...data, createdAt: Date.now() });
  notifyContentChange("sermons", "New Written Sermon", data.title || "A new written sermon was posted");
  return newRef.key;
}

export async function updateWrittenSermon(id, data) {
  await set(ref(db, `writtenSermons/${id}`), data);
  notifyContentChange("sermons", "Written Sermon Updated", data.title || "A written sermon was updated");
}

export async function deleteWrittenSermon(id) {
  await remove(ref(db, `writtenSermons/${id}`));
}

// Public-facing sermons gallery (photos from services/preaching), managed only by admins but readable by anyone.
export async function createSermonGalleryItem(data) {
  const newRef = push(ref(db, "sermonGallery"));
  await set(newRef, { ...data, createdAt: Date.now() });
  notifyContentChange("gallery", "New Sermon Photo", data.caption || "A new sermon photo was added");
  return newRef.key;
}

export async function updateSermonGalleryItem(id, data) {
  await set(ref(db, `sermonGallery/${id}`), data);
}

export async function deleteSermonGalleryItem(id) {
  await remove(ref(db, `sermonGallery/${id}`));
}
