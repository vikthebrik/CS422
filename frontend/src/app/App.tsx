import { RouterProvider, createBrowserRouter } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Collab } from './pages/Collab';
import { ClubRoster } from './pages/ClubRoster';
import { ClubPage } from './pages/ClubPage';
import { EventPage } from './pages/EventPage';
import { ClubManagement } from './pages/ClubManagement';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { RequestAccount } from './pages/RequestAccount';

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "clubs",
        Component: ClubRoster,
      },
      {
        path: "club/:clubId",
        Component: ClubPage,
      },
      {
        path: "event/:eventId",
        Component: EventPage,
      },
      {
        path: "admin",
        Component: Admin,
      },
      {
        path: "collab",
        Component: Collab,
      },
      {
        path: "club-management",
        Component: ClubManagement,
      },
      {
        path: "forgot-password",
        Component: ForgotPassword,
      },
      {
        path: "reset-password",
        Component: ResetPassword,
      },
      {
        path: "request-account",
        Component: RequestAccount,
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