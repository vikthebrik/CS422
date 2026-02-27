import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Event, Club, User } from '../types';
import { useClubs } from '../hooks/useClubs';
import { useEvents } from '../hooks/useEvents';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'mcc_auth_token';

interface AppContextType {
  events: Event[];
  clubs: Club[];
  currentUser: User | null;
  authToken: string | null;
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

  // Token persisted to localStorage so admins stay logged in across page reloads
  const [authToken, setAuthTokenState] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );

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
          // Token is invalid or expired — clear it
          setAuthToken(null);
        }
      })
      .catch(() => setAuthToken(null));
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
        clubs,
        currentUser,
        authToken,
        selectedClubs,
        selectedEventTypes,
        eventTypeNames,
        typeIdMap,
        searchQuery,
        advancedMode,
        perClubEventTypes,
        loading,
        error,
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
