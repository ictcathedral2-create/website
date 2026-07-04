import { db, ref, push } from "./firebase";

export async function submitForm(collection, data) {
  const submissionRef = ref(db, `submissions/${collection}`);
  const entry = { ...data, createdAt: Date.now(), status: "new" };
  await push(submissionRef, entry);
  return true;
}
