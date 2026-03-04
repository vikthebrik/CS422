# Collaborations and Event Sync Logic Plan

The goal is to properly capture automatically generated "collaborations" when a club invites another club to an event via an Outlook Calendar invite. Furthermore, if the invited club accepts the invite on Outlook, the collaboration should automatically be accepted on our platform. 

## Background
Currently, if two clubs have the same event on their calendar (with the same ICS UID), the synchronization script (`sync_all.ts`) treats the first club to sync as the `Primary` and subsequent clubs as `Secondary` collaborators. We need to expand this.

## Proposed Changes

### [MODIFY] `server/src/scripts/populate_supabase.ts`
When parsing an ICS `VEVENT`:
1. **Extract Attendees**: Use `node-ical` to read the `attendee` property of the event.
2. **Identify Accepted Status**: The attendee object typically contains a `PARTSTAT` property (Participation Status). If it is `ACCEPTED`, the club has accepted the invite on Outlook.
3. **Match Attendees to Clubs**: Cross-reference the email addresses found in the attendees list against registered club admin emails in the `user_roles` table, or parse common club emails directly from the `clubs` table.
4. **Auto-Create Collaborations**:
   - If an attendee matches another registered club on our platform, upsert a `collaborations` record.
   - If the Outlook `PARTSTAT` is `ACCEPTED`, set the `status` of this collaboration to `accepted`. 
   - Otherwise, set it to `pending`.
5. **Handle Duplicate UIDs**: The existing duplicate UID logic works well for clubs that manually add the event to their own calendar without being invited. We will retain this functionality but ensure it synergizes with the new attendee logic (i.e. if an event is matched by UID, check if the "secondary" club has already accepted it).

### [MODIFY] `server/src/index.ts`
1. Ensure the `GET /events` endpoints fetch and return all `collaborations` associated with an event.
2. Ensure the `GET /collab` (pending collaborations) endpoint exists and returns collaborations where the `club_id` matches the current user and the `status` is `pending`.
3. Ensure the `PATCH /collab/:id` endpoint exists to allow club admins to manually accept or reject a pending collaboration from the frontend UI.

### [MODIFY] `frontend/src/app/pages/Collaborate.tsx` (or similar)
1. **Pending Collaborations UI**: Build a view where club officers can see incoming collaboration requests (events they were invited to).
2. **Action Buttons**: Provide "Accept" and "Decline" buttons that hit the `PATCH /collab/:id` endpoint.
3. **Visual Representation**: Ensure that accepted collaborations display the secondary club's logo/name alongside the primary host in the main events feed.

## Verification Plan
1. Send an Outlook calendar invite from Club A to Club B.
2. Run the sync script. Verify a `pending` collaboration appears for Club B in the UI.
3. Have Club B accept the invite in Outlook.
4. Run the sync script again. Verify the collaboration automatically changes to `accepted` and appears publicly on the main feed with both clubs.
