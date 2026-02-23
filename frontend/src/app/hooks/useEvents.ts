import { useState, useEffect } from 'react';
import { Event } from '../types';

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
  collaborators: string[];
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

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
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
