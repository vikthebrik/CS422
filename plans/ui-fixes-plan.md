# UI Fixes & Enhancements Plan

This document outlines a list of fixes and enhancements for the frontend UI, filtering capabilities, and admin privileges.

## 1. Sidebar Improvements
- **Scrollable Sidebar**: Modify `FilterSidebar.tsx` to ensure its internal container is fully scrollable so that when the Accordion items (Unions, Departments) are expanded, the content doesn't get cut off on smaller screens.
- **Advanced Filter Mode**:
  - Add a toggle for "Advanced Mode" in the sidebar.
  - In Advanced Mode, instead of a global Event Type filter, users can select Event Types *per club*. This requires updating `AppContext` state to handle nested filtering logic (e.g., `Record<string, string[]>` mapping `clubId` to `selectedEventTypes`).
- **Events Search Bar**: Add a global text search input in the sidebar (or top navigation) that filters events by title/description.

## 2. Club Page Improvements (`ClubPage.tsx`)
- **Search & Filtering**: Add a local search bar and event type filter dropdown specifically for the club's upcoming events list.
- **Older Events View**: Add a toggle or a separate tab to view past events (events where `endTime` is before the current date). Update `getUpcomingClubEvents` or create a new helper `getPastClubEvents`.

## 3. Login & Admin Fixes
- **Remove Password Management Tab**: Since clubs can now natively reset their own passwords via the "Forgot Password" email flow, the centralized "Password Management" tab for the root admin is obsolete and less secure. Remove `PasswordManagement.tsx` and its associated routing.
- **Logout Redirect**: Update the sign-out logic in `AppContext.tsx` or `NavigationBar.tsx`. When a user logs out, forcefully navigate them back to the home page (`/`) instead of leaving them on a potentially protected route.

## 4. ICS Link Management
- **Edit Club Page Inclusion**: Move the ability to view, add, or update the `ics_source_url` for a club into the "Edit Club Information" modal inside `ClubPage.tsx`.
- This ensures that once a club account is approved, the club admin can log in and immediately paste their Outlook ICS link on their own page without needing the Root Admin to do it for them.

## 5. Dark Theme Implementation
- **Theme Provider Setup**: Integrate `next-themes` (which is already in `dependencies`) by wrapping the application with `<ThemeProvider defaultTheme="system" attribute="class">` in `App.tsx` or `main.tsx`.
- **Theme Toggle & Auto-Schedule component**:
  - Create a `ThemeToggle.tsx` component (moon/sun icon button) and place it in the `NavigationBar.tsx`.
  - The mode should **default to a sunset/sunrise schedule** (e.g. using geolocation or a standard set time like 6PM-6AM) to automatically switch based on the user's local time.
  - Users can still manually click the toggle to override the schedule and force Light or Dark mode.
- **CSS Variables Verification**: Ensure that Tailwind CSS is correctly picking up the variables defined in `src/styles/theme.css` under the `.dark` class selector, specifically modifying background/foreground utilities across Shadcn UI components.
- **Component Polish**: Review static background colors (especially in `ClubPage`, `PasswordManagement`, and `FilterSidebar`) to ensure they use semantic variables (e.g., `bg-card`, `bg-background`, `text-foreground`) rather than hardcoded colors that break in dark mode.

## 6. Maps Integration
- **Google Maps & UO Maps**: Update the location formatting helper (`getLocationUrl` in `frontend/src/app/constants.ts`).
  - If a location string looks like a standard address, generate a `https://maps.google.com/?q=` link.
  - If a location string looks like a common UO building (e.g., "EMU", "Lillis", "Knight"), generate a link mapping to `https://map.uoregon.edu/?...` (or just fallback to searching UO maps).
  - Apply these links in `EventDetailModal` and other list views.

## 7. RSVP / Ticket Auto-Flagging & Teams Cleanup
- **Backend Parsing Rules (`populate_supabase.ts`)**:
  - **Ticket Flagging**: Parse the incoming ICS Event `summary` (title) and `description`. If it contains `[T]`, `[Ticket]`, or the word `ticket(s)`, auto-flag the database column `requires_rsvp = true`. (Ensure this does *not* trigger just for a Microsoft Teams link).
  - **Teams Invite Truncation**: ICS descriptions with Microsoft Teams links are usually extremely long boilerplates. Use a regex to isolate the chunk starting with "Microsoft Teams meeting" or similar and excise or truncate it, appending "[Teams Meeting Link available in original calendar]" or just preserving the bare `https://teams.microsoft.com/l/meetup-join/...` URL to keep descriptions clean.
- **Frontend Admin Notification**:
  - When a Union admin logs in, check if any of their events have `requires_rsvp = true` but `rsvp_link IS NULL` or empty.
  - If so, display a notification/alert on their Dashboard prompting them to insert the missing ticket link.
- **Frontend Display**:
  - In Hover Cards, EventDetailModals, and Event Cards: if an event `requires_rsvp` and has a `rsvp_link`, render a prominent "Tickets / RSVP" button.
