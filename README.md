# CS422

Repo contains the course project and other material for CS422: Software Engineering (University of Oregon, Winter 2026).

## MCC Scheduler

Web-based calendar hub that aggregates MCC student organization schedules and provides custom ICS subscription links. See [plans/MCC-Scheduler-Plan.md](plans/MCC-Scheduler-Plan.md) for architecture and milestones.

### Monorepo layout

- **`server/`** — Express API (events, subscriptions, admin). Deploy to Render.
- **`web/`** — React SPA (Vite + Tailwind). Deploy to Vercel.

### Run locally

1. **Backend** (default port 4000):

   ```bash
   cd server
   npm install
   cp .env.example .env   # optional: set DATABASE_URL, CORS_ORIGIN
   npm start
   ```

2. **Frontend** (default port 5173):

   ```bash
   cd web
   npm install
   cp .env.example .env.local   # optional: set VITE_API_BASE_URL=http://localhost:4000
   npm run dev
   ```

   Open http://localhost:5173. The app will call the backend `/health` endpoint; ensure the server is running to see "API: ok".
