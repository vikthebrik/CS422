# MCC Scheduler Project

<!-- SELF-UPDATE PROTOCOL ─────────────────────────────────────────────────────
  At the end of every session where you learn something new about this project,
  update this file in-place. Specifically:
  - Update "Current State" to reflect what is now done vs. still pending.
  - Add new API endpoints, data-mapping notes, or architectural decisions.
  - Remove stale TODOs and incorrect descriptions.
  - Keep the file concise — prefer editing existing entries over appending.
  This ensures every future session starts with accurate context.
─────────────────────────────────────────────────────────────────────────── -->

## Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS — `frontend/` (replaces old `web/`, ignore `web/`)
- **Backend:** Node.js, Express, TypeScript — `server/`
- **Database:** Supabase (PostgreSQL, 3NF)
- **Package managers:** `pnpm` for frontend (has pnpm overrides in package.json), `npm` for server

## Monorepo Layout
```
frontend/   Vite + React SPA — wired to backend API (not mock data)
server/     Express REST API — events, clubs, auth, ICS generation
plans/      Integration plans and design docs
```

## Local Development
```bash
# Backend (port 4000)
cd server && npm run dev

# Frontend
cd frontend && pnpm dev
```
- `server/.env` needs: `SUPABASE_URL`, `SUPABASE_KEY` (service role), `SYNC_SECRET`, `ALLOWED_ORIGINS`, `PORT`, `CACHE_TTL_SECONDS`, `FRONTEND_URL`, `SYNC_CRON_SCHEDULE`
- `frontend/.env` needs: `VITE_API_BASE_URL=http://localhost:4000`
- See `server/.env.example` and `frontend/.env.example`

## Key Files
| File | Purpose |
|------|---------|
| `server/src/index.ts` | All Express routes |
| `server/src/scripts/sync_all.ts` | Cron: parses Outlook ICS feeds, upserts events; calls `POST /internal/cache/clear` after sync |
| `server/src/scripts/seed_auth.ts` | Seeds root admin: `mcc@uoregon.edu` / `password123` |
| `frontend/src/app/context/AppContext.tsx` | Global state: `events`, `clubs`, `typeIdMap`, `loading`, `error`, auth |
| `frontend/src/app/hooks/useClubs.ts` | Fetches `/clubs`, maps to Club type, assigns colors from palette |
| `frontend/src/app/hooks/useEvents.ts` | Fetches `/events` after clubs load, maps to Event type |
| `frontend/src/app/components/SubscriptionLinkGenerator.tsx` | Builds backend ICS URL from user-selected filters |
| `frontend/src/app/constants.ts` | Shared helpers including `getUpcomingClubEvents` |

## API Endpoints
### Public
- `GET /clubs` → `{ id, name, org_type, logo_url, ics_source_url, social_links (jsonb), metadata_tags (jsonb) }`
- `GET /events` → `{ id, title, description, start_time, end_time, club_id, type_id, type, club_name, club_logo, collaborators[] }`
- `GET /events/ics?filters=clubId:typeId,...` → ICS file (typeId optional; `clubId:` = all types)
- `GET /event-types` → `{ id, name }[]`

### Auth
- `POST /auth/login { email, password }` → `{ token, user: { id, name, email, role, clubId } }`
- `GET /auth/me` (Bearer token) → validates token, returns user
- `POST /auth/forgot-password { email }` → triggers Supabase reset email; redirectTo = `FRONTEND_URL/reset-password`
- `POST /auth/reset-password { token, newPassword }` → validates recovery token, updates password
- `POST /auth/request-account { clubName, contactEmail, message? }` → inserts into `account_requests`

### Mutations (Bearer token required)
- `PATCH /events/:id { title, description, location, eventType }` — root edits any; club_admin only own club
- `DELETE /events/:id` — same scope rules
- `PATCH /clubs/:id { description, instagram, linktree, engage }` — merges jsonb, does not overwrite
- `POST /event-types { name }` — requireRoot
- `PATCH /event-types/:id { name }` — requireRoot
- `DELETE /event-types/:id` — requireRoot

### Admin (requireRoot)
- `GET /admin/users` → `{ id, email, clubId, clubName }[]` — list all club_admin accounts
- `POST /admin/passwords/:userId { newPassword }` — force-set a club admin's password

