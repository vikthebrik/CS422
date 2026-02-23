# Complete Deployment Guide: MCC Scheduler

This guide provides step-by-step instructions to take the current local MCC Scheduler application (React Frontend + Express Backend + Supabase) and deploy it fully to production using Vercel and Render.

Before starting, ensure all your latest changes (including the `frontend/` directory and backend updates) are pushed to your GitHub repository.

---

## Phase 1: Database Setup (Supabase)

Your Supabase project is already created (`pebrldlhwfcnyipcooxo`), but you need to ensure the production environment is ready.

1.  **Verify Migrations**: 
    If you haven't already, go to the Supabase SQL Editor and run the migration files located in `server/src/db/migrations/` in order (001 through 005) to ensure the 3NF schema, roles, and Row Level Security (RLS) policies are active.
2.  **Get Production Keys**:
    Go to **Project Settings** -> **API**.
    *   Copy the **Project URL** (e.g., `https://pebrldlhwfcnyipcooxo.supabase.co`).
    *   Copy the **service_role secret** key (IMPORTANT: Never expose this to the frontend).
3.  **Seed Production Admin**:
    Create your root admin account in the Supabase Authentication dashboard, and manually insert the role link in the SQL editor:
    ```sql
    INSERT INTO user_roles (user_id, email, role) 
    VALUES ('<THE_NEW_USER_UUID>', 'mcc@uoregon.edu', 'root');
    ```

---

## Phase 2: Deploy Backend API (Render)

Deploy the backend first, as you need its live URL to configure the frontend.

1.  **Sign in to Render**: Go to [render.com](https://render.com) and log in.
2.  **Create Web Service**: Click **New +** and select **Web Service**.
3.  **Connect Repository**: Connect your GitHub repository containing the CS422 project.
4.  **Configure Service Details**:
    *   **Name**: `mcc-scheduler-api` (or similar)
    *   **Language**: Node
    *   **Root Directory**: `server` *(CRITICAL: This tells Render to only build the backend folder)*
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
5.  **Set Environment Variables**:
    Scroll down and add the following keys. (You will update `ALLOWED_ORIGINS` in Phase 4).
    *   `SUPABASE_URL`: (From Phase 1)
    *   `SUPABASE_KEY`: (The `service_role` secret from Phase 1)
    *   `SYNC_SECRET`: Generate a random string (e.g., `openssl rand -hex 32`) or use the one from your local `.env`.
    *   `PORT`: `4000`
6.  **Deploy**: Click **Create Web Service**. 
7.  **Save the URL**: Once the build completes, copy the service URL (e.g., `https://mcc-scheduler-api.onrender.com`).

---

## Phase 3: Deploy Frontend UI (Vercel)

Now deploy the React application.

1.  **Sign in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Create Project**: Click **Add New...** -> **Project**.
3.  **Import Repository**: Select the same GitHub repository.
4.  **Configure Project Details**:
    *   **Framework Preset**: Vite (should be auto-detected)
    *   **Root Directory**: `frontend` *(CRITICAL: Click "Edit" and change this from `./` to `frontend` so it builds the new React app)*
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Set Environment Variables**:
    *   `VITE_API_BASE_URL`: Paste the Render URL you saved in Phase 2 (e.g., `https://mcc-scheduler-api.onrender.com`).
6.  **Deploy**: Click **Deploy**.
7.  **Save the URL**: Once finished, copy the Vercel production URL (e.g., `https://mcc-scheduler.vercel.app`).

---

## Phase 4: Finalizing Connections (CORS)

For security, the backend needs to know it's allowed to accept requests from your new Vercel domain.

1.  Go back to your **Render Dashboard** -> Your Web Service -> **Environment**.
2.  Add a new variable:
    *   `ALLOWED_ORIGINS`: Paste your Vercel URL (e.g., `https://mcc-scheduler.vercel.app`). Do not include a trailing slash.
3.  Render will prompt you to save and automatically redeploy the backend with the new CORS configuration.

---

## Phase 5: Setting up the Cron Job (Sync Worker)

The backend has a script (`server/src/scripts/sync_all.ts`) that fetches events from Outlook ICS URLs and updates Supabase. This needs to run on a schedule.

Since Render's "Cron Job" feature requires a paid tier, the easiest free alternative is to use **GitHub Actions**.

### Creating the GitHub Action

1.  In your local project, go to the absolute root directory (above `server/` and `frontend/`).
2.  Create a folder path: `.github/workflows/`
3.  Create a file named `sync.yml` inside that folder.
4.  Paste the following configuration:

```yaml
name: Scheduled Database Sync

on:
  schedule:
    # Runs at minute 0 past every 3rd hour (e.g., 12am, 3am, 6am...)
    - cron: '0 */3 * * *'
  workflow_dispatch: # Allows you to trigger it manually from the GitHub UI

jobs:
  sync_events:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./server
        
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install Dependencies
        run: npm ci

      - name: Run Sync Script
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          PORT: 4000
        run: npx ts-node src/scripts/sync_all.ts
```

### Configure GitHub Secrets
For the action to run, GitHub needs access to your database keys.
1.  Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **New repository secret**.
3.  Add `SUPABASE_URL` with your Supabase URL.
4.  Add `SUPABASE_KEY` with your Supabase service_role key.

Commit and push this `.github` folder. GitHub will now automatically run your sync script every 3 hours!

---

## Testing the Production Run
1. Navigate to your Vercel URL.
2. The UI should load and fetch any existing events from the Render API.
3. Test logging into the admin portal using the credentials you created in Phase 1.
4. Go to your GitHub Actions tab and manually run the "Scheduled Database Sync" workflow to ensure it can successfully hit the Supabase database.
