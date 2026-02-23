# MCC Scheduler Project

## Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS (located in `frontend/` directory, replacing old `web/`)
- **Backend:** Node.js, Express, TypeScript (located in `server/`)
- **Database:** Supabase (PostgreSQL)

## Architecture & Features
- **Monorepo Layout:**
  - `frontend/`: Figma-generated React SPA. Needs to be wired up to the backend.
  - `server/`: Express REST API for events and club management.
- **Database Schema (3NF):** Core tables are `events`, `clubs`, `event_types`, `collaborations`, and `user_roles`.
- **Authentication:** Supabase Auth is integrated. Backend uses JWT tokens. There is a `users_role` table mapping users to roles (`root` or `club_admin`).
- **Syncing Logic:** `server/src/scripts/sync_all.ts` parses Outlook ICS feeds (using `node-ical`) and upserts events into Supabase to keep club schedules up to date.
- **Custom Subscriptions:** Users can generate custom ICS feeds with filtering in the backend via `GET /events/ics?filters=...`.

## Local Development Commands
1. **Backend:**
   ```bash
   cd server
   npm run dev # or npm start
   ```
   - Make sure `server/.env` has `SUPABASE_URL`, `SUPABASE_KEY` (service role), `SYNC_SECRET`, and `ALLOWED_ORIGINS` configured.
2. **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   - Needs `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env`.

## Key Files & Scripts
- `server/src/index.ts`: Main Express API routes.
- `server/src/scripts/sync_all.ts`: The cron job script to pull ICS feeds.
- `server/src/scripts/seed_auth.ts`: Helper script to generate the root admin account (`mcc@uoregon.edu` / `password123`).
- `plans/frontend-integration-plan.md`: The active plan for integrating the Figma-generated frontend with the existing API.

## Current State (as of current timestamp)
- The backend API is fully functional with basic caching and custom ICS subscription generation.
- The backend login route (`/auth/login`) has been upgraded with email format validation.
- The `frontend/` folder has been created from Figma but contains mostly mock data. Next immediate step is wiring up the components in `frontend/src/app` using the `plans/frontend-integration-plan.md` instructions.