# Implementation Plan: Authentication & Login Flow

This document details the implementation of a comprehensive login and authentication flow using Supabase Auth, addressing database structure, backend endpoints, and frontend integration.

## Goal Description
Enhance the existing basic login to a full-fledged authentication suite. This involves pre-provisioning accounts for all existing clubs, supporting a "request account" flow for new clubs, handling forgot/reset password flows securely, and allowing root admins to manage Event Types dynamically.

> [!CAUTION]
> The current `seed_auth.ts` appears to write directly to a `users` table with a `password_hash`, which conflicts with the `user_roles` + Supabase Auth (`auth.users`) mechanism established in `005_enable_auth.sql` and `index.ts`. We will fix this discrepancy to ensure Supabase Auth is correctly used as the single source of truth.

> [!NOTE]
> Since Supabase hashes passwords, the `PasswordManagement.tsx` UI cannot display passwords in plain text as it currently does with mock data. Instead, it will be updated to allow root admins to *reset* or *assign new* passwords for clubs.

## Proposed Changes

### Database & Seeding
- **`server/src/db/migrations/006_account_requests.sql`** [NEW]
  - Create an `account_requests` table to track "Request an Account" form submissions (columns: `id`, `club_name`, `contact_email`, `status`, `created_at`).
- **`server/src/scripts/seed_auth.ts`** [MODIFY]
  - Rewrite the script using the Supabase Admin Auth API (`supabase.auth.admin.createUser`) to properly create auth users for the MCC admin and *every* club in the `clubs` table.
  - Insert corresponding rows into `user_roles`.

---

### Backend API
- **`server/src/index.ts`** [MODIFY]
  - Add `POST /auth/request-account`: Inserts into `account_requests`.
  - Add `POST /auth/forgot-password`: Triggers Supabase password reset email.
  - Add `POST /auth/reset-password`: Completes the password change using a token from the email.
  - Add `POST /admin/passwords/:userId`: Allows Root Admin to forcibly update a club's password.
  - Add Event Type management endpoints (`POST /event-types`, `PATCH /event-types/:id`, `DELETE /event-types/:id`) protected by `requireRoot` middleware.

---

### Frontend Components & Pages
- **`frontend/src/app/pages/Login.tsx`** [MODIFY / NEW]
  - Implement regex email validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) before submission.
  - Add links to "Forgot Password" and "Request Account".
- **`frontend/src/app/pages/RequestAccount.tsx`** [NEW]
  - Form connecting to `/auth/request-account`.
- **`frontend/src/app/pages/ForgotPassword.tsx`** [NEW]
  - Form to input email and request a reset link.
- **`frontend/src/app/pages/ResetPassword.tsx`** [NEW]
  - Page to input a new password (Create Password) when arriving from an email link.
- **`frontend/src/app/pages/PasswordManagement.tsx`** [MODIFY]
  - Remove mock data. Fetch club users from backend. Allow Root Admin to trigger a password change for a specific club.
- **`frontend/src/app/pages/Admin.tsx`** [MODIFY]
  - Add a section for managing (creating, renaming) Event Types by consuming the new backend endpoints.

## Task Breakdown

### 1. Database & Schema Adjustments
- [ ] Create `account_requests` table for new club account requests.
- [ ] Verify `005_enable_auth.sql` aligns with the desired Supabase Auth + `user_roles` structure.
- [ ] Update `seed_auth.ts` to properly create `auth.users` through Supabase Admin API and populate `user_roles` for all existing clubs (MCC root + all club admins).

### 2. Backend API Extensions (`server/src/index.ts`)
- [ ] Implement `POST /auth/request-account` to handle new account requests.
- [ ] Implement password reset flows:
  - [ ] `POST /auth/forgot-password`
  - [ ] `POST /auth/reset-password` (Create/update password)
- [ ] Add Event Types CRUD endpoints (`GET`, `POST`, `PATCH`, `DELETE` on `/event-types`) restricted to Root Admins.
- [ ] Update `POST /auth/login` if any additional validation is needed.

### 3. Frontend Pages & Integration (`frontend/src/app/pages/`)
- [ ] **Login Page**: Add robust email regex validation (`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
- [ ] **Request Account Page**: Create a new form where users can request an account for their club.
- [ ] **Forgot/Reset Password Pages**: Create UI for the forgot password and create password flows.
- [ ] **Password Management**: Update `PasswordManagement.tsx` to reset passwords via the API rather than showing plain text mock passwords.
- [ ] **Event Types Management**: Add a section in the Root Admin Dashboard to manage `event_types`.

### 4. Verification & Testing
- [ ] Manually test Login, Forgot Password, and Reset Password flows.
- [ ] Verify Root Admin can manage passwords securely.
- [ ] Verify Root Admin can create and modify Event Types.
- [ ] Verify new clubs can request an account and Root Admins can approve it.
