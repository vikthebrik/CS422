# useClubs

Tags: #frontend #hook #data

**File:** `frontend/src/app/hooks/useClubs.ts`

Data-fetching hook. Called once by [[AppContext]] on mount.

## Behavior

1. Fetches `GET /api/clubs`
2. Maps `ApiClub[]` (snake_case) → `Club[]` (camelCase) via `mapApiClub()`
3. Assigns deterministic colors from `CLUB_COLORS` palette (index-based)
4. Returns `{ clubs, loading, error }`

## API → Type Mapping

| API field              | Club field       |
|------------------------|------------------|
| `logo_url`             | `logo`           |
| `ics_source_url`       | `outlookLink`    |
| `org_type`             | `orgType`        |
| `admin_email`          | `adminEmail`     |
| `social_links.instagram` | `instagram`   |
| `social_links.linktree`  | `linktree`    |
| `social_links.engage`    | `engage`      |
| `metadata_tags.description` | `description` |
| `metadata_tags.color`  | `color` (overrides palette) |
| `metadata_tags.section_labels` | `sectionLabels` |

## Color Assignment
Clubs have no color column in the DB. Colors come from a 12-color `CLUB_COLORS` array cycling by index. If `metadata_tags.color` is set in the DB row, that takes priority.

## Related
- [[AppContext]] — consumes this hook
- [[useEvents]] — waits for clubs to finish loading (uses club colors)
- [[API]] — GET /clubs endpoint
- [[Types]] — Club interface
- [[Database]] — `clubs` table
