# EventDetailModal

Tags: #frontend #component

**File:** `frontend/src/app/components/EventDetailModal.tsx`

Read-only event detail modal. Opened from [[Dashboard]] (via [[CalendarGrid]] click).

## Displayed Information

- Title
- Event type badge + hosting club badge (colored)
- Description
- Date (long-form, e.g. "Monday, March 3, 2026")
- Time range + computed duration in hours
- Location + smart map link (via `getLocationUrl` from `constants.ts`)
  - Room code → UO map search
  - Known UO building → UO map search
  - Everything else → Google Maps
- [[RSVP System]] section (only when `requiresRsvp === true`):
  - RSVP note (if set)
  - RSVP link button OR "link coming soon" fallback
- Hosted by club name

## Props

| Prop          | Type                      | Description                    |
|---------------|---------------------------|--------------------------------|
| `event`       | `Event \| null`           | Event to show; null hides modal |
| `open`        | `boolean`                 | Dialog open state              |
| `onOpenChange`| `(open: boolean) => void` | Passed to Dialog for close     |

## Note on Editing
This modal is **read-only**. For edit/delete see [[EventPage]] (`/event/:id`).

## Related
- [[Dashboard]] — parent, controls open state
- [[CalendarGrid]] — triggers the click that opens this modal
- [[EventPage]] — full event detail with editing
- [[RSVP System]] — RSVP section behavior
- [[AppContext]] — reads clubs for badge color
