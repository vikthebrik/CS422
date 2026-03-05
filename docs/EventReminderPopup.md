# EventReminderPopup

Tags: #frontend #component

**File:** `frontend/src/app/components/EventReminderPopup.tsx`

Ambient reminder notification shown when an event is starting soon.

## Behavior

- Polls the upcoming events list and checks if any event starts within a configurable threshold (e.g. 15 minutes)
- Displays a dismissible popup with event title and start time
- Once dismissed, the same event does not trigger again in the same session (tracked in local state)

## Related
- [[AppContext]] — reads `events` list
- [[Dashboard]] — rendered alongside the calendar view
