// Shared by the admin panel (recipient preview) and api/send-sms.js (the real
// send), so the preview always matches what members receive.

// Kenyan mobile numbers in any common format -> +2547XXXXXXXX / +2541XXXXXXXX.
// Returns null for anything that isn't a valid Kenyan mobile number.
export function normalizePhone(raw) {
    const digits = String(raw || "").replace(/[^\d]/g, "");
    let local = null;
    if (/^254[17]\d{8}$/.test(digits)) local = digits.slice(3);
    else if (/^0[17]\d{8}$/.test(digits)) local = digits.slice(1);
    else if (/^[17]\d{8}$/.test(digits)) local = digits;
    return local ? `+254${local}` : null;
}

// 0712 345 678, for display.
export const formatPhone = phone => phone ? `0${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}` : "";

const capitalize = word => word ? word.charAt(0).toUpperCase() + word.slice(1) : "";

// Splits "Mary Wanjiru Njeri" into first + last name.
export function splitName(full) {
    const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

// Every member with a valid number, de-duplicated by phone. Members the admin
// added come first so their spelling of the name wins over a sign-up's.
// Archived Membership Sign-ups are left out.
export function collectContacts(registrations = [], members = []) {
    const byPhone = new Map();
    const invalid = [];
    let duplicates = 0;

    const add = (person, source, id) => {
        const firstName = String(person.firstName || "").trim();
        const lastName = String(person.lastName || "").trim();
        const phone = normalizePhone(person.phone);
        if (!phone) {
            invalid.push({ name: `${firstName} ${lastName}`.trim() || "No name", phone: person.phone || "", source, id });
            return;
        }
        if (byPhone.has(phone)) {
            duplicates++;
            return;
        }
        byPhone.set(phone, { phone, firstName, lastName, source, id });
    };

    members.forEach(m => add(m, "added", m.id));
    registrations.filter(r => r.status !== "archived").forEach(r => add(r, "signup", r.id));

    const contacts = [...byPhone.values()].sort((a, b) => a.phone.localeCompare(b.phone));
    return { contacts, invalid, duplicates };
}

// The people a message actually goes to: every contact except opted-out numbers.
export function buildRecipients(registrations, members, optOuts = {}) {
    const { contacts, invalid, duplicates } = collectContacts(registrations, members);
    const recipients = contacts.filter(c => !optOuts[c.phone]);
    return { recipients, invalid, duplicates, optedOut: contacts.length - recipients.length };
}

// Fills {firstName}, {lastName} and {name} for one recipient.
export function renderMessage(template, person = {}) {
    const firstName = capitalize(String(person.firstName || "").trim()) || "Friend";
    const lastName = capitalize(String(person.lastName || "").trim());
    const values = { firstname: firstName, lastname: lastName, name: `${firstName} ${lastName}`.trim() };
    return String(template || "").replace(/\{\s*(firstName|lastName|name)\s*\}/gi, (_, key) => values[key.toLowerCase()]);
}

// GSM-7 characters fit 160 per SMS (153 per part when split). Anything else,
// such as emoji or curly quotes, switches the whole message to 70 / 67.
const GSM_BASIC = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€";

export function smsParts(text) {
    const chars = [...String(text || "")];
    if (!chars.length) return { length: 0, parts: 0, unicode: false };
    const unicode = chars.some(c => !GSM_BASIC.includes(c) && !GSM_EXTENDED.includes(c));
    const length = unicode ? chars.length : chars.reduce((n, c) => n + (GSM_EXTENDED.includes(c) ? 2 : 1), 0);
    const [single, multi] = unicode ? [70, 67] : [160, 153];
    return { length, parts: length <= single ? 1 : Math.ceil(length / multi), unicode };
}

export const MAX_SMS_PARTS = 6;
