---
name: mcc-scheduler-vercel-mvp
overview: Implement an MVP of the MCC Scheduler using Vercel for the React frontend, a simple hosted Node/Express backend, and a free Postgres service, focusing on ICS ingest, filtering, and custom subscription links.
---

## MCC Scheduler Plan (Vercel-first, simplest stack)

### 1. Overall architecture for the "fastest/simplest" version

- **Frontend (Student + basic Admin UI)**: React SPA deployed to Vercel.
  - Repo root example: `[web/](web/)` with Vite or CRA-based React + Tailwind.
  - Talks to backend via REST (`/api/events`, `/api/subscriptions`, `/api/admin/*`).
- **Backend API + Subscription Service**: Single Node/Express service hosted on a simple platform (Render/Railway/Fly) with a free tier.
  - Repo root example: `[server/](server/)` (Express app).
  - Exposes:
    - `GET /events` (filtered events for UI)
    - `POST /subscriptions` (create hash from filters)
    - `GET /subscriptions/:hash.ics` (serve ICS text)
    - `POST /admin/clubs` etc. (simple CRUD for sources)
- **Database**: Hosted Postgres (Supabase or Neon) using free tier.
  - Schema aligned to SDS: `clubs`, `event_types`, `events`, `custom_subscriptions`, `collaborations`, `rsvps`.
- **Sync Worker (ICS fetcher/parser)**: Implemented as a script within the backend repo.
  - For MVP: run as a **scheduled job on the backend host** (platform cron/"scheduled tasks") or via a GitHub Action hitting a protected endpoint.
  - Uses `node-ical` + regex sanitization to pull Outlook ICS → upsert into `events`.

### 2. Repository structure and initial setup

- **Monorepo layout (recommended for simplicity)**
  - `[web/](web/)`: React + Tailwind SPA.
  - `[server/](server/)`: Express API + sync worker + ICS generator.
  - `[shared/](shared/)` (optional): TypeScript types for DTOs (event, club, filters).
  - Top-level files: `README.md`, `.gitignore`, maybe simple `docker-compose.dev.yml` for local Postgres.
- **Initial setup steps**
  - Create Git repo and basic `README.md` describing ConOps and architecture.
  - Initialize `web` with Vite React + TypeScript + Tailwind.
  - Initialize `server` with `npm init` + Express + TypeScript (or JS if team prefers), and add `node-ical`, `pg`/Prisma/Drizzle, `jsonwebtoken`, and `ical-generator` to `package.json`.
  - Configure `.env` handling for both apps (local `.env` + env vars in Vercel and backend host).

### 3. Database design and migrations

- **Choose tooling**
  - Use a migration tool (Prisma, Drizzle, Knex, or plain SQL migrations) inside `[server/](server/)`.
  - Connect to a hosted Postgres instance (Supabase/Neon).
- **Implement core tables first (MVP)**
  - `clubs( id, name, ics_source_url, metadata_tags JSONB )`
  - `event_types( id, name )`
  - `events( id, club_id, type_id, title, description, location, start_time, end_time, last_updated, uid )`
  - `custom_subscriptions( id, link_hash UNIQUE, filter_criteria JSONB, created_at )`
- **Add extended tables (nice-to-have)**
  - `collaborations( id, event_id, partner_club_id, status )`
  - `rsvps( id, event_id, user_email, status )`.
- **MVP focus**
  - Make sure queries for: "events by date range + club filter + type filter" are indexed.

### 4. Backend API design (Express service)

- **Core routes for MVP**
  - `GET /health` – basic health.
  - `GET /events` – query params: `start`, `end`, `clubIds[]`, `typeIds[]`.
  - `POST /subscriptions` – body with filter criteria; returns `link_hash`.
  - `GET /subscriptions/:hash.ics` – generates ICS feed on the fly from DB using `ical-generator`.
- **Admin routes (simple, stubbed auth)**
  - `GET /admin/clubs` – list sources.
  - `POST /admin/clubs` – add a new club + ICS URL + category.
  - `PUT /admin/clubs/:id` / `DELETE /admin/clubs/:id` – basic CRUD.
  - For MVP, implement a single shared admin secret or very simple JWT with a hardcoded admin user; plan to swap later for real SSO.
