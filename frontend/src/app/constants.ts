import type { Event } from './types';

/** Max number of upcoming events to show in club event lists (club page, admin club view). */
export const UPCOMING_EVENTS_LIMIT = 5;

/**
 * Returns upcoming events for a club: not yet ended, sorted by start time ascending, capped by UPCOMING_EVENTS_LIMIT.
 * Use this for club detail page and admin "Your Events" so behavior is consistent.
 */
export function getUpcomingClubEvents(events: Event[], clubId: string): Event[] {
  const now = Date.now();
  return events
    .filter((e) => e.clubId === clubId && e.endTime.getTime() >= now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, UPCOMING_EVENTS_LIMIT);
}

/**
 * Returns past events for a club: already ended, sorted by start time descending (most recent first).
 */
export function getPastClubEvents(events: Event[], clubId: string): Event[] {
  const now = Date.now();
  return events
    .filter((e) => e.clubId === clubId && e.endTime.getTime() < now)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

/**
 * Common UO building keywords.  If the location contains any of these (whole-word,
 * case-insensitive) it is treated as a UO campus location and linked to the UO map.
 */
const UO_BUILDINGS = [
  'EMU', 'LLC', 'PLC', 'HEDCO',
  'Lillis', 'Allen', 'Fenton', 'Lawrence', 'Villard', 'Deady', 'Chapman',
  'Friendly', 'Straub', 'Condon', 'Hedrick', 'McKenzie', 'Knight Library',
  'Knight Campus', 'Science Library', 'Oregon Hall', 'Agate', 'Hamilton',
  'Carson', 'Earl', 'Unthank', 'Pacific', 'Lokey', 'Price Science',
  'Tykeson', 'Gerlinger', 'Willamette', 'Frohnmayer', 'Gilbert', 'Johnson',
  'Autzen', 'Hayward', 'Matthew Knight', 'Kalapuya', 'Global Scholars',
  'Bean', 'Deschutes', 'University Health', 'Erb Memorial',
];

/**
 * Detects whether a location string refers to a UO campus location and
 * returns the most useful map URL.
 *
 * Priority order:
 *  1. Room code (letters + 3–4 digit number, e.g. "M101", "EMU 119") →
 *     UO map with the room code pre-filled in the search bar.
 *  2. Known UO building name (e.g. "Knight Library", "EMU", "Lillis") →
 *     UO map with the building name as the search query.
 *  3. Everything else → Google Maps.
 */
export function getLocationUrl(location: string): { url: string; label: string } {
  // 1. Room code check
  const roomPattern = /\b([A-Za-z]{1,5})\s*(\d{3,4}[A-Za-z]?)\b/;
  const roomMatch = location.match(roomPattern);
  if (roomMatch) {
    const roomCode = roomMatch[0].trim();
    return {
      url: `https://map.uoregon.edu/?search=${encodeURIComponent(roomCode)}`,
      label: 'View on UO Map',
    };
  }

  // 2. Known UO building name check
  const loc = location.toLowerCase();
  const matchedBuilding = UO_BUILDINGS.find(b =>
    new RegExp(`\\b${b.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(loc)
  );
  if (matchedBuilding) {
    return {
      url: `https://map.uoregon.edu/?search=${encodeURIComponent(location)}`,
      label: 'View on UO Map',
    };
  }

  // 3. Fallback to Google Maps
  return {
    url: `https://maps.google.com/?q=${encodeURIComponent(location + ', University of Oregon')}`,
    label: 'View on Google Maps',
  };
}
