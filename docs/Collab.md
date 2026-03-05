# Collab

Tags: #frontend #page

**File:** `frontend/src/app/pages/Collab.tsx`
**Route:** `/collab`

Collaboration management page for club officers. See [[Collaboration System]] for full feature overview.

## Purpose

Club officers see events their club has been invited to co-host via Outlook Calendar sync (stored in `collaborations` table). They can accept or reject each invite, and re-accept previously declined ones.

## Data Model

`CollabRecord` (local, not from [[Types]]) is fetched from `GET /collab` and contains the collaboration row joined with event + hosting club data. Distinct from `CollaboratorInfo` (which appears on Event objects) and from the manual collaborator management in [[EventPage]].

## Sections

| Section | Description |
|---------|-------------|
| Stats | Total / pending / unique active partnerships |
| Pending Invites | Accept / reject buttons → PATCH /collab/:id { status } |
| Declined Invites | Re-accept option |
| Upcoming Collaborative Events | Accepted collabs with navigate-to-event links |

## Auth

Protected by [[ProtectedRoute]] (any authenticated user). Backend scopes results by `club_id` from JWT.

## Key API Calls

| Action | Endpoint |
|--------|----------|
| Fetch collabs | GET /collab (requireAuth) |
| Accept/reject | PATCH /collab/:id { status } |

## Reads from [[AppContext]]
`clubs`, `currentUser`, `authToken`

## Related
- [[Collaboration System]] — full feature overview
- [[EventPage]] — manual collaborator management (separate from invite flow)
- [[ProtectedRoute]] — auth guard
- [[AppContext]] — auth state
- [[ICS Sync]] — source of collaboration records (Outlook feed parsing)
