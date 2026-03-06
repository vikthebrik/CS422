# EventPage

Tags: #frontend #page

**File:** `frontend/src/app/pages/EventPage.tsx`
**Route:** `/event/:eventId`

Full event detail page. Linked from [[EventDetailModal]] and [[CalendarGrid]].

## Sections

- Event metadata: title, type badge, club badge, date/time, location + map link
- **Auto-sync paused banner** (amber, visible to editors only when `event.manuallyEdited === true`): explains that Outlook sync is frozen and provides a "Resume Auto-Sync" button
- Description
- [[RSVP System]] section (if `requiresRsvp`)
- Collaborating Clubs (visible to editors): add/remove clubs
- Edit button → opens Dialog with PATCH /events/:id

## Permission Rules (canEdit)

| User role | Can edit |
|-----------|----------|
| `admin` | Any event |
| `club_officer` | Own club's events only (`currentUser.clubId === event.clubId`) |
| Unauthenticated | Read-only |

## Key API Calls

| Action              | Endpoint                              | Context mutation   |
|---------------------|---------------------------------------|--------------------|
| Edit event          | PATCH /events/:id                     | `updateEvent()`    |
| Resume auto-sync    | PATCH /events/:id `{ resumeSync: true }` | `updateEvent({ manuallyEdited: false })` |
| Add collaborator    | POST /events/:id/collaborators        | `updateEvent()`    |
| Remove collaborator | DELETE /events/:id/collaborators/:cid | `updateEvent()`    |

### Auto-Sync Pause Banner

When a club officer or admin edits content fields (title, description, location, event type), the backend sets `manually_edited = true`. On the next page load the amber banner appears. "Resume Auto-Sync" sends `{ resumeSync: true }` which clears the flag, allowing the ICS cron to overwrite the event again on the next sync.

## Reads from [[AppContext]]
`events`, `clubs`, `currentUser`, `authToken`, `updateEvent`, `eventTypeNames`

## Related
- [[EventDetailModal]] — read-only modal that links here
- [[CalendarGrid]] — can navigate here directly
- [[Dashboard]] — event list source
- [[AppContext]] — event/club data, mutations
- [[RSVP System]] — RSVP section behavior
- [[Collaboration System]] — collaborator add/remove UI
