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

import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { NavigationBar } from './NavigationBar';
import { FilterSidebar } from './FilterSidebar';
import { EventReminderPopup } from './EventReminderPopup';
import { BugReportModal } from './BugReportModal';
import { AnnouncementBanner } from './AnnouncementBanner';
import { Calendar, Users, BookOpen, Building2, Info, Code2, Bug, Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Toaster } from './ui/sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [openBugCount, setOpenBugCount] = useState(0);
  const { currentUser, authToken } = useApp();
  const location = useLocation();

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    fetch(`${API_BASE}/admin/bug-reports?status=open`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setOpenBugCount(d.total); })
      .catch(() => {});
  }, [currentUser, authToken, location.pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Calendar, public: true },
    { name: 'Org Roster', href: '/clubs', icon: BookOpen, public: true },
    { name: 'Collaborate', href: '/collab', icon: Users, roles: ['admin', 'club_officer'] },
    { name: 'Clubs', href: '/club-management', icon: Building2, roles: ['admin'] },
    { name: 'About', href: '/about', icon: Info, public: true },
    { name: 'Usage Guide', href: '/developers', icon: Code2, public: true },
    { name: 'Announce', href: '/announcements', icon: Megaphone, roles: ['admin'] },
    { name: 'Issues', href: '/bug-reports', icon: Bug, roles: ['admin'] },
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

  const isDashboard = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1">
        {isDashboard && (
          <FilterSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

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
                            ? 'border-accent text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-accent/40'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline whitespace-nowrap">{item.name}</span>
                        {item.href === '/bug-reports' && openBugCount > 0 && (
                          <span className="ml-1 rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                            {openBugCount > 99 ? '99+' : openBugCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            <AnnouncementBanner />
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
      <EventReminderPopup />

      {/* Persistent "Report an Issue" FAB — bottom-left to avoid the bottom-right notification popup */}
      <button
        onClick={() => setIsBugReportOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-1.5 bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground text-xs px-3 py-1.5 rounded-full shadow transition-colors"
        title="Report an issue or give feedback"
      >
        <Bug className="h-3.5 w-3.5" />
        Report an Issue
      </button>

      <BugReportModal open={isBugReportOpen} onOpenChange={setIsBugReportOpen} />
    </div>
  );
}
