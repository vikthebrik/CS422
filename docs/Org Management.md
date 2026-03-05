# Org Management

Tags: #feature #frontend #backend

Full lifecycle management for MCC clubs and departments.

## Club CRUD

| Action | Who | UI | Endpoint |
|--------|-----|----|----------|
| Create club | Root admin | [[ClubManagement]] "Add Organization" | POST /clubs |
| Delete club | Root admin | [[ClubManagement]] club list | DELETE /clubs/:id (cascades) |
| Edit club info | Root admin or own club_admin | [[ClubPage]] edit modal | PATCH /clubs/:id |
| Upload logo | Root admin or own club_admin | [[LogoUpload]] in ClubPage/ClubManagement | POST /clubs/:id/logo |
| Change email | Root admin | [[ClubManagement]] mail icon | PATCH /admin/clubs/:id/email |

## Account Request → Club Creation

1. Prospective admin submits form at `/request-account`
2. Root admin sees request in [[ClubManagement]] "Join Requests"
3. Approve → creates club + user_roles row + sends credentials email via SMTP

## Org Types

`clubs.org_type` column: `'union'` (default) | `'department'`
- Both map to `club_admin` role — same permission scope
- FilterSidebar groups clubs into "Unions" and "Departments" accordion sections
- ClubPage and ClubRoster show a "Department" / "Union" badge

## Event Types

Managed in [[ClubManagement]] "Event Types" section (root admin only):
- POST /event-types (create)
- PATCH /event-types/:id (rename)
- DELETE /event-types/:id (delete)

`eventTypeNames` in [[AppContext]] is fetched from GET /event-types and used everywhere event types appear.

## Related
- [[ClubManagement]] — admin hub for org management
- [[ClubPage]] — club detail + edit
- [[ClubRoster]] — public club directory
- [[LogoUpload]] — logo upload component
- [[Auth Flow]] — account request → approval flow
- [[Database]] — clubs, user_roles, account_requests, event_types tables
- [[FilterSidebar]] — groups clubs by org_type
