import { Calendar, Menu, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { LoginDialog } from './LoginDialog';
import { ThemeToggle } from './ThemeToggle';
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
              <div className="bg-primary text-primary-foreground rounded-lg p-2">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl">MCC Calendar Hub</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  University of Oregon Multicultural Center
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
              <Button 
                onClick={handleSignOut}
                variant="outline"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
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