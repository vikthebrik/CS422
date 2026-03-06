# useEvents

Tags: #frontend #hook #data

**File:** `frontend/src/app/hooks/useEvents.ts`

Data-fetching hook. Called by [[AppContext]] after [[useClubs]] finishes loading.

## Behavior

1. Waits for `clubsLoading` to be `false`
2. If no clubs in DB, sets `loading = false` early (nothing to fetch)
3. Builds `clubColorMap` from clubs array
4. Fetches `GET /api/events`
5. Maps `ApiEvent[]` → `Event[]` via `mapApiEvent()`, applying club colors
6. Builds `typeIdMap` (event type name → UUID) as a side effect from event data

## API → Type Mapping

| API field        | Event field          |
|------------------|----------------------|
| `start_time`     | `startTime` (Date)   |
| `end_time`       | `endTime` (Date)     |
| `club_id`        | `clubId`             |
| `type`           | `eventType`          |
| `requires_rsvp`  | `requiresRsvp`       |
| `rsvp_link`      | `rsvpLink`           |
| `rsvp_note`      | `rsvpNote`           |
| `manually_edited`| `manuallyEdited`     |
| `collaborators`  | `collaborators` (CollaboratorInfo[]) |

## typeIdMap
Maps event type name → UUID. Used by the ICS subscription URL builder.
Exposed via [[AppContext]] as `typeIdMap`.

## Related
- [[AppContext]] — consumes this hook
- [[useClubs]] — must finish loading first
- [[API]] — GET /events endpoint
- [[Types]] — Event, CollaboratorInfo interfaces
- [[Collaboration System]] — collaborators field on events
- [[ICS Subscription]] — typeIdMap consumer
