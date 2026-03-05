# EmptyState

Tags: #frontend #component

**File:** `frontend/src/app/components/EmptyState.tsx`

Fallback UI shown by [[Dashboard]] when no events match the current filters.

## Two States

| Condition | Message |
|-----------|---------|
| No clubs selected | Prompt to select clubs from the sidebar |
| Clubs selected but no events match | Prompt to adjust filters or check back later |

## Related
- [[Dashboard]] — parent; controls when EmptyState is shown
- [[FilterSidebar]] — filter state that determines which state is shown
- [[AppContext]] — `selectedClubs`, `events` used to determine condition
