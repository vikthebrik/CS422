# Codebase Cleanup Plan

This document outlines the files and directories that should be deleted or modified to reduce the repository footprint. The transition from the old React application to the new Figma-generated frontend means several legacy directories are no longer needed.

## Phase 1: Removing Deprecated Root Directories

The original frontend was built in the `web/` directory. Since we have entirely replaced this with the Vite/Tailwind app in `frontend/`, the old directory can be safely deleted. 

**Action Item:**
- [ ] Delete the entire `web/` directory.

## Phase 2: Removing Obsolete Root Configuration Files

There are several files in the root of the repository that pertained to older development choices and are no longer actively used, or are redundant.

**Action Items:**
- [ ] Delete `APP_MANUAL.md`. This was heavily outdated and we have successfully moved all necessary application state documentation into `CLAUDE.md`.
- [ ] Ensure `vercel.json` and `render.yaml` are the only deployment configs remaining.

## Phase 3: Cleaning Up the New Frontend (`frontend/`)

During the initial code generation and mock-up phase, several data files were used to stub out the UI. Since the frontend is now successfully wired up to the `useEvents` and `useClubs` hooks connected to the Render API, we must remove this mock data to prevent accidentally shipping dead code or artificially inflating the bundle size.

**Action Items:**
- [ ] Delete `frontend/src/app/data/mockData.ts`
- [ ] Update `frontend/src/app/pages/Collab.tsx`
  - Remove the import: `import { collabEvents } from '../data/mockData';`
  - Either replace `collabEvents` with an empty array `[]` temporarily or implement a `useCollabs` hook bridging to the database if the collaborations feature is requested next.

## Summary of Commands to Execute for Cleanup
```bash
# 1. Remove old web folder
rm -rf web/

# 2. Remove outdated documentation
rm APP_MANUAL.md

# 3. Remove frontend mock data
rm frontend/src/app/data/mockData.ts

# 4. Patch Collab.tsx to remove mockData import
# (Manual edit required in frontend/src/app/pages/Collab.tsx)
```
