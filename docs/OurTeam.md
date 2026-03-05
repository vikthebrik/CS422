# OurTeam

Tags: #frontend #component

**File:** `frontend/src/app/components/OurTeam.tsx`

Club member directory component embedded in [[ClubPage]].

## Data Model (ClubMember)

Stored in `club_members` table (migration 014):
- `section`: `'exec'` | `'board'` | `'intern'`
- `name`, `title`, `email` (nullable), `photo_url` (nullable), `sort_order`

## Behavior

| Mode | Description |
|------|-------------|
| Public | Renders three sections (exec / board / interns) with photo, name, title |
| Auth (canEdit) | Inline add/edit/delete via dialogs |
| Photo upload | Max 3MB; converted to WebP via Canvas API; uploaded to `member-photos` Supabase bucket |
| Email | Click to copy to clipboard (no mailto, avoids spam crawlers) |
| Section labels | Customizable via `sectionLabels` prop (root admin can rename for department orgs) |

## API Calls

| Action | Endpoint |
|--------|----------|
| Fetch members | GET /clubs/:id/members (public) |
| Add member | POST /clubs/:id/members |
| Edit member | PATCH /clubs/:id/members/:mid |
| Delete member | DELETE /clubs/:id/members/:mid |
| Upload photo | POST /clubs/:id/members/:mid/photo |

## Props

| Prop | Type | Description |
|------|------|-------------|
| `clubId` | `string` | Club UUID |
| `canEdit` | `boolean` | Show add/edit/delete controls |
| `authToken` | `string \| null` | Bearer token for write API |
| `orgType` | `'union' \| 'department'` | Affects default section labels |
| `sectionLabels` | `{ exec?, board?, intern? }` | Custom label overrides |
| `onSectionLabelsChange` | `(labels) => void` | Called when labels are updated |

## Related
- [[ClubPage]] — parent component
- [[Database]] — `club_members` table (migration 014)
- [[Server Entry]] — member CRUD + photo upload routes
