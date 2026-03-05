# AppContext

Tags: #frontend #state

**File:** `frontend/src/app/context/AppContext.tsx`

Central global state provider. Wraps the entire app (see [[Routing]]).

## State Exposed via `useApp()`

| Field              | Type                        | Source                     |
|--------------------|-----------------------------|----------------------------|
| `clubs`            | `Club[]`                    | [[useClubs]] hook          |
| `events`           | `Event[]`                   | [[useEvents]] hook         |
| `currentUser`      | `User \| null`              | GET /auth/me on mount      |
| `authToken`        | `string \| null`            | localStorage `mcc_auth_token` |
| `authReady`        | `boolean`                   | true after token validation |
| `eventTypeNames`   | `string[]`                  | GET /event-types           |
| `typeIdMap`        | `Record<string, string>`    | [[useEvents]] side-effect  |
| `selectedClubs`    | `string[]`                  | [[FilterSidebar]] sets     |
| `selectedEventTypes` | `string[]`                | [[FilterSidebar]] sets     |
| `searchQuery`      | `string`                    | [[FilterSidebar]] sets     |
| `advancedMode`     | `boolean`                   | [[FilterSidebar]] sets     |
| `perClubEventTypes` | `Record<string, string[]>` | [[FilterSidebar]] sets     |
| `loading`          | `boolean`                   | combined clubs + events    |
| `error`            | `string \| null`            | first fetch error          |

## Mutations Available

| Function      | Called by                               |
|---------------|-----------------------------------------|
| `addEvent`    | [[ClubPage]], [[ClubManagement]]        |
| `updateEvent` | [[EventPage]], [[Collab]]               |
| `deleteEvent` | [[ClubManagement]]                      |
| `addClub`     | [[ClubManagement]], [[ClubRoster]]      |
| `updateClub`  | [[ClubPage]], [[ClubManagement]]        |
| `setAuthToken` / `setCurrentUser` | [[LoginDialog]], [[NavigationBar]] |

## Auth Lifecycle

1. On mount: reads `mcc_auth_token` from `localStorage`
2. If token found → `GET /auth/me` to validate and restore `currentUser`
3. `authReady` becomes `true` after validation (success or failure)
4. [[ProtectedRoute]] waits for `authReady` before deciding to redirect

## Filter Defaults

- All clubs selected on first club load
- All event types except "Office Hours" selected on first load

## Related
- [[useClubs]] — clubs data source
- [[useEvents]] — events data source
- [[FilterSidebar]] — writes filter state
- [[Dashboard]] — reads filter state to compute visible events
- [[Types]] — Club, Event, User interfaces
