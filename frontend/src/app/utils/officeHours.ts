import { addDays, addWeeks, format } from 'date-fns';
import type { OfficeHourSlot, OfficeHourException, Event } from '../types';
import type { ClubMember } from '../components/OurTeam';

/**
 * Materializes recurring OH slot templates into fake Event objects for a
 * rolling window of weeks. These events are merged into the main events array
 * in AppContext so CalendarGrid and filters work without any changes.
 *
 * Event IDs are of the form `oh-<slotId>-<YYYY-MM-DD>` and never collide with
 * real UUID-based event rows. The `officeHourSlotId` field on the returned
 * events identifies them as materialized OH events.
 *
 * @param slots        Active OH slot templates for a single club
 * @param exceptions   Per-week overrides/deletions for those slots
 * @param members      Club members used to hydrate member_ids → names/photos
 * @param clubId       The club these slots belong to
 * @param clubColor    Calendar color for the club
 * @param windowStart  ISO Monday (day_of_week=1) of the first week to generate
 * @param numWeeks     How many consecutive weeks to generate (e.g. 9 for ±4w)
 */
export function materializeOhSlots(
  slots: OfficeHourSlot[],
  exceptions: OfficeHourException[],
  members: ClubMember[],
  clubId: string,
  clubColor: string,
  windowStart: Date,
  numWeeks: number
): Event[] {
  const memberMap = new Map(members.map(m => [m.id, m]));

  // Key: `${slot_id}-${week_of}` → exception for fast lookup
  const excMap = new Map(exceptions.map(e => [`${e.slot_id}-${e.week_of}`, e]));

  const events: Event[] = [];

  for (let w = 0; w < numWeeks; w++) {
    const weekStart = addWeeks(windowStart, w);
    const weekOf = format(weekStart, 'yyyy-MM-dd'); // ISO Monday of this week

    for (const slot of slots) {
      if (!slot.active) continue;

      const exc = excMap.get(`${slot.id}-${weekOf}`);
      if (exc?.deleted) continue;

      // Apply exception overrides or fall back to template values
      const st = exc?.start_time ?? slot.start_time;
      const et = exc?.end_time ?? slot.end_time;
      const loc = exc?.location ?? slot.location;
      const mids = exc?.member_ids ?? slot.member_ids;

      // day_of_week: 1=Mon … 5=Fri; weekStart is Monday (offset 0)
      const slotDate = addDays(weekStart, slot.day_of_week - 1);

      const [sh, sm] = st.split(':').map(Number);
      const [eh, em] = et.split(':').map(Number);
      const startTime = new Date(slotDate);
      startTime.setHours(sh, sm, 0, 0);
      const endTime = new Date(slotDate);
      endTime.setHours(eh, em, 0, 0);

      const slotMembers = mids
        .map(id => memberMap.get(id))
        .filter((m): m is ClubMember => m !== undefined);

      events.push({
        id: `oh-${slot.id}-${format(slotDate, 'yyyy-MM-dd')}`,
        title: 'Office Hours',
        description: slotMembers.map(m => m.name).join(', '),
        location: loc ?? '',
        startTime,
        endTime,
        clubId,
        eventType: 'Office Hours',
        color: clubColor,
        requiresRsvp: false,
        officeHourSlotId: slot.id,
        officeHourMembers: slotMembers.map(m => ({
          id: m.id,
          name: m.name,
          photo_url: m.photo_url,
        })),
        collaborators: [],
      });
    }
  }

  return events;
}

/** Returns the ISO Monday (weekStartsOn=1) for a given date, without date-fns locale dependency. */
export function getISOWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format 'HH:mm' time string to '10:00 AM' display string. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
export const DAY_FULL_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
