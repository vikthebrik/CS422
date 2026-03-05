# Collaboration System

Tags: #feature #backend #frontend

Two distinct collaboration mechanisms exist in the app.

## 1. Automated Collaborations (ICS-based)

Discovered during [[ICS Sync]] when two clubs share an event UID in their Outlook feeds.

- Stored in `collaborations` table with status: `pending` | `accepted` | `rejected`
- Club officers manage invites via [[Collab]] page (`/collab`)
- `GET /events` only includes **accepted** collaborations in the `collaborators` array on each event

## 2. Manual Collaborations (EventPage)

Any user who can edit an event can manually add/remove collaborating clubs.

- Shown in [[EventPage]] (`/event/:id`) in the "Collaborating Clubs" section
- `POST /events/:id/collaborators { clubId }` — adds a club
- `DELETE /events/:id/collaborators/:clubId` — removes a club
- Changes immediately update `event.collaborators` in [[AppContext]] via `updateEvent()`

## Data Types

| Type | Location | Description |
|------|----------|-------------|
| `CollaboratorInfo` | [[Types]] | `{ club_id, club_name, club_logo }` — appears on Event objects |
| `CollabRecord` | Local in [[Collab]] | Full collaboration row joined with event + hosting club |

## Display

Collaborating clubs are shown as badges in [[EventDetailModal]] and [[EventPage]].

## Related
- [[Collab]] — UI for managing ICS-based collaboration invites
- [[EventPage]] — UI for manual collaborator management
- [[EventDetailModal]] — displays collaborator badges
- [[ICS Sync]] — creates collaboration records
- [[Database]] — `collaborations` table
- [[API]] — /collab, /events/:id/collaborators routes
