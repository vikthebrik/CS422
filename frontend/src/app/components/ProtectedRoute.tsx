/**
 * @file ProtectedRoute.tsx
 * @description Route guard for authenticated (and optionally role-gated) routes.
 *
 * ## Behavior
 * 1. If `authReady` is false (token validation in progress on mount) → renders nothing
 *    to prevent a flash redirect before the session is restored.
 * 2. If no `currentUser` → redirects to "/" (homepage / Dashboard).
 * 3. If `role` prop is provided and doesn't match `currentUser.role` → redirects to "/".
 * 4. Otherwise → renders `<Outlet />` (the protected child route).
 *
 * ## Usage in App.tsx
 * ```tsx
 * // Any authenticated user
 * { element: <ProtectedRoute />, children: [...] }
 *
 * // Root admin only
 * { element: <ProtectedRoute role="admin" />, children: [...] }
 * ```
 */
import { Navigate, Outlet } from 'react-router';
import { useApp } from '../context/AppContext';

interface Props {
  /** If provided, the user must have this role. Otherwise any authenticated user is allowed. */
  role?: 'admin' | 'club_officer';
}

export function ProtectedRoute({ role }: Props) {
  const { authReady, currentUser } = useApp();

  // Still validating the stored token — render nothing to avoid a flash redirect
  if (!authReady) return null;

  if (!currentUser) return <Navigate to="/" replace />;

  if (role && currentUser.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
}
