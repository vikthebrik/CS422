import { useState, useEffect, useCallback } from 'react';
import { Key, Save, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

interface ClubAdminUser {
  id: string;
  email: string;
  clubId: string;
  clubName: string;
}

export function PasswordManagement() {
  const { clubs, authToken } = useApp();
  const [users, setUsers] = useState<ClubAdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPasswordForm, setNewPasswordForm] = useState<Record<string, string>>({});

  const apiCall = useCallback(
    (method: string, path: string, body?: object) =>
      fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    [authToken]
  );

  useEffect(() => {
    apiCall('GET', '/admin/users')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((data: ClubAdminUser[]) => setUsers(data))
      .catch(() => toast.error('Failed to load club accounts'))
      .finally(() => setLoadingUsers(false));
  }, [apiCall]);

  const handleResetPassword = async (userId: string) => {
    const newPassword = newPasswordForm[userId] ?? '';
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setResettingId(userId);
    try {
      const res = await apiCall('POST', `/admin/passwords/${userId}`, { newPassword });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to reset password');
        return;
      }
      toast.success('Password updated successfully');
      setNewPasswordForm(prev => ({ ...prev, [userId]: '' }));
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Password Management</h2>
        <p className="text-muted-foreground">
          Reset login passwords for club administrator accounts
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500 text-white rounded-full p-2 shrink-0">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-amber-900 mb-1">Security Notice</p>
              <p className="text-sm text-amber-800">
                Only the root administrator can reset club passwords. Communicate new credentials
                through official UO channels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Club Admin Accounts</CardTitle>
          <CardDescription>
            Set a new password for any club admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading accounts…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No club admin accounts found. Run the seed script to provision them.
            </p>
          ) : (
            <div className="space-y-4">
              {users.map(user => {
                const club = clubs.find(c => c.id === user.clubId);
                const isResetting = resettingId === user.id;

                return (
                  <div key={user.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {club && (
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0 text-lg"
                          style={{ backgroundColor: club.color }}
                        >
                          {club.name.substring(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{user.clubName ?? 'Unknown Club'}</h4>
                          <Badge variant="secondary" className="text-xs">Club Admin</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono mb-3">{user.email}</p>

                        <div className="flex items-end gap-2">
                          <div className="flex-1 max-w-xs">
                            <Label htmlFor={`pw-${user.id}`} className="text-xs">
                              New Password
                            </Label>
                            <Input
                              id={`pw-${user.id}`}
                              type="password"
                              placeholder="Min. 8 characters"
                              value={newPasswordForm[user.id] ?? ''}
                              onChange={e =>
                                setNewPasswordForm(prev => ({ ...prev, [user.id]: e.target.value }))
                              }
                              className="mt-1"
                              disabled={isResetting}
                            />
                          </div>
                          <Button
                            size="sm"
                            className="bg-primary shrink-0"
                            onClick={() => handleResetPassword(user.id)}
                            disabled={isResetting || !newPasswordForm[user.id]}
                          >
                            {isResetting ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3 mr-1" />
                            )}
                            {isResetting ? 'Saving…' : 'Set Password'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setNewPasswordForm(prev => ({ ...prev, [user.id]: '' }))
                            }
                            disabled={isResetting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
