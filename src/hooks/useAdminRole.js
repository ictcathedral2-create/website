import { useState, useEffect } from "react";
import { db, ref, onValue } from "../firebase";

// A legacy admin entry is a bare `true` (the original single-admin setup) —
// treated as super so the one existing admin isn't locked out. New entries
// are objects with an explicit role.
function roleOf(value) {
  if (value === true) return "super";
  if (value && typeof value === "object") return value.role || "admin";
  return null;
}

// Returns "super", "admin", null (not an admin), or undefined (still loading).
export function useAdminRole(uid) {
  const [role, setRole] = useState(undefined);

  useEffect(() => {
    if (!uid) return;
    const dbRef = ref(db, `admins/${uid}`);
    const unsubscribe = onValue(dbRef, snapshot => {
      setRole(roleOf(snapshot.val()));
    });
    return () => unsubscribe();
  }, [uid]);

  return role;
}
