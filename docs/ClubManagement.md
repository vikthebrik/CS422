# ClubManagement

Tags: #frontend #page #admin

**File:** `frontend/src/app/pages/ClubManagement.tsx`
**Route:** `/club-management`

Root-admin-only organization management hub. Protected by `ProtectedRoute role="admin"`.

## Sections

| Section | Description |
|---------|-------------|
| Join Requests | Pending account requests; approve → creates club + sends credentials email; reject with confirmation |
| Request History | Collapsible list of approved/rejected requests; clearable |
| Add Organization | Form to create a new club (POST /clubs → `addClub`) |
| Unions / Departments | Club list with logo upload, email change, delete, click-to-navigate |
| Event Types | CRUD for event type categories (root admin only) |
| Add Event button | Opens full event create dialog |

## Key API Calls (all require Bearer token)

| Action              | Endpoint                         | Effect |
|---------------------|----------------------------------|--------|
| Fetch requests      | GET /admin/requests              | local state |
| Approve request     | POST /admin/requests/:id/approve | creates club, sends email |
| Reject request      | POST /admin/requests/:id/reject  | local state |
| Clear history       | DELETE /admin/requests           | local state |
| Add club            | POST /clubs                      | `addClub()` |
| Delete club         | DELETE /clubs/:id                | cascades events + user_roles |
| Change email        | PATCH /admin/clubs/:id/email     | `updateClub()` |
| Add event type      | POST /event-types                | local state |
| Rename event type   | PATCH /event-types/:id           | local state |
| Delete event type   | DELETE /event-types/:id          | local state |
| Create event        | POST /events                     | `addEvent()` |

## Reads from [[AppContext]]
`clubs`, `events`, `authToken`, `addClub`, `updateClub`, `deleteEvent`, `addEvent`

## Related
- [[ProtectedRoute]] — guards this route (admin only)
- [[LogoUpload]] — club logo upload component
- [[ClubPage]] — club names link here
- [[AppContext]] — club/event mutations
- [[Auth Flow]] — account request → approval → login flow
- [[Org Management]] — feature overview