### Internal
- `POST /internal/cache/clear` with header `x-sync-secret: <SYNC_SECRET>` — clears cache, no JWT needed

## Authentication
- Token stored in `localStorage` under key `mcc_auth_token`
- Validated on app mount via `GET /auth/me`
- DB roles `root`/`club_admin` → frontend roles `admin`/`club_officer`
- Sign-out clears `currentUser` + `authToken` in context and localStorage
- **No Supabase client on the frontend** — auth is proxied through the backend only

## Data Mapping (API → Frontend types)
| API field | Frontend field |
|-----------|---------------|
| `event.start_time` (ISO string) | `Event.startTime` (Date) |
| `event.end_time` | `Event.endTime` (Date) |
| `event.club_id` | `Event.clubId` |
| `event.type` | `Event.eventType` |
| `club.ics_source_url` | `Club.outlookLink` |
| `club.logo_url` | `Club.logo` |
| `club.social_links` (jsonb) | `Club.instagram / linktree / engage` |

## Club Colors
DB clubs have no color field. Colors are assigned deterministically by array index from `CLUB_COLORS` palette in `useClubs.ts`. If `metadata_tags.color` is set in the DB row, that takes precedence.

## ICS Subscription
`typeIdMap` (`Record<string, string>`) in AppContext maps event type **name → UUID**. `SubscriptionLinkGenerator` uses this to build the `?filters=` query string for the backend ICS endpoint.

## What Is Still Mock Data
- `collabEvents` and `users` in `frontend/src/app/mockData.ts` — collab/user management not yet integrated with the API.

## Deployment
| Service | Config |
|---------|--------|
| Frontend → Vercel | `vercel.json` at repo root; buildCommand: `cd frontend && pnpm install && pnpm build` |
| Backend → Render | `render.yaml` at repo root; rootDir=`server`; build: `npm install && npm run build`; start: `node dist/index.js` |
| DB → Supabase | Service role key in `server/.env` only; anon key unused |

`tsconfig.json` has `rootDir: ./src` so `tsc` outputs to `dist/index.js` correctly.

## Org Type (Department vs Union)
`clubs.org_type` column (migration 007): `'union'` (default) | `'department'`. Both map to `club_admin` role — same permission scope (own org only). The root admin is the only superuser. Frontend maps to `Club.orgType` and displays a "Department" / "Union" badge on ClubPage and ClubRoster.

## Current State (last updated 2026-02-25)
- Backend API is fully functional: caching, ICS generation, auth, mutations, cache-clear endpoint.
- Frontend is fully wired to the backend — no mock data for clubs or events.
- Auth flow (login, persist, sign-out, role-gating) is integrated.
- Club edit modal (PATCH /clubs/:id) is integrated on ClubPage.
- Upcoming events on ClubPage now display date + time (fixed 2026-02-25).
- Full auth suite implemented: forgot-password, reset-password, request-account flows.
- PasswordManagement.tsx now fetches real users from /admin/users and resets via API.
- Admin.tsx has an Event Types CRUD section (root admin only).
- LoginDialog.tsx has email validation + "Forgot Password" / "Request Account" links.
- Routes added: /forgot-password, /reset-password, /request-account.
- seed_auth.ts rewritten to use supabase.auth.admin.createUser (no more bcrypt/users table).
- org_type column added to clubs (migration 007) with Department/Union badge in UI.
- ICS sync cron runs in-process via node-cron (`server/src/cron.ts`), default every 14 min (`*/14 * * * *`), configurable via `SYNC_CRON_SCHEDULE`.
- `events.manually_edited` (bool, default false): set to `true` by `PATCH /events/:id`. Sync skips overwriting `title`, `description`, `location`, `type_id` for flagged events — only `start_time`, `end_time`, `requires_rsvp`, `rsvp_link` are refreshed.
- `eventTypeNames` added to AppContext (fetched from `/event-types`); `selectedEventTypes` initialized to all types on load.
- FilterSidebar uses live `eventTypeNames` from context (not hardcoded `EVENT_TYPES`).
- Admin edit modal uses controlled `editingEventType` state for the event type Select (fixes FormData not capturing Radix Select value).
- `collabEvents` / collab management page is not yet integrated with the API.
