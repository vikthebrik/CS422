# Frontend to Backend Integration Plan

This document outlines the point-to-point mapping for integrating the new Figma-generated frontend (located in the `frontend/` directory) with the existing Express/Supabase backend architecture in this repository. It also details how the syncing logic and cron jobs fit into the overall system.

---

## 1. Architecture Overview

- **Frontend (`frontend/`)**: A Vite + React (TypeScript) SPA generated from Figma. It contains raw UI components that currently use mock data or static layouts.
- **Backend (`server/`)**: An Express.js REST API.
- **Database**: Supabase PostgreSQL. Core tables involve `events`, `clubs`, `event_types`, and `collaborations`.
- **Sync Worker**: A Node.js typescript script (`server/src/scripts/sync_all.ts`) that pulls ICS feeds, cleans them, and upserts them into Supabase.

---

## 2. Point-to-Point Data Mapping

The frontend components in `frontend/src/app` (such as calendars, lists, filters, and modals) need to be wired up to the backend endpoints.

### A. Events Data (Calendar / List View)
- **Frontend Need**: Event title, date/time, location, club name, club logo, description, and event type.
- **Backend Endpoint**: `GET /events`
- **Mapping**:
  - `event.title` ↔ UI Event Title
  - `event.start_time` & `event.end_time` ↔ UI Calendar Grid / Time Slots
  - `event.club_name` ↔ UI Host Club Label
  - `event.club_logo` ↔ UI Club Avatar/Icon
  - `event.location` ↔ UI Location text
  - `event.type` ↔ UI UI Category Badge (e.g., "Food", "Meeting")

*Implementation Detail*:
The frontend should fetch `/events` on load and when the cache is invalidated. Use a global React Context or a fetching library (like React Query) to maintain this state.

### B. Club Filters (Sidebar or Dropdown)
- **Frontend Need**: List of all clubs with their IDs and Names to populate the filtering mechanism.
- **Backend Endpoint**: `GET /clubs`
- **Mapping**:
  - `club.id` ↔ UI Checkbox / Filter value
  - `club.name` ↔ UI Filter Display Name
  - `club.logo_url` ↔ UI Filter Icon (if applicable)

### C. Custom Subscription Links (ICS Export)
- **Frontend Need**: A way for users to export their filtered view into a subscribe-able ICS format.
- **Backend Endpoint**: `GET /events/ics?filters=CLUB_ID:TYPE_ID,...`
- **Mapping**:
  - When the user selects specific clubs/types in the UI and clicks "Subscribe" or "Export", the frontend generates a URL dynamically using the `/events/ics` endpoint.
  - E.g., `http://backend-url/events/ics?filters=clubA:type1,clubB:type2`
  - The UI presents this URL to the user to copy into Google Calendar, Apple Calendar, or Outlook.

### D. Sync & Admin Controls
- **Frontend Need**: Buttons to force sync or clear cache (if an admin panel is built).
- **Backend Endpoints**: 
  - `POST /admin/cache/clear-all` (Requires root admin authentication).
- **Mapping**:
  - The UI Admin portal (if requested) needs to attach the Root Admin JWT logic mapped in `server/src/middleware/auth.ts` to trigger these safely.

---

## 3. Syncing Logic & Cron Job Integration

Currently, `server/src/scripts/sync_all.ts` handles pulling ICS feeds into the Supabase database.

### The Cron Job Implementation
To make this run fully autonomously without manual intervention:

1. **Host-Level Cron (Render/Vercel/GitHub Actions)**:
   - *Option A (GitHub Actions)*: Create a `.github/workflows/sync.yml` that runs on a `schedule` (e.g., `cron: '0 * * * *'` for hourly) to execute `npm run sync` inside the server directory.
   - *Option B (Render Backend)*: Utilize Render's "Background Worker" or Cron Job feature to execute `ts-node src/scripts/sync_all.ts` periodically.

2. **Sync Flow Details**:
   - The script pulls configurations from `clubs.json` (or the database directly).
   - It iterates through each club's Outlook ICS URL.
   - Using `populate_supabase.ts`, it parses ICS records and maps them to `events` in Supabase based on UID to avoid duplicates.
   - At the end of the sync, `sync_all.ts` naturally calls the backend `/admin/cache/clear-all` to clear out outdated cache so the frontend immediately reflects the new sync.

---

## 4. Prompt for Claude (Implementation Instructions)

*Copy and paste the prompt below into Claude to begin the implementation phase.*

***

**System/Context:**
You are tasked with bringing a React frontend to life. We have a newly generated React UI from Figma located in the `frontend/` directory, and a fully functional Express backend in the `server/` directory.

**Objective:**
Integrate the frontend with the backend REST API by replacing the hardcoded/mock data in the `frontend/src/app` components with real data fetched from the backend.

**Task Requirements:**
1. **Analyze the Frontend Structure**: Review the structural layout of `frontend/src/app/App.tsx` and its child components. Identify where Events and Clubs data are being displayed.
2. **Implement API Fetching**: 
   - Set up API calls using `fetch` or `axios` in the frontend to hit the `GET /events` and `GET /clubs` endpoints.
   - Ensure you use the `VITE_API_BASE_URL` environment variable for the base URL.
3. **Data Mapping**: 
   - Map the returned JSON from `/events` to the calendar and list UI components. Pay attention to `title`, `start_time`, `end_time`, `club_name`, and `type`.
   - Map the returned JSON from `/clubs` to the filter sidebar/dropdowns.
4. **Subscription Output**: Implement the logic where selecting filters in the UI dynamically constructs the `/events/ics?filters=...` link for the user to copy.
5. **State Management**: Use React Hooks (`useState`, `useEffect`) or context to manage the fetched data and the currently active filters.
6. **Cleanup**: Remove any obsolete mock data files or hardcoded JSON structures in the frontend bundle. Ensure the frontend gracefully handles loading states and empty results.

Please provide the necessary code modifications, focusing first on creating a custom hook (e.g., `useEvents.ts`, `useClubs.ts`) and subsequently updating the core UI components to consume these hooks.
***
