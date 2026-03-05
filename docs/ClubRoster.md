# ClubRoster

Tags: #frontend #page

**File:** `frontend/src/app/pages/ClubRoster.tsx`
**Route:** `/clubs`

Public directory of all MCC clubs and departments.

## Sections

- Search bar + org-type filter (All / Unions / Departments)
- Club cards: logo, name, orgType badge, description, social link buttons → click navigates to [[ClubPage]]
- Admin: "Add Club" button → dialog (POST /clubs → `addClub`)
- Member roster CSV download: select clubs + sections (exec / board / interns), downloads via `/api/clubs/members/csv`

## Data

Reads `clubs` from [[AppContext]] (populated by [[useClubs]] hook).
Filters are local state — no effect on global dashboard filter.

## Related
- [[ClubPage]] — destination when club card is clicked
- [[AppContext]] — `clubs` source
- [[useClubs]] — populates club data with colors
- [[OurTeam]] — source of member data used in CSV export
- [[Org Management]] — feature overview
