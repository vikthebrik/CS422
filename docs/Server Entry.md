# Server Entry

Tags: #backend

**File:** `server/src/index.ts`
**Port:** 4000 (or `$PORT` env var)

Express REST API entry point. See [[API]] for the full route reference.

## Architecture

```
Express app
  ├── CORS: ALLOWED_ORIGINS env var + dynamic Vercel preview URL support
  ├── Body parser: JSON up to 8mb (for base64 logo payloads)
  ├── In-memory cache (TTL from CACHE_TTL_SECONDS) via cache.ts
  ├── Auth middleware (middleware/auth.ts): JWT validation via Supabase
  └── Routes (public / requireAuth / requireRoot / internal)
```

## Startup

On startup, calls `startCron()` from [[ICS Sync]] to begin the background sync schedule.

## Caching Strategy

- GET /clubs, GET /events, GET /event-types → cached with TTL
- Any mutation → `clearCacheKey()` or `clearAllCache()`
- [[ICS Sync]] posts to `/internal/cache/clear` after each sync

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Service role key (never exposed to frontend) |
| `SYNC_SECRET` | Secret for /internal/cache/clear endpoint |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `PORT` | HTTP port (default 4000) |
| `CACHE_TTL_SECONDS` | In-memory cache TTL |
| `FRONTEND_URL` | Used in reset-password email links |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email delivery for account approval |

## Related
- [[API]] — full route reference
- [[Auth Middleware]] — requireAuth / requireRoot
- [[Cache]] — in-memory TTL cache implementation
- [[Database]] — Supabase client (`server/src/db/supabase.ts`)
- [[ICS Sync]] — cron + sync script
