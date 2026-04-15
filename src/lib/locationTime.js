/**
 * Get a time string and hour number for a given location/timezone.
 *
 * If a trip is active, we derive the destination's timezone by asking the
 * Intl API for a reasonable match. Since browsers don't expose a
 * "city → IANA timezone" lookup natively, we use a curated city map and fall
 * back to UTC for unknown destinations.
 *
 * Non-trip mode: use the device's local time directly.
 */

// Lightweight city → IANA timezone map (most common travel destinations)
const CITY_TZ_MAP = {
  // USA
  "new york": "America/New_York",
  "nyc": "America/New_York",
  "los angeles": "America/Los_Angeles",
  "la": "America/Los_Angeles",
  "chicago": "America/Chicago",
  "miami": "America/New_York",
  "san francisco": "America/Los_Angeles",
  "sf": "America/Los_Angeles",
  "las vegas": "America/Los_Angeles",
  "seattle": "America/Los_Angeles",
  "denver": "America/Denver",
  "austin": "America/Chicago",
  "dallas": "America/Chicago",
  "houston": "America/Chicago",
  "atlanta": "America/New_York",
  "boston": "America/New_York",
  "washington": "America/New_York",
  "dc": "America/New_York",
  "nashville": "America/Chicago",
  "portland": "America/Los_Angeles",
  "phoenix": "America/Phoenix",
  "honolulu": "Pacific/Honolulu",
  "hawaii": "Pacific/Honolulu",
  "anchorage": "America/Anchorage",
  // Europe
  "london": "Europe/London",
  "paris": "Europe/Paris",
  "berlin": "Europe/Berlin",
  "amsterdam": "Europe/Amsterdam",
  "barcelona": "Europe/Madrid",
  "madrid": "Europe/Madrid",
  "rome": "Europe/Rome",
  "milan": "Europe/Rome",
  "lisbon": "Europe/Lisbon",
  "vienna": "Europe/Vienna",
  "prague": "Europe/Prague",
  "budapest": "Europe/Budapest",
  "athens": "Europe/Athens",
  "istanbul": "Europe/Istanbul",
  "zurich": "Europe/Zurich",
  "brussels": "Europe/Brussels",
  "stockholm": "Europe/Stockholm",
  "oslo": "Europe/Oslo",
  "copenhagen": "Europe/Copenhagen",
  "helsinki": "Europe/Helsinki",
  "warsaw": "Europe/Warsaw",
  "moscow": "Europe/Moscow",
  // Americas
  "toronto": "America/Toronto",
  "montreal": "America/Toronto",
  "vancouver": "America/Vancouver",
  "mexico city": "America/Mexico_City",
  "cancun": "America/Cancun",
  "tulum": "America/Cancun",
  "playa del carmen": "America/Cancun",
  "havana": "America/Havana",
  "bogota": "America/Bogota",
  "lima": "America/Lima",
  "buenos aires": "America/Argentina/Buenos_Aires",
  "santiago": "America/Santiago",
  "sao paulo": "America/Sao_Paulo",
  "rio de janeiro": "America/Sao_Paulo",
  "rio": "America/Sao_Paulo",
  // Asia
  "tokyo": "Asia/Tokyo",
  "osaka": "Asia/Tokyo",
  "seoul": "Asia/Seoul",
  "beijing": "Asia/Shanghai",
  "shanghai": "Asia/Shanghai",
  "hong kong": "Asia/Hong_Kong",
  "singapore": "Asia/Singapore",
  "bangkok": "Asia/Bangkok",
  "bali": "Asia/Makassar",
  "jakarta": "Asia/Jakarta",
  "dubai": "Asia/Dubai",
  "abu dhabi": "Asia/Dubai",
  "riyadh": "Asia/Riyadh",
  "tel aviv": "Asia/Jerusalem",
  "mumbai": "Asia/Kolkata",
  "delhi": "Asia/Kolkata",
  "kolkata": "Asia/Kolkata",
  "kathmandu": "Asia/Kathmandu",
  "colombo": "Asia/Colombo",
  // Oceania
  "sydney": "Australia/Sydney",
  "melbourne": "Australia/Melbourne",
  "brisbane": "Australia/Brisbane",
  "auckland": "Pacific/Auckland",
  // Africa
  "cairo": "Africa/Cairo",
  "nairobi": "Africa/Nairobi",
  "cape town": "Africa/Johannesburg",
  "johannesburg": "Africa/Johannesburg",
  "casablanca": "Africa/Casablanca",
  "lagos": "Africa/Lagos",
};

/**
 * Given a destination string, return the best-guess IANA timezone, or null.
 */
function guessTimezone(destination) {
  if (!destination) return null;
  const lower = destination.toLowerCase();
  // Try exact match first
  if (CITY_TZ_MAP[lower]) return CITY_TZ_MAP[lower];
  // Try partial match (e.g. "Los Angeles, CA" → "los angeles")
  for (const [city, tz] of Object.entries(CITY_TZ_MAP)) {
    if (lower.includes(city)) return tz;
  }
  return null;
}

/**
 * Format a Date object as "h:mm a" in the given IANA timezone.
 * Falls back to local time if the timezone is invalid.
 */
function formatTimeInZone(date, ianaTimezone) {
  if (!ianaTimezone) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: ianaTimezone,
  });
}

/**
 * Get the current hour (0–23) in the given IANA timezone.
 */
function getHourInZone(date, ianaTimezone) {
  if (!ianaTimezone) return date.getHours();
  const h = parseInt(
    date.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: ianaTimezone }),
    10
  );
  return isNaN(h) ? date.getHours() : h;
}

/**
 * Main export — returns { time, hour, timezone, label }
 *
 * - trip mode:   time/hour based on destination timezone
 * - non-trip:    time/hour based on device local time
 */
export function getLocationTime(trip) {
  const now = new Date();

  if (trip?.destination) {
    const tz = guessTimezone(trip.destination);
    const time = formatTimeInZone(now, tz);
    const hour = getHourInZone(now, tz);
    return { time, hour, timezone: tz, destination: trip.destination };
  }

  // Non-trip: use device local time
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { time, hour: now.getHours(), timezone: null, destination: null };
}

/**
 * Greeting string using location-aware time.
 */
export function getLocationGreeting(trip) {
  const { time, hour, destination } = getLocationTime(trip);
  if (hour < 12) return `Good morning — it's ${time}. What are you in the mood for?`;
  if (hour < 17) return `It's ${time} — what do you feel like doing?`;
  if (hour < 21) return `Evening in ${destination || "your destination"} — what's the vibe tonight?`;
  return `It's ${time} — night owl energy. What's the plan?`;
}

/**
 * Full time context string for LLM prompts.
 * e.g. "Tuesday, April 15 at 2:32 PM"
 */
export function getTimeContext(trip) {
  const now = new Date();
  const { timezone, destination } = getLocationTime(trip);

  if (timezone) {
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    });
  }

  // Fallback: device locale
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}