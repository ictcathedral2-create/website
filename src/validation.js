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

// Kenyan mobile numbers only: exactly 10 digits, starting with 01 or 07 (e.g. 0712345678, 0112345678).
export function validatePhone(phone) {
  const digitsOnly = String(phone || "").replace(/\D/g, "");
  return /^(01|07)\d{8}$/.test(digitsOnly);
}

export function sanitize(str, maxLength = 1000) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLength);
}
