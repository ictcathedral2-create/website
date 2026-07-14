import { useState, useEffect } from "react";
import { db, ref, onValue } from "../firebase";

// Subscribes to a single Realtime Database node (not a list of children).
export function useFirebaseDoc(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(db, path);
    const unsubscribe = onValue(
      dbRef,
      snapshot => {
        setData(snapshot.exists() ? { id: path.split("/").pop(), ...snapshot.val() } : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [path]);

  return { data, loading };
}
