import { db, ref, set, remove } from "../firebase";

// Updates a submission's status. For testimonies, also mirrors the record to
// the public-readable `publicTestimonies` path when approved (and removes it
// otherwise), since the main `submissions` tree is admin-only for reads.
export async function updateSubmissionStatus(collection, id, status, record = null) {
  await set(ref(db, `submissions/${collection}/${id}/status`), status);

  if (collection === "testimonies") {
    if (status === "approved" && record) {
      const rest = { ...record };
      delete rest.id;
      await set(ref(db, `publicTestimonies/${id}`), { ...rest, status: "approved" });
    } else {
      await remove(ref(db, `publicTestimonies/${id}`));
    }
  }
}
