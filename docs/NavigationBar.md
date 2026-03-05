# NavigationBar

Tags: #frontend #component

**File:** `frontend/src/app/components/NavigationBar.tsx`

Sticky top bar rendered by [[Layout]].

## Sections

**Left:** MCC logo + site name → links to [[Dashboard]]

**Right (unauthenticated):** "Admin Sign In" button → opens [[LoginDialog]]

**Right (authenticated):**
- Club logo/name → links to `/club/:id` ([[ClubPage]])
- Key icon → `/change-password` ([[Auth Pages]])
- Sign Out button → clears session, navigates to `/`

## Auth Actions

- Sign out calls `setCurrentUser(null)` + `setAuthToken(null)` in [[AppContext]]
- Token removed from `localStorage` via `setAuthToken`

## Mobile
- Hamburger icon calls `onToggleSidebar` (prop from [[Layout]])
- Only visible below `lg` breakpoint

## Reads from [[AppContext]]
- `currentUser` — determines auth state and display name
- `clubs` — looks up `userClub` by `currentUser.clubId`

## Related
- [[Layout]] — parent component, provides `onToggleSidebar`
- [[LoginDialog]] — opened by "Admin Sign In"
- [[AppContext]] — reads currentUser, clubs; writes auth state on sign-out
- [[Auth Flow]] — full login/logout lifecycle
