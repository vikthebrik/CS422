/**
 * @file Layout.tsx
 * @description Shell layout component rendered for every route.
 *
 * ## Structure
 * ```
 * <div> (min-h-screen flex-col)
 *   NavigationBar          sticky top bar — logo, auth, ThemeToggle
 *   <div> (flex flex-1)
 *     FilterSidebar        collapsible left panel — club/type/search filters
 *     <main>               scrollable content area (max-w-[1200px])
 *       tab nav            role-gated links (Dashboard / Club Roster / Collaborate / Clubs / About)
 *       <Outlet />         active page component injected here by React Router
 *   Toaster                sonner toast notification host
 *   EventReminderPopup     bottom-right popup for today's / this-weekend's events
 * ```
 *
 * ## Navigation Visibility Rules
 * | Tab         | Visible when                          |
 * |-------------|---------------------------------------|
 * | Dashboard   | always                                |
 * | Club Roster | always                                |
 * | Collaborate | authenticated (any role)              |
 * | Clubs       | admin role only                       |
 * | About       | always                                |
 *
 * ## Sidebar
 * On desktop (lg+) the sidebar is always visible (sticky).
 * On mobile it slides in/out via `isSidebarOpen` toggled by the hamburger in NavigationBar.
 */

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { NavigationBar } from './NavigationBar';
import { FilterSidebar } from './FilterSidebar';
import { EventReminderPopup } from './EventReminderPopup';
import { Calendar, Users, BookOpen, Building2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Toaster } from './ui/sonner';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser } = useApp();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Calendar, public: true },
    { name: 'Org Roster', href: '/clubs', icon: BookOpen, public: true },
    { name: 'Collaborate', href: '/collab', icon: Users, roles: ['admin', 'club_officer'] },
    { name: 'Clubs', href: '/club-management', icon: Building2, roles: ['admin'] },
    { name: 'About', href: '/about', icon: Info, public: true },
  ];

  const visibleNavigation = navigation.filter(item =>
    item.public || (currentUser && item.roles?.includes(currentUser.role))
  );

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1">
        <FilterSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-auto min-w-0">
          <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
            {/* Tab Navigation */}
            {visibleNavigation.length > 1 && (
              <div className="mb-6 border-b border-border">
                <nav className="flex">
                  {visibleNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-2 sm:px-4 py-3 border-b-2 transition-colors
                          ${isActive(item.href)
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline whitespace-nowrap">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
      <EventReminderPopup />
    </div>
  );
}
