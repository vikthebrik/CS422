# CalendarGrid

Tags: #frontend #component

**File:** `frontend/src/app/components/CalendarGrid.tsx`

Interactive calendar component. Rendered by [[Dashboard]].

## Views

| View  | Description                                |
|-------|--------------------------------------------|
| Day   | Single-day event list                      |
| Week  | 7-column grid with time slots              |
| Month | Traditional month grid with event dots     |

Mobile defaults to Day view; desktop defaults to Month view.

## Props

| Prop          | Type                        | Description                  |
|---------------|-----------------------------|------------------------------|
| `events`      | `Event[]`                   | Pre-filtered events from [[Dashboard]] |
| `onEventClick`| `(event: Event) => void`    | Called when user clicks an event |

## Event Click
Calls `onEventClick` → [[Dashboard]] opens [[EventDetailModal]].
Full event detail lives at [[EventPage]] (`/event/:id`) — navigated to from the modal or CalendarGrid.

## Dependencies
- `date-fns` — all date formatting and calendar math
- `ui/tooltip` — event tooltips on hover in month view
- [[AppContext]] — reads `clubs` for color lookup

## Related
- [[Dashboard]] — parent, provides events + click handler
- [[EventDetailModal]] — shown when event clicked
- [[EventPage]] — full event detail page (navigated to)
- [[Types]] — Event interface
