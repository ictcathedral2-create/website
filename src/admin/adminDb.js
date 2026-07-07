import { db, ref, set } from "../firebase";

export async function updateSubmissionStatus(collection, id, status) {
  await set(ref(db, `submissions/${collection}/${id}/status`), status);
}
