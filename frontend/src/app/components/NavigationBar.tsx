import { Calendar, Menu, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { LoginDialog } from './LoginDialog';
import { toast } from 'sonner';

interface NavigationBarProps {
  onToggleSidebar?: () => void;
}

export function NavigationBar({ onToggleSidebar }: NavigationBarProps) {
  const { currentUser, setCurrentUser } = useApp();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleSignOut = () => {
    setCurrentUser(null);
    toast.success('Signed out successfully');
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
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground rounded-lg p-2">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl">MCC Calendar Hub</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  University of Oregon Multicultural Center
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <div className="text-right">
                  <p className="text-sm">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
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