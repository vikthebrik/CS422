# CS422: MCC Scheduler

Web-based calendar hub that aggregates Multicultural Center (MCC) student organization schedules and provides custom ICS subscription links.

## Monorepo Layout

- **`frontend/`** — React SPA (Vite + Tailwind). Deploy to Vercel.
- **`server/`** — Express API (events, subscriptions, admin sync worker). Deploy to Render.

## Quick Start (Local Development)

### 1. Database Setup
Ensure you have a local or hosted Supabase PostgreSQL instance running. Ensure migrations `001_schema_upgrade.sql` through `005_enable_auth.sql` (found in `server/src/db/migrations/`) have been executed in your SQL editor.

### 2. Run the Backend API
```bash
cd server
npm install
npm run dev
```
*(Requires `SUPABASE_URL`, `SUPABASE_KEY`, `SYNC_SECRET`, and `ALLOWED_ORIGINS` in `server/.env`)*

### 3. Run the Frontend UI
**Open a second terminal:**
```bash
cd frontend
npm install
npm run dev
```
*(Requires `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env`)*

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Documentation

- **Development Guide**: See [`CLAUDE.md`](CLAUDE.md) for full architecture details, database schema, authentication flows, and automated sync script instructions. 
- **Deployment Guide**: See [`plans/deployment-guide.md`](plans/deployment-guide.md) for step-by-step instructions on deploying the full stack to Render, Vercel, and GitHub Actions.
