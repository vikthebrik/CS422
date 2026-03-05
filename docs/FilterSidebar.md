# FilterSidebar

Tags: #frontend #component #filtering

**File:** `frontend/src/app/components/FilterSidebar.tsx`

Left-panel filter controls. Rendered by [[Layout]]. Writes all filter state to [[AppContext]].

## Controls

| Control           | State written              | Read by          |
|-------------------|----------------------------|------------------|
| Search input      | `searchQuery`              | [[Dashboard]]    |
| Event type checkboxes | `selectedEventTypes`  | [[Dashboard]]    |
| Club checkboxes   | `selectedClubs`            | [[Dashboard]]    |
| Advanced mode toggle | `advancedMode`          | [[Dashboard]]    |
| Per-club type checkboxes | `perClubEventTypes` | [[Dashboard]] |
| Reset Filters button | all of the above        | —                |

## Normal vs Advanced Mode

**Normal mode:** Global event type filter applies to all clubs equally.

**Advanced mode** (Zap icon enabled):
- `selectedEventTypes` is ignored
- Each selected club shows its own event-type sub-list
- `perClubEventTypes[clubId]` stores per-club selections
- Initialized from `selectedEventTypes` when enabling

## Club Grouping
Clubs split into two accordion sections: Unions / Departments (based on `club.orgType`).
Each section has "Select All / Deselect All" shortcuts.

## Mobile
- Fixed-position, slides in/out via `translate-x` CSS
- Dark overlay behind it closes it on click
- `isOpen` / `onClose` props controlled by [[Layout]]

## Related
- [[Layout]] — parent, provides isOpen/onClose
- [[AppContext]] — reads clubs, eventTypeNames; writes all filter state
- [[Dashboard]] — consumes filter state to filter events
- [[Event Filtering]] — detailed filter logic description
