import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useApp } from '../context/AppContext';
import { users } from '../data/mockData';
import { toast } from 'sonner';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { setCurrentUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check credentials
    if (username === 'mcc@uoregon.edu' && password === 'upperadmin') {
      setCurrentUser(users[0]); // Admin user
      toast.success('Logged in as Upper Admin');
      onOpenChange(false);
      setUsername('');
      setPassword('');
    } else if (username === 'bsu@uoregon.edu' && password === 'clubadmin') {
      setCurrentUser(users[1]); // Club officer - update to BSU
      const bsuOfficer = { ...users[1], clubId: 'bsu', name: 'BSU President' };
      setCurrentUser(bsuOfficer);
      toast.success('Logged in as BSU Club Admin');
      onOpenChange(false);
      setUsername('');
      setPassword('');
    } else {
      toast.error('Invalid username or password');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            Sign in to access admin features and manage events
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Email / Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="email@uoregon.edu"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary">
              Sign In
            </Button>
          </div>
        </form>
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="mb-1">Demo credentials:</p>
          <p>Upper Admin: mcc@uoregon.edu / upperadmin</p>
          <p>Club Admin: bsu@uoregon.edu / clubadmin</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
