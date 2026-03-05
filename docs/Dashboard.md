# Dashboard

Tags: #frontend #page

**File:** `frontend/src/app/pages/Dashboard.tsx`
**Route:** `/`

Main event calendar view. Reads all filter state from [[AppContext]] and renders [[CalendarGrid]].

## Filter Pipeline

Events from [[AppContext]] are filtered in order via `useMemo`:

1. **Club filter** — keep events where `event.clubId` OR any `collaborator.club_id` is in `selectedClubs`
2. **Type filter**
   - Normal mode: `event.eventType` must be in `selectedEventTypes`
   - Advanced mode: use `perClubEventTypes[event.clubId]` (falls back to all `eventTypeNames`)
3. **Search** — case-insensitive match on `event.title` or `event.description`

## Child Components

| Component           | Condition            | Role                          |
|---------------------|----------------------|-------------------------------|
| [[EmptyState]]      | No clubs selected OR no events match | Fallback UI    |
| [[CalendarGrid]]    | Events exist         | Renders day/week/month view   |
| [[EventDetailModal]] | Event clicked       | Read-only event popup         |

## Event Click Flow
`CalendarGrid.onEventClick` → `Dashboard.handleEventClick` → sets `selectedEvent` + `isModalOpen` → [[EventDetailModal]] renders

## Reads from [[AppContext]]
`events`, `selectedClubs`, `selectedEventTypes`, `eventTypeNames`, `searchQuery`, `advancedMode`, `perClubEventTypes`, `loading`, `error`

## Related
- [[FilterSidebar]] — writes the filter state Dashboard reads
- [[CalendarGrid]] — renders the filtered events
- [[EventDetailModal]] — event detail popup
- [[EmptyState]] — no-events fallback
- [[Event Filtering]] — detailed explanation
- [[AppContext]] — state source
