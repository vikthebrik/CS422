/**
 * @file Dashboard.tsx
 * @description Main calendar view — the default route ("/").
 *
 * ## Responsibilities
 * - Reads filter state from AppContext and derives `filteredEvents` via useMemo
 * - Renders CalendarGrid with the filtered event list
 * - Opens EventDetailModal when a calendar event is clicked
 * - Shows EmptyState when no clubs are selected or no events match filters
 *
 * ## Filter Logic (applied in order)
 * 1. **Club filter**: keep events where `event.clubId` or any `collaborator.club_id`
 *    is in `selectedClubs`
 * 2. **Event type filter**:
 *    - Normal mode: keep events whose `eventType` is in `selectedEventTypes`
 *    - Advanced mode: per-club override — uses `perClubEventTypes[event.clubId]`
 *      falling back to all `eventTypeNames` if no override set
 * 3. **Search**: case-insensitive match on `event.title` or `event.description`
 *
 * ## Dependencies
 * | Component        | Role                                   |
 * |------------------|----------------------------------------|
 * | CalendarGrid     | Renders day/week/month calendar views  |
 * | EventDetailModal | Modal shown on event click             |
 * | EmptyState       | Fallback when filteredEvents is empty  |
 * | AppContext        | Provides events + all filter state     |
 */

import { useState, useMemo } from 'react';
import { CalendarGrid } from '../components/CalendarGrid';
import { EventDetailModal } from '../components/EventDetailModal';
import { EmptyState } from '../components/EmptyState';
import { Event } from '../types';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const {
    events,
    selectedClubs,
    selectedEventTypes,
    eventTypeNames,
    searchQuery,
    advancedMode,
    perClubEventTypes,
    loading,
    error,
  } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedClubs.length > 0) {
      filtered = filtered.filter(event =>
        selectedClubs.includes(event.clubId) ||
        (event.collaborators ?? []).some(c => selectedClubs.includes(c.club_id))
      );
    }

    if (advancedMode) {
      filtered = filtered.filter(event => {
        const types = perClubEventTypes[event.clubId] ?? eventTypeNames;
        return types.includes(event.eventType);
      });
    } else if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(event => selectedEventTypes.includes(event.eventType));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [events, selectedClubs, selectedEventTypes, advancedMode, perClubEventTypes, searchQuery, eventTypeNames]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Loading events…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24 text-destructive">
        <div className="text-center space-y-2">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedClubs.length === 0 ? (
        <EmptyState />
      ) : filteredEvents.length === 0 ? (
        <EmptyState />
      ) : (
        <CalendarGrid events={filteredEvents} onEventClick={handleEventClick} />
      )}

      <EventDetailModal
        event={selectedEvent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
