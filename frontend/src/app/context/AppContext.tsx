/**
 * @file AppContext.tsx
 * @description Central application state provider for the MCC Calendar Hub.
 *
 * ## Architecture
 * ```
 * AppProvider
 *   ├── useClubs()          → fetches GET /clubs, maps → Club[]
 *   ├── useEvents(clubs)    → fetches GET /events after clubs load, maps → Event[]
 *   │                         also builds typeIdMap (name → UUID) from event data
 *   ├── GET /event-types    → populates eventTypeNames[], used by FilterSidebar
 *   ├── GET /auth/me        → validates stored JWT on mount, restores session
 *   ├── GET /clubs/:id/office-hours  → fetches OH slots + exceptions for all clubs
 *   └── GET /clubs/:id/members       → fetches members for all clubs (OH hydration)
 *
 * Consumers (via useApp()):
 *   Layout.tsx              reads currentUser to show role-gated nav tabs
 *   NavigationBar.tsx       reads/writes currentUser + authToken (sign-out)
 *   FilterSidebar.tsx       reads/writes selected*, advancedMode, perClubEventTypes
 *   Dashboard.tsx           reads allEvents + all filter state to build filteredEvents
 *   ClubPage.tsx            reads clubs, events; calls addEvent / updateClub / reloadOhForClub
 *   ClubManagement.tsx      reads clubs, events; calls addClub / deleteEvent
 *   EventPage.tsx           reads events, clubs; calls updateEvent
 *   Collab.tsx              reads clubs, currentUser, authToken
 * ```
 *
 * ## Auth Flow
 * Token is stored under `mcc_auth_token` in localStorage. On mount, if a token
 * exists, GET /auth/me is called to validate it and restore `currentUser`.
 * `authReady` is false only during that initial validation; ProtectedRoute
 * waits for it before deciding to redirect.
 *
 * ## Filter State
 * - `selectedClubs`: which club IDs are visible on the dashboard calendar
 * - `selectedEventTypes`: global event type filter (ignored when advancedMode=true)
 * - `advancedMode`: when true, `perClubEventTypes` is used instead of selectedEventTypes
 * - `perClubEventTypes`: Record<clubId, string[]> for per-club type overrides
 * - `searchQuery`: full-text filter on event title + description
 *
 * ## Office Hours
 * OH slots are stored in the `office_hours` DB table (not `events`). They are
 * fetched per-club after clubs load and materialized into fake Event objects via
 * `materializeOhSlots`. These are merged into `allEvents` (a superset of `events`)
 * and passed to the calendar. OH events are hidden by default (the "Office Hours"
 * event type is excluded from `selectedEventTypes` on initial load).
 */

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { addWeeks } from 'date-fns';
import { Event, Club, User, OfficeHourSlot, OfficeHourException } from '../types';
import { useClubs } from '../hooks/useClubs';
import { useEvents } from '../hooks/useEvents';
import { materializeOhSlots, getISOWeekMonday } from '../utils/officeHours';
import type { ClubMember } from '../components/OurTeam';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';
const TOKEN_KEY = 'mcc_auth_token';

interface OhClubData {
  slots: OfficeHourSlot[];
  exceptions: OfficeHourException[];
}

