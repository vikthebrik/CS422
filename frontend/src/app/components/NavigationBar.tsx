/**
 * @file NavigationBar.tsx
 * @description Sticky top navigation bar rendered by Layout.tsx.
 *
 * ## Responsibilities
 * - MCC logo + site name (links to Dashboard)
 * - ThemeToggle (light / dark / system)
 * - Auth section (right side):
 *   - Unauthenticated → "Admin Sign In" button → opens LoginDialog
 *   - Authenticated → club logo/name (links to /club/:id), key icon (→ /change-password), Sign Out
 *
 * ## Interactions
 * - Reads `currentUser`, `clubs` from AppContext to display club name/logo
 * - Calls `setCurrentUser(null)` + `setAuthToken(null)` on sign-out, then navigates to /
 * - Hamburger button (mobile only) calls `onToggleSidebar` → passed up to Layout
 *
 * ## Props
 * | Prop             | Type       | Description                              |
 * |------------------|------------|------------------------------------------|
 * | onToggleSidebar  | () => void | Toggles the mobile FilterSidebar         |
 */

import { Menu, LogOut, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { LoginDialog } from './LoginDialog';
import { ThemePicker } from './ThemePicker';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface NavigationBarProps {
  onToggleSidebar?: () => void;
}

export function NavigationBar({ onToggleSidebar }: NavigationBarProps) {
  const { currentUser, setCurrentUser, setAuthToken, clubs } = useApp();
  const navigate = useNavigate();

  const userClub = currentUser?.clubId ? clubs.find(c => c.id === currentUser.clubId) : null;
  const displayName = userClub?.name ?? currentUser?.name ?? '';
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleSignOut = () => {
    setCurrentUser(null);
    setAuthToken(null);
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <>
      <nav className="bg-card border-b border-border px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <img src="/assets/Waving.png" alt="MCC Logo" className="h-9 w-9 object-contain bg-primary rounded-lg p-0.5" />
              <div>
                <h1 className="text-lg sm:text-xl">MCC Calendar Hub</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  University of Oregon Multicultural Center
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemePicker />
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                {userClub ? (
                  <Link
                    to={`/club/${userClub.id}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {userClub.logo ? (
                      <ImageWithFallback
                        src={userClub.logo}
                        alt={userClub.name}
                        className="w-7 h-7 rounded object-cover"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-medium shrink-0"
                        style={{ backgroundColor: userClub.color }}
                      >
                        {userClub.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm">{displayName}</p>
                      <p className="text-xs text-muted-foreground">Club Officer</p>
                    </div>
                  </Link>
                ) : (
                  <div className="text-right">
                    <p className="text-sm">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</p>
                  </div>
                )}
              </div>
            )}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Change Password"
                  onClick={() => navigate('/change-password')}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsLoginOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                Admin Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
}
