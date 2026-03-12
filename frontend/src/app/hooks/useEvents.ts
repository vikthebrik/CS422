/**
 * @file useEvents.ts
 * @description Data-fetching hook that retrieves all events from the backend.
 *
 * ## Data Flow
 * ```
 * GET /events (via Vite proxy → /api/events)
 *   └─► ApiEvent[] (snake_case DB fields)
 *         └─► mapApiEvent(event, clubColorMap) → Event[]
 *               └─► AppContext.events
 *
 * Side-effect: builds typeIdMap (event type name → UUID) from returned data.
 *   typeIdMap is exposed via AppContext and consumed by SubscriptionLinkGenerator.
 * ```
 *
 * ## Dependencies
 * - Waits for `useClubs` to finish loading before fetching (clubs must exist first
 *   so club colors can be applied to each event).
 * - If clubs loaded but the DB is empty (no clubs), events fetch is skipped.
 *
 * ## API → Frontend Field Map
 * | API field        | Event field      |
 * |------------------|------------------|
 * | `start_time`     | `startTime` (Date) |
 * | `end_time`       | `endTime` (Date)   |
 * | `club_id`        | `clubId`           |
 * | `type`           | `eventType`        |
 * | `requires_rsvp`  | `requiresRsvp`     |
 * | `rsvp_link`      | `rsvpLink`         |
 * | `rsvp_note`      | `rsvpNote`         |
 * | `collaborators`  | `collaborators` (CollaboratorInfo[]) |
 */

import { useState, useEffect } from 'react';
import { Event, CollaboratorInfo } from '../types';

interface ApiEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  club_id: string;
  type_id: string;
  club_name: string | null;
  club_logo: string | null;
  type: string;
  collaborators: CollaboratorInfo[];
  requires_rsvp: boolean | null;
  rsvp_link: string | null;
  rsvp_note?: string | null;
  manually_edited?: boolean | null;
  synced?: boolean | null;
}

function mapApiEvent(
  apiEvent: ApiEvent,
  clubColorMap: Record<string, string>
): Event {
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description ?? '',
    location: apiEvent.location ?? '',
    startTime: new Date(apiEvent.start_time),
    endTime: new Date(apiEvent.end_time),
    clubId: apiEvent.club_id,
    eventType: apiEvent.type,
    color: clubColorMap[apiEvent.club_id],
    requiresRsvp: apiEvent.requires_rsvp ?? false,
    rsvpLink: apiEvent.rsvp_link ?? null,
    rsvpNote: apiEvent.rsvp_note ?? null,
    manuallyEdited: apiEvent.manually_edited ?? false,
    synced: (apiEvent as any).synced ?? false,
    collaborators: apiEvent.collaborators ?? [],
  };
}

export interface UseEventsResult {
  events: Event[];
  /** Maps event type name (e.g. "Meeting") → type UUID, for ICS URL construction */
  typeIdMap: Record<string, string>;
  loading: boolean;
  error: string | null;
}

export function useEvents(
  clubs: { id: string; color: string }[],
  clubsLoading: boolean
): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [typeIdMap, setTypeIdMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for clubs to finish loading before deciding what to do
    if (clubsLoading) return;

    // If clubs loaded but DB is empty, there are no events to fetch
    if (clubs.length === 0) {
      setLoading(false);
      return;
    }

    const baseUrl = '/api';
    const clubColorMap: Record<string, string> = {};
    clubs.forEach(c => { clubColorMap[c.id] = c.color; });

    fetch(`${baseUrl}/events`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load events`);
        return res.json();
      })
      .then((data: ApiEvent[]) => {
        // Build type name → type_id map from the returned data
        const map: Record<string, string> = {};
        data.forEach(e => {
          if (e.type && e.type_id) {
            map[e.type] = e.type_id;
          }
        });
        setTypeIdMap(map);
        setEvents(data.map(e => mapApiEvent(e, clubColorMap)));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch events:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [clubs, clubsLoading]);

  return { events, typeIdMap, loading, error };
}
