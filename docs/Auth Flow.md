# Auth Flow

Tags: #backend #frontend #auth

End-to-end authentication lifecycle for MCC Calendar Hub.

## Login Flow

1. User clicks "Admin Sign In" in [[NavigationBar]] → [[LoginDialog]] opens
2. User submits credentials → `POST /auth/login { email, password }`
3. Backend signs in via Supabase auth, looks up `user_roles` row, returns `{ token, user }`
4. Frontend stores token in `localStorage` under key `mcc_auth_token`
5. [[AppContext]] sets `currentUser` + `authToken`
6. Redirect to `/club-management`

## Session Persistence

On app mount, [[AppContext]] reads `mcc_auth_token` from localStorage and calls `GET /auth/me`.
- Valid token → restores `currentUser`
- Invalid/expired → clears token, stays unauthenticated

## Sign-Out Flow

1. User clicks "Sign Out" in [[NavigationBar]]
2. `setCurrentUser(null)` + `setAuthToken(null)` in [[AppContext]]
3. Token removed from `localStorage`
4. Navigate to `/`

## Password Reset

1. User visits [[Auth Pages#ForgotPassword]] (`/forgot-password`)
2. `POST /auth/forgot-password { email }` → Supabase sends reset email
3. Email link → `/reset-password` (handles implicit + PKCE token flows)
4. `POST /auth/reset-password { token, newPassword }` → updates password

## Account Request → Approval

1. Prospective club admin submits form at [[Auth Pages#RequestAccount]]
2. `POST /auth/request-account` → row in `account_requests`
3. Root admin approves in [[ClubManagement]] → `POST /admin/requests/:id/approve`
4. Backend creates club + user_roles row + sends credentials email via SMTP

## Email Change Flow

1. Club admin requests change in [[Auth Pages#ChangePassword]]
2. `POST /auth/change-email { newEmail }` → HMAC-signed confirmation link sent to new email
3. User clicks link → `/confirm-email` ([[Auth Pages#ConfirmEmail]])
4. `POST /auth/confirm-email { token }` → updates Supabase auth email + user_roles.email

## DB Roles → Frontend Roles

| DB role | Frontend role |
|---------|--------------|
| `root` | `'admin'` |
| `club_admin` | `'club_officer'` |

## Related
- [[LoginDialog]] — step 2 UI
- [[NavigationBar]] — sign-out UI
- [[Auth Pages]] — ForgotPassword, ResetPassword, RequestAccount, ConfirmEmail, ChangePassword
- [[ProtectedRoute]] — enforces auth on frontend routes
- [[Auth Middleware]] — backend JWT validation
- [[AppContext]] — stores currentUser + authToken
- [[Database]] — user_roles + account_requests tables
