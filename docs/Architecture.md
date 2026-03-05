# Architecture

Tags: #overview #system

## Stack

| Layer     | Tech                              | Location   |
|-----------|-----------------------------------|------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind | `frontend/` |
| Backend   | Node.js, Express, TypeScript      | `server/`  |
| Database  | Supabase (PostgreSQL, 3NF)        | Supabase cloud |
| Hosting   | Vercel (frontend), Render (backend) | see `vercel.json`, `render.yaml` |

## Data Flow

```
Browser
  └─► Vite dev proxy / Vercel rewrite → /api/*
        └─► Express server (port 4000)
              ├─► Supabase PostgreSQL (via service-role key)
              └─► In-memory cache (TTL: CACHE_TTL_SECONDS)
```

## Component Dependency Graph

```
App.tsx
  └─► AppProvider ([[AppContext]])
        ├─► [[useClubs]] → GET /clubs
        └─► [[useEvents]] → GET /events
              └─► GET /event-types

  └─► RouterProvider ([[Routing]])
        └─► [[Layout]]
              ├─► [[NavigationBar]]
              │     └─► [[LoginDialog]]
              ├─► [[FilterSidebar]]
              ├─► [[EventReminderPopup]]
              └─► <Outlet> (active page)
                    ├─► [[Dashboard]] → [[CalendarGrid]] + [[EventDetailModal]]
                    ├─► [[ClubPage]] → [[OurTeam]] + [[LogoUpload]]
                    ├─► [[ClubManagement]] → [[LogoUpload]]
                    ├─► [[ClubRoster]]
                    ├─► [[EventPage]]
                    ├─► [[Collab]]
                    ├─► [[About]]
                    └─► [[Auth Pages]]
```

## Related
- [[API]] — all backend routes
- [[Database]] — table schema
- [[ICS Sync]] — background data ingestion
