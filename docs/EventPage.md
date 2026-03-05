# EventPage

Tags: #frontend #page

**File:** `frontend/src/app/pages/EventPage.tsx`
**Route:** `/event/:eventId`

Full event detail page. Linked from [[EventDetailModal]] and [[CalendarGrid]].

## Sections

- Event metadata: title, type badge, club badge, date/time, location + map link
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

| Action              | Endpoint                            | Context mutation   |
|---------------------|-------------------------------------|--------------------|
| Edit event          | PATCH /events/:id                   | `updateEvent()`    |
| Add collaborator    | POST /events/:id/collaborators      | `updateEvent()`    |
| Remove collaborator | DELETE /events/:id/collaborators/:cid | `updateEvent()`  |

## Reads from [[AppContext]]
`events`, `clubs`, `currentUser`, `authToken`, `updateEvent`, `eventTypeNames`

## Related
- [[EventDetailModal]] — read-only modal that links here
- [[CalendarGrid]] — can navigate here directly
- [[Dashboard]] — event list source
- [[AppContext]] — event/club data, mutations
- [[RSVP System]] — RSVP section behavior
- [[Collaboration System]] — collaborator add/remove UI