- **Sync worker integration**
  - Implement a `syncAllSources()` function in `[server/src/sync/syncEngine.ts]` that:
    - Fetches all `clubs` with `ics_source_url`.
    - For each URL, downloads ICS via `node-ical`, sanitizes, and upserts into `events`.
  - Expose it as:
    - A CLI script (e.g., `node dist/sync/run.js`).
    - Optionally a protected internal endpoint (`POST /admin/sync`) for manual triggers.

### 5. Sync Engine implementation details

- **Parsing and sanitization**
  - Use `node-ical` to parse each ICS file, extracting UID, Summary, Description, Start, End, Location.
  - Apply regex-based cleaning for non-standard characters and common Outlook quirks.
  - Map to DB schema and upsert by `uid` per club (handle updates + cancellations as a later iteration).
- **Scheduling**
  - For fastest/simple:
    - Use hosting platform's cron/scheduler (Render/Fly/Railway) to call the sync script every 5–15 minutes.
    - Make sure environment variables for DB connection and optional admin secret are set.
- **Error handling**
  - Log failed URLs and mark clubs as `last_sync_ok` / `last_sync_error` fields in `clubs`.
  - Keep logs simple (console + platform logs) for early MVP.

### 6. Subscription Service (ICS output)

- **Data model**
  - `custom_subscriptions.link_hash`: short hash (e.g., base62 or UUID) used in URLs.
  - `filter_criteria`: JSON storing selected clubs, event types, and maybe time-range preferences.
- **Flow**
  - Frontend collects filter state → `POST /subscriptions`.
  - Backend stores filter criteria, returns `https://api-host/subscriptions/<hash>.ics`.
  - When that URL is requested:
    - Look up `filter_criteria` by `link_hash`.
    - Query `events` for matching filters and appropriate date window.
    - Use `ical-generator` to render ICS text and return `text/calendar`.

### 7. Frontend (React + Tailwind on Vercel)

- **Core screens/components (MVP)**
  - `StudentDashboard` – main view.
    - `FilterSidebar` – club filters, event types.
    - `CalendarGrid` – basic week/month view; can start with a simple list by date.
    - `SubscriptionModal` – shows generated link and explains how to add it to Google/Apple/Outlook.
  - `AdminPortal` – minimal admin UI.
    - List existing clubs.
    - Form to add new club + ICS URL + category.
- **State management**
  - Use React Context (`FilterContext`) or simple `useState` lifting.
  - On filter changes, call `GET /events` with query params and re-render.
- **Deployment to Vercel**
  - Connect GitHub repo, configure build command (`npm run build`), and output dir (`dist` for Vite).
  - Set `VITE_API_BASE_URL` env var in Vercel to point to backend.

### 8. Environments and configuration

- **Local dev**
  - Postgres: local Docker or direct connection to Supabase/Neon.
  - `web`: run on port 5173 (Vite) or 3000.
  - `server`: run on port 4000 (Express).
- **Production**
  - Backend host (Render/Railway/Fly) with environment variables for DB URL, JWT/admin secret, CORS origin.
  - Vercel project for React with `VITE_API_BASE_URL` pointed to backend URL.
  - Set CORS in Express to allow Vercel domain.

### 9. MVP slice and milestones

- **Milestone 1: Skeleton stack**
  - Set up repos (`web`, `server`), basic health endpoints, and basic UI shell deployed to Vercel.
- **Milestone 2: DB + events API**
  - Implement DB schema, migrations, and `GET /events` backed by test data.
  - Frontend renders events from API with filters (club, type) using mock clubs.
- **Milestone 3: ICS sync worker**
  - Implement `syncAllSources()` using `node-ical` and one real Outlook ICS URL.
  - Run manually first; then configure scheduled job.
- **Milestone 4: Custom subscription links**
  - Implement `POST /subscriptions` + `GET /subscriptions/:hash.ics` with `ical-generator`.
  - Test in Google Calendar / Apple Calendar.
- **Milestone 5: Admin portal basics**
  - Admin UI for adding clubs and kicking off a manual sync.

### 10. Future enhancements (after MVP)

- Replace stub admin auth with a better scheme (e.g., UO SSO or more secure JWT flows).
- Handle recurring events and cancellations more robustly in sync engine.
- Improve calendar visualization (full month/week grid, better mobile layout).
- Add collaboration workflow (`collaborations` table) + notifications for joint events.
- Harden monitoring and error logging (structured logs, uptime checks).

