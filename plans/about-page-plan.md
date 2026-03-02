# Implementation Plan: Comprehensive "About the MCC" Page

This document outlines the architecture and implementation steps for a dynamic, artistic, and fully editable "About" page for the Multicultural Center. 

## Goal Description
Create a rich `/about` page that acts as a scrollable showcase of the MCC's history, sister cultural departments, ASUO support, and affiliated organizations. 
Crucially, the page content must be fully editable by the root MCC admin directly within the user interface, without touching the codebase. 

## App Architecture & Data Storage

Since this is "disconnected from the databasing logic" of regular events/clubs, we need a flexible way to store modular sections (blocks) of content.

### Backend & Database Structure
Instead of rigid columns, we will use a single `site_settings` table (or similar) to store the page configuration as a JSON array of **Blocks**. This provides maximum flexibility for the artistic layout.

```sql
-- Migration: 008_site_settings.sql
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Policies:
-- 1. Anyone can SELECT
-- 2. Only 'admin' role can UPDATE/INSERT
```

We will also ensure a Supabase Storage bucket (e.g., `mcc-public-assets`) exists to accept image and video uploads from the root admin.

### Block-Based Content System
The page will render an array of `Block` objects. The MCC Root Admin can add, remove, and reorder these blocks.

**Block Types**:
1. **Text/Markdown Block**: For MCC history and ASUO support descriptions.
2. **Media Block (Image/Video)**: For uploading artist hero sections, photos of the center, or promotional videos to the Supabase bucket.
3. **Link Container**: A customizable grid of external or internal links (e.g., sister cultural departments).
4. **Club Showcase**: Allows the admin to select specific registered clubs (e.g., 3 Latin clubs) from the system. The frontend will automatically pull their logos, names, and link them to their respective `/club/:id` pages.

## Frontend Implementation

1. **The Public View (`/about`)**:
   - Fetches the JSON configuration from `site_settings`.
   - Maps through the `Blocks` array and renders the appropriate React component (`<TextBlock />`, `<MediaBlock />`, `<ClubShowcaseBlock />`).
   - Uses smooth scrolling and potentially `framer-motion` or standard CSS animations for an "artistic scrollable" feel.

2. **The Admin Edit Mode**:
   - If `currentUser?.role === 'admin'`, a floating "Edit Page" toggle appears.
   - When toggled, the page transforms into an interactive editor:
     - Each block gains an "Edit", "Move Up/Down", and "Delete" button.
     - A floating "Add Block" menu allows the admin to insert new content anywhere on the page.
   - **Rich Inputs**:
     - Media blocks will feature an upload zone that posts to Supabase Storage and saves the resulting URL.
     - Club Showcase blocks will provide a multi-select dropdown of all registered clubs (from `AppContext`).
   - "Save Changes" pushes the mutated JSON array back to the backend `/site-settings/about-page` endpoint.

3. **Backend Endpoints (`server/src/index.ts`)**:
   - `GET /site-settings/:key`: Returns the public JSON payload.
   - `PUT /site-settings/:key`: Protected by `requireRoot` middleware. Accepts the updated JSON payload and persists it to the database.

## Step-by-Step Implementation Steps

1. **Database prep**: Create the `site_settings` table and ensure the media storage bucket exists.
2. **Backend API**: Add the `GET` and `PUT` endpoints for site settings.
3. **Frontend Foundations**: Define TypeScript interfaces for the different `Block` types.
4. **Public Page Development**: Build the `/about` route and construct the artistic rendering for each block type. 
5. **Admin Editor Development**: Build the inline WYSIWYG editor state, including the media upload handlers, club selection dropdowns, and drag-and-drop/ordering logic.
6. **Final Polish**: Implement the "Save Changes" network request and add CSS scroll-animations.