interface AppContextType {
  events: Event[];
  /** Real events + materialized OH events merged — use this for the calendar */
  allEvents: Event[];
  clubs: Club[];
  currentUser: User | null;
  authToken: string | null;
  /** True once the initial token-validation fetch has resolved (or if there was no stored token). */
  authReady: boolean;
  selectedClubs: string[];
  selectedEventTypes: string[];
  /** Live event type names fetched from /event-types */
  eventTypeNames: string[];
  /** Maps event type name → type UUID — used for ICS URL construction */
  typeIdMap: Record<string, string>;
  /** Global text search query applied to event title/description */
  searchQuery: string;
  /** When true, per-club event type filtering is active instead of global */
  advancedMode: boolean;
  /** Per-club selected event types, keyed by clubId. Defaults to all types if a club has no entry. */
  perClubEventTypes: Record<string, string[]>;
  loading: boolean;
  error: string | null;
  /** OH slot templates + exceptions keyed by clubId */
  ohData: Record<string, OhClubData>;
  /** Club members keyed by clubId (used for OH member hydration) */
  membersByClub: Record<string, ClubMember[]>;
  /** Re-fetches OH data for one club — call after saving changes in the OH editor */
  reloadOhForClub: (clubId: string) => Promise<void>;
  setSelectedClubs: (clubs: string[]) => void;
  setSelectedEventTypes: (types: string[]) => void;
  setSearchQuery: (q: string) => void;
  setAdvancedMode: (v: boolean) => void;
  setPerClubEventTypes: (v: Record<string, string[]>) => void;
  setCurrentUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addClub: (club: Club) => void;
  updateClub: (id: string, club: Partial<Club>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { clubs: apiClubs, loading: clubsLoading, error: clubsError } = useClubs();
  const { events: apiEvents, typeIdMap, loading: eventsLoading, error: eventsError } = useEvents(
    apiClubs,
    clubsLoading
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [eventTypeNames, setEventTypeNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [perClubEventTypes, setPerClubEventTypes] = useState<Record<string, string[]>>({});

  // Office Hours state
  const [ohData, setOhData] = useState<Record<string, OhClubData>>({});
  const [membersByClub, setMembersByClub] = useState<Record<string, ClubMember[]>>({});

  // Token persisted to localStorage so admins stay logged in across page reloads
  const [authToken, setAuthTokenState] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  // False only while we're validating a stored token on mount; prevents premature redirects
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem(TOKEN_KEY));

  const setAuthToken = (token: string | null) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setAuthTokenState(token);
  };

  // On mount: if a stored token exists, validate it and restore the user session
  useEffect(() => {
    if (!authToken) return;
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(res => (res.ok ? res.json() : null))
      .then((user: User | null) => {
        if (user) {
          setCurrentUser(user);
        } else {
          setAuthToken(null);
        }
      })
      .catch(() => setAuthToken(null))
      .finally(() => setAuthReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Sync API data into local state
  useEffect(() => { setClubs(apiClubs); }, [apiClubs]);
  useEffect(() => { setEvents(apiEvents); }, [apiEvents]);

  // Default to all clubs selected only on initial load (not when user clicks "Deselect All")
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (apiClubs.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setSelectedClubs(apiClubs.map((c) => c.id));
    }
  }, [apiClubs]);

  // Fetch live event types and default-select all on first load
  const eventTypesLoadDone = useRef(false);
  useEffect(() => {
    fetch(`${API_BASE}/event-types`)
      .then(r => r.ok ? r.json() : [])
      .then((data: { id: string; name: string }[]) => {
        const names = data.map(et => et.name);
        setEventTypeNames(names);
        if (!eventTypesLoadDone.current && names.length > 0) {
          eventTypesLoadDone.current = true;
          // By default, select all types EXCEPT "Office Hours"
          setSelectedEventTypes(names.filter(n => n.toLowerCase() !== 'office hours'));
        }
      })
      .catch(() => { });
  }, []);

  // Fetch OH slots + members for all clubs after clubs load
  const ohLoadDone = useRef(false);
  useEffect(() => {
    if (apiClubs.length === 0 || ohLoadDone.current) return;
    ohLoadDone.current = true;
    apiClubs.forEach(club => {
      fetch(`${API_BASE}/clubs/${club.id}/office-hours`)
        .then(r => r.ok ? r.json() : { slots: [], exceptions: [] })
        .then((d: OhClubData) => setOhData(prev => ({ ...prev, [club.id]: d })))
        .catch(() => { });
      fetch(`${API_BASE}/clubs/${club.id}/members`)
        .then(r => r.ok ? r.json() : [])
        .then((d: ClubMember[]) => setMembersByClub(prev => ({ ...prev, [club.id]: d })))
        .catch(() => { });
    });
  }, [apiClubs]);

  /** Re-fetch OH data for a single club (call after the OH editor saves changes). */
  const reloadOhForClub = useCallback(async (clubId: string) => {
    try {
      const r = await fetch(`${API_BASE}/clubs/${clubId}/office-hours`);
      if (r.ok) {
        const d: OhClubData = await r.json();
        setOhData(prev => ({ ...prev, [clubId]: d }));
      }
    } catch { /* ignore */ }
  }, []);

  // Materialize OH events for a rolling ±4-week window (9 weeks total)
  const ohEvents = useMemo(() => {
    const thisMonday = getISOWeekMonday(new Date()); // Monday of the current week
    const windowStart = addWeeks(thisMonday, -4);   // 4 weeks back
    return clubs.flatMap(club => {
      const { slots = [], exceptions = [] } = ohData[club.id] ?? {};
      const members = membersByClub[club.id] ?? [];
      if (slots.length === 0) return [];
      return materializeOhSlots(slots, exceptions, members, club.id, club.color, windowStart, 9);
    });
  }, [ohData, membersByClub, clubs]);

  // Merge real events + OH events — this is what the calendar consumes
  const allEvents = useMemo(() => [...events, ...ohEvents], [events, ohEvents]);

  const addEvent = (event: Event) => setEvents(prev => [...prev, event]);

  const updateEvent = (id: string, updated: Partial<Event>) =>
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));

  const deleteEvent = (id: string) =>
    setEvents(prev => prev.filter(e => e.id !== id));

  const addClub = (club: Club) => setClubs(prev => [...prev, club]);

  const updateClub = (id: string, updated: Partial<Club>) =>
    setClubs(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));

  const loading = clubsLoading || eventsLoading;
  const error = clubsError ?? eventsError;

  return (
    <AppContext.Provider
      value={{
        events,
        allEvents,
        clubs,
        currentUser,
        authToken,
        authReady,
        selectedClubs,
        selectedEventTypes,
        eventTypeNames,
        typeIdMap,
        searchQuery,
        advancedMode,
        perClubEventTypes,
        loading,
        error,
        ohData,
        membersByClub,
        reloadOhForClub,
        setSelectedClubs,
        setSelectedEventTypes,
        setSearchQuery,
        setAdvancedMode,
        setPerClubEventTypes,
        setCurrentUser,
        setAuthToken,
        addEvent,
        updateEvent,
        deleteEvent,
        addClub,
        updateClub,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
