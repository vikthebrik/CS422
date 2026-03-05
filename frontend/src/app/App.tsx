/**
 * @file App.tsx
 * @description Root application component. Wires routing, theme, and global state.
 *
 * ## Component Tree
 * ```
 * ThemeProvider (next-themes — light/dark/system)
 *   └── AppProvider (AppContext — global events, clubs, auth, filter state)
 *         └── RouterProvider
 *               └── Layout (NavigationBar + FilterSidebar + tab nav + Toaster)
 *                     ├── [public]  Dashboard        /
 *                     ├── [public]  About            /about
 *                     ├── [public]  ClubRoster       /clubs
 *                     ├── [public]  ClubPage         /club/:clubId
 *                     ├── [public]  EventPage        /event/:eventId
 *                     ├── [public]  ForgotPassword   /forgot-password
 *                     ├── [public]  ResetPassword    /reset-password
 *                     ├── [public]  RequestAccount   /request-account
 *                     ├── [public]  ConfirmEmail     /confirm-email
 *                     ├── [auth]    Collab           /collab
 *                     ├── [auth]    ChangePassword   /change-password
 *                     └── [admin]   ClubManagement   /club-management
 * ```
 *
 * ## Auth Guards
 * `ProtectedRoute` with no `role` prop → any authenticated user.
 * `ProtectedRoute role="admin"` → root admin only (DB role "root").
 * Both variants wait for `authReady` before redirecting to avoid flash.
 */

import { RouterProvider, createBrowserRouter } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { About } from './pages/About';
import { Collab } from './pages/Collab';
import { ClubRoster } from './pages/ClubRoster';
import { ClubPage } from './pages/ClubPage';
import { EventPage } from './pages/EventPage';
import { ClubManagement } from './pages/ClubManagement';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { RequestAccount } from './pages/RequestAccount';
import { ChangePassword } from './pages/ChangePassword';
import { ConfirmEmail } from './pages/ConfirmEmail';

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      // Public routes
      { index: true, Component: Dashboard },
      { path: "about", Component: About },
      { path: "clubs", Component: ClubRoster },
      { path: "club/:clubId", Component: ClubPage },
      { path: "event/:eventId", Component: EventPage },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
      { path: "request-account", Component: RequestAccount },
      { path: "confirm-email", Component: ConfirmEmail },

      // Any authenticated user
      {
        element: <ProtectedRoute />,
        children: [
          { path: "collab", Component: Collab },
          { path: "change-password", Component: ChangePassword },
        ],
      },

      // Root admin only
      {
        element: <ProtectedRoute role="admin" />,
        children: [
          { path: "club-management", Component: ClubManagement },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ThemeProvider>
  );
}
