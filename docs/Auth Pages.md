# Auth Pages

Tags: #frontend #page #auth

Standalone pages for the authentication flow. See [[Auth Flow]] for the complete lifecycle.

## Pages

### ForgotPassword
**File:** `frontend/src/app/pages/ForgotPassword.tsx`
**Route:** `/forgot-password`

- Calls `POST /auth/forgot-password { email }` → Supabase sends reset email
- Email link resolves to `/reset-password`
- Linked from [[LoginDialog]]

### ResetPassword
**File:** `frontend/src/app/pages/ResetPassword.tsx`
**Route:** `/reset-password`

- Handles both implicit flow (hash-based token) and PKCE flow (query param `token_hash`)
- Calls `POST /auth/reset-password { token, newPassword }`

### RequestAccount
**File:** `frontend/src/app/pages/RequestAccount.tsx`
**Route:** `/request-account`

- Submits club name + contact email + optional message
- Calls `POST /auth/request-account` → inserts into `account_requests` table
- Pending requests visible to root admin in [[ClubManagement]]
- Linked from [[LoginDialog]]

### ConfirmEmail
**File:** `frontend/src/app/pages/ConfirmEmail.tsx`
**Route:** `/confirm-email`

- Handles HMAC-signed token from email change confirmation link
- Calls `POST /auth/confirm-email { token }` → updates Supabase auth email + `user_roles.email`
- Initiated by `POST /auth/change-email` from [[ChangePassword]]

### ChangePassword
**File:** `frontend/src/app/pages/ChangePassword.tsx`
**Route:** `/change-password`

- Verifies current password + sets new password via `POST /auth/change-password`
- Root admin section: change club admin email immediately
- Accessible via key icon in [[NavigationBar]] (all authenticated users)

## Related
- [[Auth Flow]] — complete lifecycle
- [[LoginDialog]] — entry point; links to ForgotPassword + RequestAccount
- [[NavigationBar]] — key icon links to ChangePassword
- [[ClubManagement]] — root admin views/approves account requests
- [[AppContext]] — auth state (currentUser, authToken)
