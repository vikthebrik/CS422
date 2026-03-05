# ProtectedRoute

Tags: #frontend #component #auth

**File:** `frontend/src/app/components/ProtectedRoute.tsx`

Auth guard wrapper used in [[Routing]] to protect pages.

## Behavior (4 steps)

1. If `loading` (auth check in progress) → render nothing (wait)
2. If `currentUser` is null → redirect to `/` (not logged in)
3. If `role` prop is set and `currentUser.role !== role` → redirect to `/` (wrong role)
4. Otherwise → render `children`

## Usage

```tsx
// Any authenticated user
<Route element={<ProtectedRoute />}>
  <Route path="/collab" element={<Collab />} />
</Route>

// Root admin only
<Route element={<ProtectedRoute role="admin" />}>
  <Route path="/club-management" element={<ClubManagement />} />
</Route>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `role` | `'admin' \| 'club_officer'` (optional) | Required role; omit to allow any authenticated user |

## Reads from [[AppContext]]
`currentUser`, `loading`

## Related
- [[Routing]] — where ProtectedRoute is applied
- [[AppContext]] — currentUser + loading state
- [[Auth Flow]] — authentication lifecycle
- [[LoginDialog]] — how users authenticate
