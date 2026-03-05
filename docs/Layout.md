# Layout

Tags: #frontend #component #shell

**File:** `frontend/src/app/components/Layout.tsx`

Shell component rendered for every route. Parent of all page outlets.

## Structure

```
<div min-h-screen flex-col>
  [[NavigationBar]]          sticky top — logo, auth, theme
  <div flex flex-1>
    [[FilterSidebar]]        collapsible left panel (w-72)
    <main flex-1>
      tab nav                role-gated links
      <Outlet />             active page content
  <Toaster />                sonner notifications
  [[EventReminderPopup]]     fixed bottom-right
```

## Tab Navigation

| Tab           | Visible When               | Route              |
|---------------|----------------------------|--------------------|
| Dashboard     | always                     | /                  |
| Club Roster   | always                     | /clubs             |
| Collaborate   | any authenticated user     | /collab            |
| Clubs         | admin only                 | /club-management   |
| About         | always                     | /about             |

## Mobile Sidebar
- Desktop: `FilterSidebar` always visible (sticky)
- Mobile: toggled via `isSidebarOpen` state, triggered by hamburger in [[NavigationBar]]

## Reads from [[AppContext]]
- `currentUser` — determines which tabs are visible

## Related
- [[NavigationBar]] — top bar child
- [[FilterSidebar]] — left panel child
- [[EventReminderPopup]] — floating notification child
- [[Dashboard]], [[ClubPage]], [[ClubManagement]], [[EventPage]], [[Collab]], [[ClubRoster]], [[About]] — page outlets
- [[Routing]] — route configuration
