import { useState } from 'react';
import { Key, Pencil, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';

interface ClubCredential {
  clubId: string;
  clubName: string;
  username: string;
  password: string;
}

export function PasswordManagement() {
  const { clubs } = useApp();
  
  // Mock credentials storage - in real app this would be in secure backend
  const [credentials, setCredentials] = useState<ClubCredential[]>([
    { clubId: 'bsu', clubName: 'BSU', username: 'bsu@uoregon.edu', password: 'clubadmin' },
    { clubId: 'saca', clubName: 'SACA', username: 'saca@uoregon.edu', password: 'saca2024' },
    { clubId: 'msa', clubName: 'MSA', username: 'msa@uoregon.edu', password: 'msa2024' },
    { clubId: 'vsa', clubName: 'VSA', username: 'vsa@uoregon.edu', password: 'vsa2024' },
    { clubId: 'lsu', clubName: 'LSU', username: 'lsu@uoregon.edu', password: 'lsu2024' },
    { clubId: 'aasu', clubName: 'AASU', username: 'aasu@uoregon.edu', password: 'aasu2024' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '' });

  const handleEdit = (cred: ClubCredential) => {
    setEditingId(cred.clubId);
    setEditForm({ username: cred.username, password: cred.password });
  };

  const handleSave = (clubId: string) => {
    setCredentials(prev => 
      prev.map(cred => 
        cred.clubId === clubId 
          ? { ...cred, username: editForm.username, password: editForm.password }
          : cred
      )
    );
    toast.success('Credentials updated successfully');
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ username: '', password: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Password Management</h2>
        <p className="text-muted-foreground">
          Manage login credentials for all club administrators
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
                Only upper admin can create and modify club admin credentials. Store passwords securely and communicate them through official UO channels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Club Admin Credentials</CardTitle>
          <CardDescription>
            View and update login information for all registered clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {credentials.map((cred) => {
              const club = clubs.find(c => c.id === cred.clubId);
              const isEditing = editingId === cred.clubId;

              return (
                <div 
                  key={cred.clubId} 
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start gap-4">
                    {club && (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: club.color }}
                      >
                        <span className="text-lg">{club.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-lg">{cred.clubName}</h4>
                        <Badge variant="secondary" className="text-xs">Club Admin</Badge>
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`username-${cred.clubId}`} className="text-xs">
                                Username/Email
                              </Label>
                              <Input
                                id={`username-${cred.clubId}`}
                                value={editForm.username}
                                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`password-${cred.clubId}`} className="text-xs">
                                Password
                              </Label>
                              <Input
                                id={`password-${cred.clubId}`}
                                value={editForm.password}
                                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-primary"
                              onClick={() => handleSave(cred.clubId)}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Username/Email</p>
                              <p className="text-sm font-medium font-mono bg-muted px-2 py-1 rounded">
                                {cred.username}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Password</p>
                              <p className="text-sm font-medium font-mono bg-muted px-2 py-1 rounded">
                                {'•'.repeat(cred.password.length)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(cred)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit Credentials
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> When you create a new club via the Club Roster page, you assign credentials during that process. This page allows you to view and update existing credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
