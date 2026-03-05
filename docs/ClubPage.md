# ClubPage

Tags: #frontend #page

**File:** `frontend/src/app/pages/ClubPage.tsx`
**Route:** `/club/:clubId`

Full detail page for a single club or department.

## Sections

| Section | Description |
|---------|-------------|
| Club Header | Logo, name, orgType badge, description, social links, admin email |
| Events | Upcoming + past list; local search + type filter; Add Event (auth) |
| Our Team | [[OurTeam]] component — public read, auth-gated CRUD |
| Edit Modal | canEdit only: PATCH /clubs/:id — description, social links, ICS URL, name (admin only), logo via [[LogoUpload]] |
| Create Event Modal | POST /events, `clubId` defaults to current club |

## Auth / Permission

`canEdit = currentUser.role === 'admin' || currentUser.clubId === clubId`

Root admin can edit any club; club_admin can edit only their own.

## Key API Calls

| Action           | Endpoint                      | Context mutation  |
|------------------|-------------------------------|-------------------|
| Save club info   | PATCH /clubs/:id              | `updateClub()`    |
| Create event     | POST /events                  | `addEvent()`      |
| Change email     | PATCH /admin/clubs/:id/email  | `updateClub()`    |

## Reads from [[AppContext]]
`clubs`, `events`, `currentUser`, `authToken`, `updateClub`, `addEvent`, `eventTypeNames`, `loading`

## Related
- [[ClubRoster]] — directory that links here
- [[OurTeam]] — embedded team section
- [[LogoUpload]] — logo change component
- [[AppContext]] — club/event data
- [[Org Management]] — club CRUD feature overview
- [[RSVP System]] — event creation includes RSVP fields
