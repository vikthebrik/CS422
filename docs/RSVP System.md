# RSVP System

Tags: #feature #frontend #backend

RSVP support on events. Toggle is independent of the RSVP link.

## Data Fields (on Event)

| Field | Type | Description |
|-------|------|-------------|
| `requiresRsvp` | `boolean` | Whether the event requires RSVP |
| `rsvpLink` | `string \| null` | External RSVP URL (optional even when toggle is ON) |
| `rsvpNote` | `string \| null` | Free-text note shown to attendees |

## Event Edit / Create

RSVP controls appear in all event edit/create modals:
- Toggle switch for `requiresRsvp`
- Text field for `rsvpLink` (optional)
- Text field for `rsvpNote` (shown when toggle is ON)
- Amber inline warning shown when toggle is ON but no link provided

## Display

### EventDetailModal
- RSVP section only shown when `requiresRsvp === true`
- Shows `rsvpNote` if set
- Shows RSVP link button if `rsvpLink` is set; otherwise shows "link coming soon" fallback

### EventPage
- Same RSVP section display logic as EventDetailModal

## Backend

- `PATCH /events/:id` and `POST /events` both accept `requiresRsvp` (bool) and `rsvpNote` (text)
- `rsvp_note` column: migration `013_rsvp_note.sql`
- RSVP-only changes (`requiresRsvp`, `rsvpLink`, `rsvpNote`) do **not** set `manually_edited = true` — so toggling RSVP does not freeze the event from future ICS syncs
- If `manually_edited = true`, sync freezes the entire event (including RSVP fields). Resume auto-sync via `{ resumeSync: true }` to unfreeze

## Related
- [[EventDetailModal]] — RSVP display
- [[EventPage]] — RSVP display + edit
- [[Database]] — `events.requires_rsvp`, `events.rsvp_link`, `events.rsvp_note`
- [[API]] — PATCH /events/:id
