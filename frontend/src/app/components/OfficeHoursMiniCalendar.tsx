/**
 * @file OfficeHoursMiniCalendar.tsx
 * @description Compact public-facing weekly calendar showing a club's office hours.
 *
 * Renders a Mon–Fri grid for the current week. Each slot card shows time range,
 * location, and member avatars. Navigating weeks with prev/next chevrons re-materializes
 * the slots for that week using the same `materializeOhSlots` utility as AppContext.
 *
 * When `canEdit` is true (club admin), each slot card has a "Skip week" / "Edit week"
 * sub-action that delegates to the `onEditException` callback in ClubPage.
 */

import { useState } from 'react';
import { addWeeks, format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Pencil, Ban } from 'lucide-react';
import { Button } from './ui/button';
import { materializeOhSlots, getISOWeekMonday, formatTime, DAY_NAMES } from '../utils/officeHours';
import type { OfficeHourSlot, OfficeHourException, Event } from '../types';
import type { ClubMember } from './OurTeam';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface OfficeHoursMiniCalendarProps {
  clubId: string;
  clubColor: string;
  slots: OfficeHourSlot[];
  exceptions: OfficeHourException[];
  members: ClubMember[];
  canEdit?: boolean;
  onEditException?: (slot: OfficeHourSlot, weekOf: string, existingException: OfficeHourException | null) => void;
}

export function OfficeHoursMiniCalendar({
  clubId,
  clubColor,
  slots,
  exceptions,
  members,
  canEdit = false,
  onEditException,
}: OfficeHoursMiniCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const thisMonday = getISOWeekMonday(new Date());
  const weekStart = addWeeks(thisMonday, weekOffset);
  const weekOf = format(weekStart, 'yyyy-MM-dd');

  // Materialize for exactly this one week
  const ohEvents = materializeOhSlots(
    slots,
    exceptions,
    members,
    clubId,
    clubColor,
    weekStart,
    1
  );

  // Group events by day_of_week (1–5)
  const byDay: Record<number, Event[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const e of ohEvents) {
    const dow = slots.find(s => s.id === e.officeHourSlotId)?.day_of_week;
    if (dow) byDay[dow].push(e);
  }

  const weekLabel = (() => {
    const end = addDays(weekStart, 4); // Friday
    return `${format(weekStart, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  })();

  const hasAny = ohEvents.length > 0;

  return (
    <div className="space-y-3">
      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset(w => w - 1)}
          title="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">{weekLabel}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset(w => w + 1)}
          title="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-5 gap-1.5">
        {([1, 2, 3, 4, 5] as const).map(dow => {
          const dayDate = addDays(weekStart, dow - 1);
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const daySlots = byDay[dow];

          return (
            <div key={dow} className="flex flex-col gap-1">
              {/* Day header */}
              <div
                className={`text-center text-xs font-medium py-1 rounded ${
                  isToday
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <div>{DAY_NAMES[dow - 1]}</div>
                <div className="text-[10px] opacity-70">{format(dayDate, 'M/d')}</div>
              </div>

              {/* Slot cards */}
              {daySlots.length === 0 ? (
                <div className="flex-1 rounded border border-dashed border-border min-h-[60px]" />
              ) : (
                daySlots.map(event => {
                  const slotId = event.officeHourSlotId!;
                  const excKey = `${slotId}-${weekOf}`;
                  const exc = exceptions.find(e => `${e.slot_id}-${e.week_of}` === excKey) ?? null;

                  return (
                    <div
                      key={event.id}
                      className="rounded border border-border bg-card p-1.5 text-[11px] space-y-1 relative group"
                      style={{ borderLeftWidth: 3, borderLeftColor: clubColor }}
                    >
                      {/* Time */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">
                          {formatTime(exc?.start_time ?? slots.find(s => s.id === slotId)!.start_time)}
                          {' – '}
                          {formatTime(exc?.end_time ?? slots.find(s => s.id === slotId)!.end_time)}
                        </span>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-1 text-muted-foreground truncate">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {/* Member avatars */}
                      {(event.officeHourMembers ?? []).length > 0 && (
                        <MemberAvatarRow members={event.officeHourMembers!} />
                      )}

                      {/* Admin exception controls */}
                      {canEdit && onEditException && (
                        <div className="hidden group-hover:flex gap-1 pt-0.5">
                          <button
                            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                            title="Edit this week"
                            onClick={() => onEditException(
                              slots.find(s => s.id === slotId)!,
                              weekOf,
                              exc
                            )}
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                          <button
                            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-destructive"
                            title="Skip this week"
                            onClick={() => onEditException(
                              slots.find(s => s.id === slotId)!,
                              weekOf,
                              { ...(exc ?? { id: '', slot_id: slotId, week_of: weekOf, start_time: null, end_time: null, location: null, member_ids: null }), deleted: true }
                            )}
                          >
                            <Ban className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {!hasAny && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No office hours scheduled this week.
        </p>
      )}
    </div>
  );
}

function MemberAvatarRow({ members }: { members: { id: string; name: string; photo_url: string | null }[] }) {
  const visible = members.slice(0, 3);
  const overflow = members.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map(m => (
        <div key={m.id} title={m.name} className="w-5 h-5 rounded-full border border-background overflow-hidden shrink-0">
          {m.photo_url ? (
            <ImageWithFallback src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-[8px] font-medium"
            >
              {m.name.substring(0, 1)}
            </div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-5 h-5 rounded-full border border-background bg-muted flex items-center justify-center text-[8px] text-muted-foreground shrink-0">
          +{overflow}
        </div>
      )}
    </div>
  );
}
