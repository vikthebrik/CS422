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

## 4. Deployment

### Frontend (Vercel)
The website is hosted on Vercel.

1.  Push your changes to GitHub.
2.  **Importing**: When importing the project in Vercel:
    *   **Root Directory**: Select `web` if asked, OR rely on the `vercel.json` I created in the root.
    *   **Framework Preset**: Vite.
3.  **Environment Variables (CRITICAL)**:
    *   **NEVER** commit `.env` files to GitHub. They are ignored by `.gitignore`.
    *   In the Vercel Dashboard, go to **Settings > Environment Variables**.
    *   Add `VITE_API_BASE_URL` with your production backend URL (e.g., `https://my-api.onrender.com`).
    *   Vercel injects these during the build process.

### Backend (Render / UO Servers)
The API is hosted separately (currently recommended on Render/Railway).

1.  Push your changes to GitHub.
2.  Your host (e.g., Render) should trigger a new build.
3.  **Environment Variables**:
    *   `SUPABASE_URL`: Your Supabase URL.
    *   `SUPABASE_KEY`: Your Supabase Service Key.

## 5. Troubleshooting

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
