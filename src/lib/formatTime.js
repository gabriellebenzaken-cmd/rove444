/**
 * Centralized time formatting utility
 * Converts all times to 12-hour AM/PM format (h:mm A)
 * Examples: 19:30 → 7:30 PM, 14:00 → 2:00 PM, 09:00 → 9:00 AM
 */

/**
 * Format a time string (HH:mm or H:mm) to 12-hour AM/PM format
 * @param {string} timeStr - Time in 24-hour format (e.g., "19:30", "9:00", "14:15")
 * @returns {string|null} - Formatted time (e.g., "7:30 PM") or null if invalid
 */
export function formatTime12Hour(timeStr) {
  if (!timeStr) return null;
  
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  
  if (isNaN(h)) return null;
  
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  
  return `${h12}:${m} ${ampm}`;
}

/**
 * Format a Date object to 12-hour time string
 * @param {Date} date - Date object
 * @returns {string} - Formatted time (e.g., "2:30 PM")
 */
export function formatDateToTime12Hour(date) {
  if (!date) return null;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}