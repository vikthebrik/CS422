import { useState, useMemo } from 'react';
import { CalendarGrid } from '../components/CalendarGrid';
import { EventDetailModal } from '../components/EventDetailModal';
import { SubscriptionLinkGenerator } from '../components/SubscriptionLinkGenerator';
import { EmptyState } from '../components/EmptyState';
import { Event } from '../types';
import { useApp } from '../context/AppContext';

export function Dashboard() {
  const { events, selectedClubs, selectedEventTypes } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedClubs.length > 0) {
      filtered = filtered.filter(event => selectedClubs.includes(event.clubId));
    }

    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(event => selectedEventTypes.includes(event.eventType));
    }

    return filtered;
  }, [events, selectedClubs, selectedEventTypes]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {selectedClubs.length === 0 ? (
        <EmptyState />
      ) : filteredEvents.length === 0 ? (
        <EmptyState />
      ) : (
        <CalendarGrid events={filteredEvents} onEventClick={handleEventClick} />
      )}

      <SubscriptionLinkGenerator />

      <EventDetailModal
        event={selectedEvent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
