# MCC Scheduler

A calendar aggregator for [University of Oregon Multicultural Center (MCC)](https://mcc.uoregon.edu/) student organizations. Club officers sync their Outlook calendars once; students browse all MCC events in one place and subscribe to personalized ICS feeds filtered by club, event type, or any combination — so their calendar app stays up to date automatically.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)

## Live Deployment

| Service | URL |
|---------|-----|
| Frontend (Vercel) | _configured per deployment — see `FRONTEND_URL` env var_ |
| API (Render) | `https://mcc-scheduler-api.onrender.com` |

## Monorepo Layout

| Directory | Purpose |
|-----------|---------|
| `frontend/` | Vite + React 18 + TypeScript SPA. Deploy to Vercel. |
| `server/` | Express REST API + ICS sync cron. Deploy to Render. |
| `docs/` | Component and feature reference (Obsidian-style wiki). |
| `plans/` | Operational guides (deployment, club admin how-to, email config). |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase (PostgreSQL, 3NF schema) |
| Email | Resend SDK (transactional — password reset, account approval) |
| ICS | node-ical (Outlook feed parsing), ical-generator (subscription export) |
| Deployment | Vercel (frontend) + Render (API) |

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
| [`CHANGELOG.md`](CHANGELOG.md) | Version history and release notes |
| [`SECURITY.md`](SECURITY.md) | Vulnerability disclosure policy |

## Academic Context

This project was developed as a capstone for **CS 422: Software Methodology** at the University of Oregon (Winter 2026). It was built as a real-world deployment for the UO Multicultural Center rather than a toy exercise — the app has been handed off to MCC staff and remains in active use beyond the course.

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines on opening issues, submitting pull requests, and the development workflow.

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](LICENSE). See `LICENSE` for details.
