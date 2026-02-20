import { createContext, useContext, useState, ReactNode } from 'react';
import { Event, Club, User } from '../types';
import { events as initialEvents, clubs as initialClubs, users } from '../data/mockData';

interface AppContextType {
  events: Event[];
  clubs: Club[];
  currentUser: User | null;
  selectedClubs: string[];
  selectedEventTypes: string[];
  setSelectedClubs: (clubs: string[]) => void;
  setSelectedEventTypes: (types: string[]) => void;
  setCurrentUser: (user: User | null) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addClub: (club: Club) => void;
  updateClub: (id: string, club: Partial<Club>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  const addEvent = (event: Event) => {
    setEvents([...events, event]);
  };

  const updateEvent = (id: string, updatedEvent: Partial<Event>) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, ...updatedEvent } : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const addClub = (club: Club) => {
    setClubs([...clubs, club]);
  };

  const updateClub = (id: string, updatedClub: Partial<Club>) => {
    setClubs(clubs.map(club => 
      club.id === id ? { ...club, ...updatedClub } : club
    ));
  };

  return (
    <AppContext.Provider
      value={{
        events,
        clubs,
        currentUser,
        selectedClubs,
        selectedEventTypes,
        setSelectedClubs,
        setSelectedEventTypes,
        setCurrentUser,
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
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}