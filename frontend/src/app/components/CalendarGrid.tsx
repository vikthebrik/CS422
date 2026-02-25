import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Event } from "../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useNavigate } from "react-router";
import { useApp } from "../context/AppContext";

interface CalendarGridProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

type CalendarView = 'day' | 'week' | 'month';

interface CalendarState {
  date: Date;
  view: CalendarView;
}

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

export function CalendarGrid({
  events,
  onEventClick,
}: CalendarGridProps) {
  const today = new Date();
  const defaultView: CalendarView = isMobile() ? 'day' : 'month';
  const [currentDate, setCurrentDate] = useState(today);
  const [view, setView] = useState<CalendarView>(defaultView);
  const [history, setHistory] = useState<CalendarState[]>([{ date: today, view: defaultView }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const { clubs } = useApp();
  const navigate = useNavigate();

  // Calculate date ranges based on view
  const { displayStart, displayEnd, displayDays } = useMemo(() => {
    if (view === 'day') {
      return {
        displayStart: startOfDay(currentDate),
        displayEnd: endOfDay(currentDate),
        displayDays: [currentDate],
      };
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return {
        displayStart: weekStart,
        displayEnd: weekEnd,
        displayDays: eachDayOfInterval({ start: weekStart, end: weekEnd }),
      };
    } else {
      // month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return {
        displayStart: calendarStart,
        displayEnd: calendarEnd,
        displayDays: eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
      };
    }
  }, [currentDate, view]);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) =>
      isSameDay(event.startTime, day),
    );
  };

  // Navigation functions based on view
  const navigatePrevious = () => {
    if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Add navigation state to history
  const addToHistory = (date: Date, viewType: CalendarView) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ date, view: viewType });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Navigate back in history
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentDate(state.date);
      setView(state.view);
    }
  };

  // Navigate forward in history
  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentDate(state.date);
      setView(state.view);
    }
  };

  // Navigate to a specific day in day view
  const goToDayView = (date: Date) => {
    setCurrentDate(date);
    setView('day');
    addToHistory(date, 'day');
  };

  // Format display title based on view
  const getDisplayTitle = () => {
    if (view === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold min-w-0 break-words">{getDisplayTitle()}</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* View Selector */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('day')}
                className={`rounded-none ${view === 'day' ? 'bg-primary' : ''}`}
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className={`rounded-none border-x border-border ${view === 'week' ? 'bg-primary' : ''}`}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className={`rounded-none ${view === 'month' ? 'bg-primary' : ''}`}
              >
                Month
              </Button>
            </div>

            {/* Navigation Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={navigatePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={navigateNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 min-w-0 overflow-x-hidden">
        {view === 'month' && (
          <>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {displayDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(
                  day,
                  currentDate,
                );
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={index}
                    className={`
                      min-h-24 border border-border rounded-lg p-2
                      ${!isCurrentMonth ? "bg-muted/30" : "bg-card"}
                      ${isToday ? "ring-2 ring-primary" : ""}
                    `}
                  >
                    <div
                      className={`
                        text-sm mb-1
                        ${!isCurrentMonth ? "text-muted-foreground" : "text-foreground"}
                        ${isToday ? "font-bold text-primary" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      <TooltipProvider>
                        {dayEvents.slice(0, 3).map((event) => {
                          const club = clubs.find(
                            (c) => c.id === event.clubId,
                          );
                          return (
                            <Tooltip key={event.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    navigate(`/event/${event.id}`)
                                  }
                                  className="w-full text-left text-xs p-1 rounded truncate hover:opacity-80 transition-opacity"
                                  style={{
                                    backgroundColor: event.color,
                                  }}
                                >
                                  <span className="text-white drop-shadow">
                                    {format(
                                      event.startTime,
                                      "h:mm a",
                                    )}{" "}
                                    {event.title}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-xs"
                              >
                                <div className="space-y-1">
                                  {club && (
                                    <p className="text-base font-bold text-white mb-2">
                                      {club.name}
                                    </p>
                                  )}
                                  <p className="font-medium text-white">
                                    {event.title}
                                  </p>
                                  {event.description && (
                                    <p className="text-xs text-white">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.location && (
                                    <p className="text-xs text-white">
                                      📍 {event.location}
                                    </p>
                                  )}
                                  <p className="text-xs text-white">
                                    🕐{" "}
                                    {format(
                                      event.startTime,
                                      "h:mm a",
                                    )}{" "}
                                    -{" "}
                                    {format(
                                      event.endTime,
                                      "h:mm a",
                                    )}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </TooltipProvider>
                      {dayEvents.length > 3 && (
                        <button
                          onClick={() => goToDayView(day)}
                          className="w-full text-xs text-left pl-1 text-primary hover:underline"
                        >
                          +{dayEvents.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'week' && (
          <>
            {/* Week View - List of Events per Day */}
            {displayDays.every(day => getEventsForDay(day).length === 0) ? (
              <div className="text-center py-12 text-muted-foreground">
                No scheduled events for the week
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {displayDays.map((day, index) => {
                  const dayEvents = getEventsForDay(day).sort(
                    (a, b) => a.startTime.getTime() - b.startTime.getTime()
                  );
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={index} 
                      className="border-r border-border last:border-r-0 pr-2 last:pr-0"
                    >
                      {/* Day header */}
                      <div className={`text-center pb-3 mb-3 border-b border-border ${isToday ? 'text-primary font-bold' : ''}`}>
                        <div className="text-xs text-muted-foreground">
                          {format(day, 'EEE')}
                        </div>
                        <div className={`text-xl ${isToday ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 mx-auto flex items-center justify-center' : ''}`}>
                          {format(day, 'd')}
                        </div>
                      </div>

                      {/* Events list */}
                      <div className="space-y-2">
                        <TooltipProvider>
                          {dayEvents.map((event) => {
                            const club = clubs.find((c) => c.id === event.clubId);

                            return (
                              <Tooltip key={event.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    className="w-full text-left p-2 rounded border border-border hover:bg-accent/50 transition-colors"
                                    style={{
                                      borderLeftWidth: '4px',
                                      borderLeftColor: event.color,
                                    }}
                                  >
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {format(event.startTime, 'h:mm a')}
                                    </div>
                                    <div className="text-sm font-medium truncate">
                                      {event.title}
                                    </div>
                                    {club && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {club.name}
                                      </div>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs"
                                >
                                  <div className="space-y-1">
                                    {club && (
                                      <p className="text-base font-bold text-white mb-2">
                                        {club.name}
                                      </p>
                                    )}
                                    <p className="font-medium text-white">
                                      {event.title}
                                    </p>
                                    {event.description && (
                                      <p className="text-xs text-white">
                                        {event.description}
                                      </p>
                                    )}
                                    {event.location && (
                                      <p className="text-xs text-white">
                                        📍 {event.location}
                                      </p>
                                    )}
                                    <p className="text-xs text-white">
                                      🕐{" "}
                                      {format(event.startTime, "h:mm a")}{" "}
                                      -{" "}
                                      {format(event.endTime, "h:mm a")}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === 'day' && (
          <>
            {/* Day View - List of Events */}
            <div className="space-y-3 min-w-0">
              <div className="text-center pb-4 border-b border-border overflow-hidden">
                <div className="text-2xl font-semibold break-words">
                  {format(currentDate, 'EEEE')}
                </div>
                <div className="text-4xl font-bold text-primary">
                  {format(currentDate, 'd')}
                </div>
              </div>
              
              {getEventsForDay(currentDate).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No events scheduled for this day
                </div>
              ) : (
                <div className="space-y-3 min-w-0">
                  {getEventsForDay(currentDate)
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                    .map((event) => {
                      const club = clubs.find(
                        (c) => c.id === event.clubId,
                      );
                      return (
                        <button
                          key={event.id}
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="w-full text-left p-4 rounded-lg border-2 hover:bg-accent/50 transition-colors min-w-0 overflow-hidden"
                          style={{
                            borderColor: event.color,
                          }}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div 
                              className="w-2 shrink-0 h-full rounded-full"
                              style={{ backgroundColor: event.color }}
                            />
                            <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-lg break-words">
                                    {event.title}
                                  </h3>
                                  {club && (
                                    <p className="text-sm break-words" style={{ color: event.color }}>
                                      {club.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground shrink-0">
                                  {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground break-words">
                                {event.description}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground break-words">
                                <span>📍 {event.location}</span>
                                <span>• {event.eventType}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}