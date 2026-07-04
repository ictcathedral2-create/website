export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(fields, data) {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      return field;
    }
  }
  return null;
}

export function validatePhone(phone) {
  return /^\+?[\d\s-]{7,15}$/.test(phone);
}

export function sanitize(str, maxLength = 1000) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength);
}
