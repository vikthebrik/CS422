# LoginDialog

Tags: #frontend #component #auth

**File:** `frontend/src/app/components/LoginDialog.tsx`

Admin sign-in modal. Opened by [[NavigationBar]] ("Admin Sign In" button).

## Flow

1. User enters email (validated) + password
2. Calls `POST /auth/login { email, password }` → `{ token, user }`
3. On success: stores token in localStorage, sets `currentUser` + `authToken` in [[AppContext]]
4. Redirects to `/club-management`

## Links

- "Forgot Password" → navigates to [[Auth Pages#ForgotPassword]] (`/forgot-password`)
- "Request Account" → navigates to [[Auth Pages#RequestAccount]] (`/request-account`)

## Reads/writes from [[AppContext]]
- Writes: `currentUser`, `authToken`

## Related
- [[NavigationBar]] — opens this dialog
- [[Auth Pages]] — ForgotPassword + RequestAccount linked from here
- [[Auth Flow]] — full login lifecycle
- [[AppContext]] — stores token + user state
- [[ProtectedRoute]] — gates routes that require login
