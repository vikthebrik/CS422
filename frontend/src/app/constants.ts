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
