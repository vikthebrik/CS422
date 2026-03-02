import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';

// Dismissed state resets daily — keyed by date so it re-shows the next day
const getSessionKey = () => `mcc_reminder_dismissed_${new Date().toDateString()}`;

export function EventReminderPopup() {
  const { events, loading } = useApp();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem(getSessionKey()) === '1'
  );

  const relevantEvents = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon … 5=Fri, 6=Sat

    // Compute window end: end of today; extend through Sunday for Fri/Sat/Sun
    const windowEnd = new Date(now);
    if (day === 5) windowEnd.setDate(windowEnd.getDate() + 2);      // Fri → +2 → Sun
    else if (day === 6) windowEnd.setDate(windowEnd.getDate() + 1); // Sat → +1 → Sun
    windowEnd.setHours(23, 59, 59, 999);

    return events
      .filter(e =>
        e.eventType === 'Events' &&
        e.startTime.getTime() > now.getTime() &&
        e.startTime.getTime() <= windowEnd.getTime()
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [events]);

  // Show after a 1.5 s delay so the page settles first
  useEffect(() => {
    if (loading || relevantEvents.length === 0 || dismissed) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [loading, relevantEvents.length, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(getSessionKey(), '1');
  };

  if (!visible || dismissed) return null;

  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 5 || day === 6 || day === 0;

  const todayCount = relevantEvents.filter(e =>
    e.startTime.toDateString() === now.toDateString()
  ).length;
  const weekendCount = relevantEvents.length - todayCount;

  let headline: string;
  if (isWeekend && weekendCount > 0 && todayCount === 0) {
    headline = `${relevantEvents.length} event${relevantEvents.length !== 1 ? 's' : ''} this weekend`;
  } else if (isWeekend && weekendCount > 0) {
    headline = `${relevantEvents.length} event${relevantEvents.length !== 1 ? 's' : ''} today & this weekend`;
  } else {
    headline = `${relevantEvents.length} event${relevantEvents.length !== 1 ? 's' : ''} happening today`;
  }

  const preview = relevantEvents.slice(0, 3);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-76 rounded-xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-sm font-medium">{headline}</span>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Event list */}
      <div className="px-3 py-2 space-y-1">
        {preview.map(event => (
          <Link
            key={event.id}
            to={`/event/${event.id}`}
            onClick={handleDismiss}
            className="flex flex-col gap-0.5 rounded-lg px-2 py-1.5 -mx-2 hover:bg-accent/50 transition-colors"
          >
            <span className="text-sm font-medium line-clamp-1">{event.title}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                {format(event.startTime, 'EEE h:mm a')}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>
          </Link>
        ))}
        {relevantEvents.length > 3 && (
          <p className="text-xs text-muted-foreground text-center py-0.5">
            +{relevantEvents.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}
