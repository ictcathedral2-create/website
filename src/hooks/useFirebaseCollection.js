import { useState, useEffect } from "react";
import { db, ref, onValue } from "../firebase";

// Subscribes to a Realtime Database path and returns its children as an array.
// Optionally filters by a field/value (e.g. status === "approved").
export function useFirebaseCollection(path, filter = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dbRef = ref(db, path);
    const unsubscribe = onValue(
      dbRef,
      snapshot => {
        const items = [];
        snapshot.forEach(child => {
          const val = { id: child.key, ...child.val() };
          if (!filter || val[filter.field] === filter.value) items.push(val);
        });
        setData(items);
        setLoading(false);
      },
      err => {
        setError(err.message || "Failed to load data.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, filter?.field, filter?.value]);

  return { data, loading, error };
}
