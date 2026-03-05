# Auth Middleware

Tags: #backend #auth

**File:** `server/src/middleware/auth.ts`

Two Express middleware functions for JWT validation.

## requireAuth

Validates any authenticated user.

1. Reads `Authorization: Bearer <token>` header
2. Calls `supabase.auth.getUser(token)` to validate
3. Looks up `user_roles` row by Supabase user UUID
4. Attaches `req.userId`, `req.userRole` (`'root'` or `'club_admin'`), `req.userClubId`, `req.userEmail` to the request
5. Rejects with 401 if token is missing/invalid or no matching user_roles row

## requireRoot

Calls `requireAuth` first, then additionally checks `req.userRole === 'root'`.
Rejects with 403 if the authenticated user is not root.

## DB Role Mapping

| DB role | `req.userRole` value |
|---------|----------------------|
| `root` | `'root'` |
| `club_admin` | `'club_admin'` |

## Used By
All mutating routes in [[Server Entry]] that require authentication.

## Related
- [[Server Entry]] — where middleware is applied to routes
- [[Auth Flow]] — full authentication lifecycle
- [[Database]] — `user_roles` table
