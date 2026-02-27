import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { NavigationBar } from './NavigationBar';
import { FilterSidebar } from './FilterSidebar';
import { Calendar, Users, BookOpen, KeyRound, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Toaster } from './ui/sonner';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentUser } = useApp();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Calendar, public: true },
    { name: 'Club Roster', href: '/clubs', icon: BookOpen, public: true },
    { name: 'Collaborate', href: '/collab', icon: Users, roles: ['admin', 'club_officer'] },
    { name: 'Clubs', href: '/club-management', icon: Building2, roles: ['admin'] },
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
                <nav className="flex gap-4 overflow-x-auto">
                  {visibleNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                          ${isActive(item.href)
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
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
    </div>
  );
}