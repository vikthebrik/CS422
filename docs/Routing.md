# Routing

Tags: #frontend #routing

**File:** `frontend/src/app/App.tsx`

React Router v7 browser router. All routes share the [[Layout]] shell.

## Route Tree

```
/                     [[Dashboard]]           public
/about                [[About]]               public
/clubs                [[ClubRoster]]          public
/club/:clubId         [[ClubPage]]            public
/event/:eventId       [[EventPage]]           public
/forgot-password      [[Auth Pages]]          public
/reset-password       [[Auth Pages]]          public
/request-account      [[Auth Pages]]          public
/confirm-email        [[Auth Pages]]          public

/collab               [[Collab]]              requireAuth (any)
/change-password      [[Auth Pages]]          requireAuth (any)

/club-management      [[ClubManagement]]      requireAuth + role=admin
```

## Auth Guards

[[ProtectedRoute]] wraps authenticated routes:
- No `role` prop → any logged-in user
- `role="admin"` → DB role `root` only
- Renders nothing while `authReady=false` to prevent flash redirects

## Provider Wrapping

```
ThemeProvider (next-themes)
  └─► [[AppContext]] (AppProvider)
        └─► RouterProvider
              └─► [[Layout]] (parent route)
```

## Related
- [[ProtectedRoute]] — auth guard component
- [[AppContext]] — `authReady` and `currentUser`
- [[Layout]] — shell rendered for all routes
- [[Auth Flow]] — how login/redirect works
