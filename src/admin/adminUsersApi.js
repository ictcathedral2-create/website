import { auth } from "../firebase";

async function callManageAdmin(payload) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/manage-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export const createAdmin = (email, password, role) => callManageAdmin({ action: "create", email, password, role });
export const updateAdminRole = (uid, role) => callManageAdmin({ action: "updateRole", uid, role });
export const resetAdminPassword = (uid, password) => callManageAdmin({ action: "resetPassword", uid, password });
export const deleteAdmin = uid => callManageAdmin({ action: "delete", uid });
