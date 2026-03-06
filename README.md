# CS422: MCC Scheduler

Web-based calendar hub that aggregates Multicultural Center (MCC) student organization schedules and provides custom ICS subscription links.

## Monorepo Layout

| Directory | Purpose |
|-----------|---------|
| `frontend/` | Vite + React 18 + TypeScript SPA. Deploy to Vercel. |
| `server/` | Express REST API + ICS sync cron. Deploy to Render. |
| `docs/` | Component and feature reference (Obsidian-style wiki). |
| `plans/` | Operational guides (deployment, club admin how-to, email config). |

## Quick Start (Local Development)

### 1. Database Setup

Run all migrations in order against your Supabase project (`server/src/db/migrations/001_schema_upgrade.sql` → `014_club_members.sql`).

### 2. Environment Variables

Copy the example files and fill in your values:
```bash
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env
```

Key variables:
- `server/.env`: `SUPABASE_URL`, `SUPABASE_KEY` (service role), `SYNC_SECRET`, `ALLOWED_ORIGINS`, `RESEND_API_KEY`, `SMTP_FROM`
- `frontend/.env`: `VITE_API_BASE_URL=http://localhost:4000`

### 3. Run the Backend
```bash
cd server && npm install && npm run dev
```
API runs on `http://localhost:4000`.

### 4. Run the Frontend
```bash
cd frontend && pnpm install && pnpm dev
```
App runs on `http://localhost:5173`.

## Documentation

| File | Contents |
|------|----------|
| [`CLAUDE.md`](CLAUDE.md) | Full architecture, all API endpoints, auth flow, data mapping — primary dev reference |
| [`docs/index.md`](docs/index.md) | Component and feature wiki index |
| [`plans/deployment-guide.md`](plans/deployment-guide.md) | Render + Vercel + Supabase deployment steps |
| [`plans/club-admin-guide.md`](plans/club-admin-guide.md) | End-user guide for club officers |
| [`server/DB_MANUAL.md`](server/DB_MANUAL.md) | Database schema reference |
