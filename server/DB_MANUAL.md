# Database Management Manual

This guide explains how to manage the MCC Scheduler backend database, including adding clubs, syncing events, and troubleshooting.

## 1. Initial Setup

Ensure your environment is configured correctly:
1.  **Environment Variables**: You must have a `.env` file in the `server/` directory with `SUPABASE_URL` and `SUPABASE_KEY`.
2.  **Dependencies**: Run `npm install` in the `server/` directory if you haven't already.

## 2. Managing Clubs (Adding/Removing Sources)

The system uses a file-based configuration for clubs to make batch syncing easy.

1.  Open `server/clubs.json`.
2.  Add a new club object to the list:
    ```json
    {
      "name": "Club Name",
      "url": "https://link-to-ics-file.ics"
    }
    ```
    *   **Name**: Must be unique. This is how events are grouped in the database.
    *   **URL**: The direct link to the `.ics` calendar file (e.g., from Outlook or Google Calendar).

3.  To **remove** a club from future syncs, simply delete its entry from this file.
    *   *Note: This does not delete existing data in the database. You must do that manually in the Supabase Dashboard if desired.*

## 3. Syncing Events

To fetch the latest events from all configured clubs:

1.  Open your terminal.
2.  Navigate to the server folder: `cd server`
3.  Run the sync command:
    ```bash
    npm run sync-all
    ```

**What happens during sync:**
- The script iterates through every club in `clubs.json`.
- It downloads the ICS file.
- It **Upserts** (Update or Insert) events into the `events` table.
    - New events are added.
    - Existing events (matching by ID) are updated with any changes (time, location, description).
- It infers metadata:
    - **Event Type**: Automatically tagged as "Office Hours", "Weekly Meeting", etc., based on keywords.
    - **RSVP**: automatically flagged if "RSVP" or "Register" is found in the description.

## 4. Manual Database Operations (Supabase Dashboard)

For operations not covered by the script, use the Supabase Dashboard.

### Viewing Data
- Go to the **Table Editor**.
- Select `events` to see all scheduled items.
- Select `clubs` to see registered organizations.   

### Editing Data Manually
You can manually edit any field (e.g., fixing a typo in a title, or changing an event type) directly in the Supabase Table Editor.
*   **Warning**: If you change a field that comes from the ICS feed (like `start_time` or `description`), it might be overwritten the next time `npm run sync-all` runs.
*   **Safe to Edit**: Fields that are *not* present in the ICS feed are safe to edit manually if you add custom columns later.

### Deleting Data
- **Delete an Event**: Select the row in Supabase and click "Delete". It will re-appear if it still exists in the ICS feed upon next sync.
- **Delete a Club**: Deleting a club row will typically cascade delete its events (depending on foreign key settings), or you may need to delete its events first.

## 5. Collaboration Workflow

The system now supports **Collaborations**, where multiple clubs host a single event.

1.  **Detection**: If `npm run sync-all` finds an event UID that already exists but belongs to a different club, it creates a `collaboration` entry.
2.  **Status**: New collaborations are created with `status = 'pending'`.
3.  **Approval**:
    - An Admin (Root or Club Admin) must approve these.
    - **Verify/Edit**: Go to the `collaborations` table in Supabase. Change `status` from `'pending'` to `'accepted'`.
    - Future: This will be handled via an Admin UI.

## 6. Troubleshooting

**"Invalid URL" or Fetch Error**
- Check that the URL in `clubs.json` is a direct link to an `.ics` file.
- Google Calendar links often need to use the "Secret address in iCal format".
- Outlook links should end in `.ics`.

**Events not showing up**
- Check the terminal output of `npm run sync-all`.
- Start/End times might be missing in the source feed (warnings will be logged).

**Duplicate Clubs**
- The system prevents duplicate clubs by name. If you change a club's name in `clubs.json` (e.g. "MSA" -> "Muslim Student Association"), it will create a *new* club entry. You may want to manually delete the old "MSA" entry in Supabase to avoid clutter.
