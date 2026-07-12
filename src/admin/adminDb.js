import { db, ref, set, push, remove } from "../firebase";

// Collections whose approved records get mirrored to a public-readable path,
// since their `submissions/*` tree is admin-only for reads.
const PUBLIC_MIRRORS = {
  testimonies: "publicTestimonies",
  businessListings: "publicBusinessListings",
  jobPostings: "publicJobPostings",
};

// Updates a submission's status. For mirrored collections, also syncs the
// public copy (added when approved, removed otherwise).
export async function updateSubmissionStatus(collection, id, status, record = null) {
  await set(ref(db, `submissions/${collection}/${id}/status`), status);

  if (PUBLIC_MIRRORS[collection]) {
    await syncPublicMirror(collection, id, status, record);
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
  } else {
    await remove(ref(db, `${publicPath}/${id}`));
  }
}

// Public-facing events (day/month/title/time/desc), managed only by admins but readable by anyone.
export async function createEvent(data) {
  const newRef = push(ref(db, "events"));
  await set(newRef, data);
  return newRef.key;
}

export async function updateEvent(id, data) {
  await set(ref(db, `events/${id}`), data);
}

export async function deleteEvent(id) {
  await remove(ref(db, `events/${id}`));
}

// Public-facing gallery (event posters / after-event photos), managed only by admins but readable by anyone.
export async function createGalleryItem(data) {
  const newRef = push(ref(db, "gallery"));
  await set(newRef, { ...data, createdAt: Date.now() });
  return newRef.key;
}

export async function updateGalleryItem(id, data) {
  await set(ref(db, `gallery/${id}`), data);
}

export async function deleteGalleryItem(id) {
  await remove(ref(db, `gallery/${id}`));
}
