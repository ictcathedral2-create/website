// Event date helpers shared by the public site and the admin panel.
//
// Events store `day` ("17") and `month` ("Oct") for display (the mobile app
// reads these too). Newer events also store `eventDate` ("2026-10-17"), which
// pins the year: once that date has passed the event is over, instead of
// silently rolling forward to the same day next year.

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Resolves a "day + short month" pair to the nearest upcoming date, rolling to next year once passed.
export function resolveEventDate(day, monthAbbr) {
    const now = new Date();
    const monthIndex = new Date(`${monthAbbr} 1, 2000`).getMonth();
    const dayNumber = Number(day);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31 || Number.isNaN(monthIndex)) return null;
    let candidate = new Date(now.getFullYear(), monthIndex, dayNumber, 23, 59, 59);
    // JavaScript rolls invalid dates (for example, 31 February) into the next
    // month. Reject those records instead of showing an event on the wrong day.
    if (candidate.getMonth() !== monthIndex || candidate.getDate() !== dayNumber) return null;
    if (candidate < now) candidate = new Date(now.getFullYear() + 1, monthIndex, Number(day), 23, 59, 59);
    return candidate;
}

// Parses "YYYY-MM-DD" as the end of that local day, or null if malformed.
export function parseIsoDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d, 23, 59, 59);
    return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

// The date an event happens on: its pinned `eventDate` if it has one (null once
// past, so it drops off the site), otherwise the legacy day/month roll-forward.
export function eventDateOf(event) {
    if (event.eventDate) {
        const date = parseIsoDate(event.eventDate);
        return date && date >= new Date() ? date : null;
    }
    return resolveEventDate(event.day, event.month);
}

export const toIsoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// "14:00" -> "2:00 PM"
export function formatTime(hhmm) {
    const match = /^(\d{2}):(\d{2})$/.exec(hhmm || "");
    if (!match) return "";
    const h = Number(match[1]);
    return `${h % 12 || 12}:${match[2]} ${h < 12 ? "AM" : "PM"}`;
}

// Display text for an event's schedule, e.g. "Sat · 2:00 PM – 5:00 PM".
export function suggestedTimeText({ eventDate, startTime, endTime }) {
    const date = parseIsoDate(eventDate);
    const parts = [];
    if (date) parts.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    if (startTime) parts.push(endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime));
    return parts.join(" · ");
}

// Times like "3:00 PM" / "3pm" mentioned in free text, as "HH:MM".
export function timesMentioned(text) {
    const found = [];
    const re = /\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\b/gi;
    let match;
    while ((match = re.exec(text || ""))) {
        let h = Number(match[1]) % 12;
        if (match[3].toLowerCase() === "p") h += 12;
        found.push(`${String(h).padStart(2, "0")}:${match[2] || "00"}`);
    }
    return found;
}

// Problems an admin should look at before an event goes out, in plain words.
export function eventWarnings(event) {
    const warnings = [];
    if (event.eventDate) {
        const date = parseIsoDate(event.eventDate);
        if (!date) warnings.push("The date is not valid.");
        else if (date < new Date()) warnings.push("This date has passed, so the event is hidden from the website. Update the date or delete it.");
    } else {
        const resolved = resolveEventDate(event.day, event.month);
        if (!resolved) warnings.push("The date is not valid, so this event is hidden from the website.");
        else if (resolved.getFullYear() > new Date().getFullYear()) {
            warnings.push(`No year is set, so the website shows this as ${resolved.getDate()} ${MONTHS[resolved.getMonth()]} ${resolved.getFullYear()}. Edit it and pick the real date.`);
        }
    }
    if (event.startTime) {
        const hour = Number(event.startTime.slice(0, 2));
        if (hour < 6) warnings.push(`It starts at ${formatTime(event.startTime)} (night time). Check whether you meant PM.`);
        const mentioned = timesMentioned(event.time);
        if (mentioned.length && !mentioned.includes(event.startTime)) {
            warnings.push(`The start time is ${formatTime(event.startTime)}, but the text shown to visitors says ${formatTime(mentioned[0])}.`);
        }
    }
    if (event.endTime && event.startTime && event.endTime <= event.startTime) warnings.push("The end time is before the start time.");
    return warnings;
}
