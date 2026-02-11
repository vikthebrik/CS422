# Application Management Manual

This guide explains how to run, develop, and deploy the full-stack MCC Scheduler application (React Frontend + Express Backend).

## 1. Local Development Setup

To run the entire application locally, you need two terminal windows.

### Terminal 1: The Backend (API)
This serves the JSON data from Supabase to your frontend.

1.  Navigate to the server folder:
    ```bash
    cd server
    ```
2.  Start the server:
    ```bash
    npm start 
    ```
    *   **Success**: You should see `Server running on http://localhost:4000`.
    *   **Verify**: Open `http://localhost:4000/events` in your browser.

### Terminal 2: The Frontend (Website)
This is the visible website.

1.  Navigate to the web folder:
    ```bash
    cd web
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
    *   **Success**: It will show a URL (usually `http://localhost:5173`).
    *   **Verify**: Open that URL. You should see the events list.

## 2. Frontend Development (UI/Web)

The frontend is built with **React**, **TypeScript**, and **Tailwind CSS**.

*   **Location**: `web/src/`
*   **Key Files**:
    *   `App.tsx`: The main page component. Edit this to change the layout.
    *   `index.css`: Tailwind CSS imports.
    *   `postcss.config.js`: Configuration for Tailwind v4.

**Making Changes**:
Edit any file in `web/src`. The browser will automatically reload (Hot Module Replacement) to show your changes instantly.

## 3. Backend Development (API)

The backend is a simple **Express** server that talks to Supabase.

*   **Location**: `server/src/`
*   **Key Files**:
    *   `index.ts`: The main API file defining routes (`/events`, `/clubs`).
    *   `db/supabase.ts`: Shared connection to the database.

**Making Changes**:
1.  Stop the server (Ctrl+C).
2.  Edit the files in `server/src`.
3.  Re-build and start:
    ```bash
    npm run build && npm start
    ```
    *(Note: You can setup `nodemon` later for auto-restart if desired)*

## 4. Database Setup & Management

### Initial Schema Setup (Migrations)
The database schema is managed via SQL files in `server/src/db/migrations/`.
**Manual Action Required**: Run these scripts in your Supabase SQL Editor in order:
1.  `001_schema_upgrade.sql`: Core schema (Users, Collaborations).
2.  `002_cleanup_types.sql`: Enforces strict Event Types.
3.  `003_collab_status.sql`: Adds collaboration approval workflow.
4.  `004_add_logos.sql`: Adds club logo support.

### Authentication
*   **Root Admin**: A default root admin is available for the "Multicultural Center" club.
    *   Email: `mcc@uoregon.edu`
    *   Password: `password123` (Dev default, change in production)
*   **Seeding**: To reset/create this user, run:
    ```bash
    npx ts-node src/scripts/seed_auth.ts
    ```

### Club Logos
Images are stored in Supabase Storage and linked via URL.
1.  Create a Public Bucket named `club-logos` in Supabase.
2.  Upload images.
3.  Update the `clubs` table `logo_url` column with the public image link.

### Custom Calendar Subscriptions (ICS)
The backend now supports generating custom ICS files for specific Club/Type combinations.
**Endpoint**: `/events/ics`
**Query Param**: `filters` = Comma-separated list of `CLUB_ID:TYPE_ID` pairs.
*   **Format**: `?filters=clubId1:typeId1,clubId2:typeId2`
*   **Example**: `http://localhost:4000/events/ics?filters=123-abc:Events,456-def:Office%20Hours`
*   **Logic**: Returns events that match (Club1 AND Type1) OR (Club2 AND Type2).
*   **Note**: If you omit the Type ID (e.g. `clubId:`), it selects ALL events for that club.

## 6. Deployment Guide

### Part A: Backend (Deploy to Render first)
We deploy the backend first so we have a URL to give to the frontend.

1.  **Create Account**: Go to [render.com](https://render.com) and sign up/login.
2.  **New Web Service**: Click "New +" and select "Web Service".
3.  **Connect Repo**: Select your GitHub repository.
4.  **Configure Settings**:
    *   **Name**: `mcc-scheduler-backend` (or similar).
    *   **Root Directory**: `server` (Important! This tells Render to look in the server folder).
    *   **Environment**: Node.
    *   **Build Command**: `npm install && npm run build` (Pre-filled usually, but verify).
    *   **Start Command**: `npm start`.
5.  **Environment Variables**: Scroll down to "Environment Variables" and add:
    *   `SUPABASE_URL`: Your Supabase URL.
    *   `SUPABASE_KEY`: Your Supabase Service Key.
6.  **Deploy**: Click "Create Web Service".
7.  **Copy URL**: Once deployed, copy the URL (e.g., `https://mcc-scheduler.onrender.com`). You need this for Part B.

### Part B: Frontend (Deploy to Vercel)

1.  **Create Account**: Go to [vercel.com](https://vercel.com).
2.  **Add New Project**: Click "Add New..." > "Project".
3.  **Import Repo**: Select your GitHub repository.
4.  **Configure Project**:
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Root Directory**: Leave as `./` (The `vercel.json` file in your repo handles the rest).
        *   *Note: If Vercel insists on picking a folder, you can select `web`, but then you must ignore the `vercel.json` advice.*
5.  **Environment Variables**:
    *   Expand "Environment Variables".
    *   Key: `VITE_API_BASE_URL`
    *   Value: The Render URL you copied in Part A (e.g., `https://mcc-scheduler.onrender.com`).
6.  **Deploy**: Click "Deploy".

### Part C: Final Verification
1.  Open your new Vercel URL.
2.  It should load the App, then fetch data from your Render backend.
3.  If you see "Network Error" or "Failed to load", check the Console (F12) to see if it's a CORS issue or a 404.


## 6. Troubleshooting

**"Failed to load events" on Localhost**
1.  Is the backend running? Check Terminal 1.
2.  Is it on port 4000? Check the logs.
3.  Check the browser console (F12) for CORS errors.

**"Network Error" on Vercel**
*   Check that the `VITE_API_BASE_URL` environment variable is set correctly in Vercel.
*   Check that your backend is running (visiting the backend URL directly should show "MCC Scheduler API is running").

**Styles not applying**
*   Ensure `@tailwindcss/postcss` is installed and `postcss.config.js` is correct.
*   Ensure `npm run dev` was restarted after config changes.
