/**
 * @file EventDetailModal.tsx
 * @description Read-only event detail modal opened from Dashboard (CalendarGrid click).
 *
 * ## Displayed Fields
 * - Title, event type badge, hosting club badge (colored)
 * - Description
 * - Date (formatted long-form)
 * - Time range + computed duration in hours
 * - Location + smart map link via `getLocationUrl()` (UO map or Google Maps)
 * - RSVP section (only when `event.requiresRsvp === true`):
 *   - RSVP note (if set)
 *   - RSVP link button, or fallback "link coming soon" pill
 * - Hosted by club name
 *
 * ## Office Hours Events
 * When `event.officeHourSlotId` is set, the modal renders a simplified OH view:
 * - Member avatar list from `event.officeHourMembers`
 * - "View on Club Page" link — no Edit/Delete/RSVP controls
 *
 * ## Dependencies
 * | Dependency        | Purpose                                    |
 * |-------------------|--------------------------------------------|
 * | AppContext (clubs) | Looks up club by `event.clubId` for color/name |
 * | constants.ts      | `getLocationUrl()` for smart map linking   |
 *
 * ## Props
 * | Prop          | Type                      | Description                    |
 * |---------------|---------------------------|--------------------------------|
 * | event         | Event \| null             | Event to display; null = hidden |
 * | open          | boolean                   | Controls Dialog open state     |
 * | onOpenChange  | (open: boolean) => void   | Passed to Dialog for close     |
 *
 * ## Note
 * For edit/delete actions on an event, see `EventPage.tsx` (/event/:eventId),
 * which is the full event detail page with admin editing capabilities.
 */

import { Calendar, Clock, MapPin, Users, Ticket, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Event } from '../types';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import { getLocationUrl } from '../constants';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface EventDetailModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({ event, open, onOpenChange }: EventDetailModalProps) {
  const { clubs } = useApp();

  if (!event) return null;

  const club = clubs.find(c => c.id === event.clubId);
  const isOH = Boolean(event.officeHourSlotId);

  // ── Office Hours variant ────────────────────────────────────────────────────
  if (isOH) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Office Hours
              {club && (
                <Badge className="text-white text-xs" style={{ backgroundColor: club.color }}>
                  {club.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date & Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{format(event.startTime, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{format(event.startTime, 'h:mm a')} – {format(event.endTime, 'h:mm a')}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {/* Member list */}
            {(event.officeHourMembers ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Who's there</p>
                <div className="flex flex-col gap-2">
                  {event.officeHourMembers!.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-border shrink-0">
                        {m.photo_url ? (
                          <ImageWithFallback src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium">
                            {m.name.substring(0, 1)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link to club page */}
            <div className="pt-3 border-t border-border">
              <Link
                to={`/club/${event.clubId}`}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View {club?.name ?? 'club'} page
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Standard event variant ─────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Type & Club */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{event.eventType}</Badge>
            {club && (
              <Badge
                className="text-white"
                style={{ backgroundColor: club.color }}
              >
                <Users className="h-3 w-3 mr-1" />
                {club.name}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {format(event.startTime, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Duration: {Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60) * 10) / 10} hours
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{event.location}</div>
                {(() => {
                  const { url, label } = getLocationUrl(event.location);
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {label} →
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* RSVP / Tickets */}
          {event.requiresRsvp && (
            <div className="space-y-2">
              {event.rsvpNote && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
                  <Ticket className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{event.rsvpNote}</span>
                </div>
              )}
              <a
                href={event.rsvpLink || '/rsvp-unavailable'}
                target={event.rsvpLink ? '_blank' : undefined}
                rel={event.rsvpLink ? 'noopener noreferrer' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <span className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Tickets / RSVP
                </span>
                <span className="text-xs font-normal opacity-80">Click here to register</span>
              </a>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Hosted by <span className="font-medium text-foreground">{club?.name}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
