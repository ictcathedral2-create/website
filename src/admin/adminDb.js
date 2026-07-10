import { db, ref, set, push, remove } from "../firebase";

// Updates a submission's status. For testimonies, also mirrors the record to
// the public-readable `publicTestimonies` path when approved (and removes it
// otherwise), since the main `submissions` tree is admin-only for reads.
export async function updateSubmissionStatus(collection, id, status, record = null) {
  await set(ref(db, `submissions/${collection}/${id}/status`), status);

  if (collection === "testimonies") {
    await syncPublicTestimony(id, status, record);
  }
}

// Creates a new submission record (admin-entered).
export async function createSubmission(collection, data) {
  const newRef = push(ref(db, `submissions/${collection}`));
  await set(newRef, { ...data, createdAt: Date.now(), status: data.status || "new" });
  return newRef.key;
}

// Updates a submission's full field set (not just status). For testimonies,
// re-syncs the public copy if it's currently approved so edits show up there too.
export async function updateSubmissionFields(collection, id, data) {
  await set(ref(db, `submissions/${collection}/${id}`), data);

  if (collection === "testimonies") {
    await syncPublicTestimony(id, data.status, { id, ...data });
  }
}

// Permanently deletes a submission record.
export async function deleteSubmission(collection, id) {
  await remove(ref(db, `submissions/${collection}/${id}`));
  if (collection === "testimonies") {
    await remove(ref(db, `publicTestimonies/${id}`));
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

async function syncPublicTestimony(id, status, record) {
  if (status === "approved" && record) {
    const rest = { ...record };
    delete rest.id;
    await set(ref(db, `publicTestimonies/${id}`), { ...rest, status: "approved" });
  } else {
    await remove(ref(db, `publicTestimonies/${id}`));
  }
}
