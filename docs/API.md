# API

Tags: #backend #api

Full API reference for the MCC Calendar Hub backend. See [[Server Entry]] for the implementation file.

## Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /clubs | All clubs (cached) |
| GET | /events | All events with collaborators (cached) |
| GET | /events/ics | ICS calendar file; `?filters=clubId:typeId,...` |
| GET | /event-types | Event type categories |
| GET | /site-settings/:key | CMS block content |

## Auth Endpoints (any valid JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Returns JWT + user |
| GET | /auth/me | Validates token, returns user |
| POST | /auth/forgot-password | Triggers Supabase reset email |
| POST | /auth/reset-password | Validates token, updates password |
| POST | /auth/request-account | Inserts account_requests row |
| POST | /auth/change-email | Sends HMAC confirmation link |
| POST | /auth/confirm-email | Applies email change |
| POST | /auth/change-password | Verifies + updates password |
| PATCH | /events/:id | Edit event (root: any; club_admin: own) |
| DELETE | /events/:id | Delete event (same scope) |
| POST | /events | Create event |
| POST | /events/:id/collaborators | Add collaborating club |
| DELETE | /events/:id/collaborators/:clubId | Remove collaborating club |
| PATCH | /clubs/:id | Edit club info |
| POST | /clubs/:id/logo | Upload club logo |
| GET | /collab | Collaborations for current user's club |
| PATCH | /collab/:id | Accept or reject collaboration |

## Admin Endpoints (requireRoot)

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/users | List all club_admin accounts |
| POST | /admin/passwords/:userId | Force-set club admin password |
| GET | /admin/requests | List account requests |
| POST | /admin/requests/:id/approve | Approve + create club + send credentials |
| POST | /admin/requests/:id/reject | Mark rejected |
| DELETE | /admin/requests | Clear processed request history |
| PATCH | /admin/clubs/:id/email | Immediately change club admin email |
| POST | /clubs | Create new club |
| DELETE | /clubs/:id | Delete club (cascades events + user_roles) |
| POST | /event-types | Create event type |
| PATCH | /event-types/:id | Rename event type |
| DELETE | /event-types/:id | Delete event type |
| PUT | /site-settings/:key | Upsert CMS block content |
| POST | /site-settings/upload | Upload media to mcc-public-assets bucket |

## Internal Endpoints

| Method | Path | Header | Description |
|--------|------|--------|-------------|
| POST | /internal/cache/clear | `x-sync-secret` | Clears all cached responses |

## Caching Strategy

GET /clubs, GET /events, GET /event-types are cached in memory (TTL from `CACHE_TTL_SECONDS`).
Any mutation calls `clearCacheKey()` or `clearAllCache()`.
[[ICS Sync]] cron posts to /internal/cache/clear after each sync run.

## Related
- [[Server Entry]] — implementation (`server/src/index.ts`)
- [[Auth Middleware]] — requireAuth / requireRoot middleware
- [[Cache]] — in-memory TTL cache
- [[Database]] — Supabase PostgreSQL schema
- [[Auth Flow]] — authentication lifecycle
