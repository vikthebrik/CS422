# Event Filtering

Tags: #feature #frontend

Describes the filter pipeline applied by [[Dashboard]] to events from [[AppContext]].

## Filter Pipeline (applied in order via `useMemo`)

1. **Club filter** — keep events where `event.clubId` OR any `collaborator.club_id` is in `selectedClubs`
2. **Type filter**
   - Normal mode: `event.eventType` must be in `selectedEventTypes`
   - Advanced mode: uses `perClubEventTypes[event.clubId]` (falls back to all `eventTypeNames`)
3. **Search** — case-insensitive substring match on `event.title` or `event.description`

## Filter State (all in [[AppContext]])

| State | Description | Written by |
|-------|-------------|-----------|
| `selectedClubs` | Set of club IDs to show | [[FilterSidebar]] |
| `selectedEventTypes` | Event type names to show (normal mode) | [[FilterSidebar]] |
| `searchQuery` | Text search string | [[FilterSidebar]] |
| `advancedMode` | Toggle per-club type filtering | [[FilterSidebar]] |
| `perClubEventTypes` | Map of clubId → selected type names | [[FilterSidebar]] |

## Normal vs Advanced Mode

**Normal mode:** One global `selectedEventTypes` list applies to all clubs equally.

**Advanced mode:** Each selected club shows its own event-type sub-list in [[FilterSidebar]].
`selectedEventTypes` is ignored. `perClubEventTypes[clubId]` stores per-club selections.
Initialized from `selectedEventTypes` when enabling advanced mode.

## Initialization

On load, `selectedClubs` is initialized to all club IDs (all clubs selected).
`selectedEventTypes` is initialized to all type names from `eventTypeNames` (fetched from GET /event-types).

## Related
- [[Dashboard]] — applies the filter pipeline
- [[FilterSidebar]] — controls that write filter state
- [[AppContext]] — holds all filter state
- [[CalendarGrid]] — receives already-filtered events
