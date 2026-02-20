import { RouterProvider, createBrowserRouter } from 'react-router';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Collab } from './pages/Collab';
import { ClubRoster } from './pages/ClubRoster';
import { ClubPage } from './pages/ClubPage';
import { EventPage } from './pages/EventPage';
import { PasswordManagement } from './pages/PasswordManagement';

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
        path: "passwords",
        Component: PasswordManagement,
      },
    ],
  },
]);

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}