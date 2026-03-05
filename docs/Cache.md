# Cache

Tags: #backend

**File:** `server/src/cache.ts`

In-memory TTL cache for the Express backend.

## Purpose

Avoids redundant Supabase queries on every request for frequently read, rarely changing data (clubs, events, event-types).

## Configuration

`CACHE_TTL_SECONDS` env var (default: 300 seconds / 5 minutes).

## API

| Function | Description |
|----------|-------------|
| `getFromCache(key)` | Returns cached value or `null` |
| `setInCache(key, value)` | Stores value with TTL timestamp |
| `clearCacheKey(key)` | Removes a single cache entry |
| `clearAllCache()` | Wipes all entries |

## Cache Keys

| Key | Data |
|-----|------|
| `clubs` | GET /clubs response |
| `events` | GET /events response |
| `event-types` | GET /event-types response |

## Invalidation

- Any mutation on clubs/events/event-types calls `clearCacheKey()` or `clearAllCache()`
- [[ICS Sync]] posts `POST /internal/cache/clear` after each sync, which calls `clearAllCache()`

## Related
- [[Server Entry]] — uses all cache functions
- [[ICS Sync]] — triggers cache clear after sync
