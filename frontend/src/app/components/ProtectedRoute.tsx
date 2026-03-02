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
