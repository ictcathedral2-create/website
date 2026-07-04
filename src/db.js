import { db, ref, push } from "./firebase";

export async function submitForm(collection, data) {
  const submissionRef = ref(db, `submissions/${collection}`);
  const entry = { status: "new", ...data, createdAt: Date.now() };
  await push(submissionRef, entry);
  return true;
}
