import { Users, ExternalLink, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

export function ClubRoster() {
  const { clubs, currentUser, addClub } = useApp();
  const navigate = useNavigate();
  const [isAddClubOpen, setIsAddClubOpen] = useState(false);

  const canAddClub = currentUser?.role === 'admin';

  const handleAddClub = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clubId = formData.get('clubId') as string;
    const clubName = formData.get('clubName') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // In a real app, you would store credentials securely
    const newClub = {
      id: clubId.toLowerCase().replace(/\s+/g, '-'),
      name: clubName,
      color: color || '#' + Math.floor(Math.random()*16777215).toString(16),
      description,
    };

    addClub(newClub);
    toast.success(`Club "${clubName}" added successfully. Username: ${username}`);
    setIsAddClubOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1">Club Roster</h2>
          <p className="text-muted-foreground">
            Explore all student organizations in the Multicultural Center
          </p>
        </div>
        {canAddClub && (
          <Button onClick={() => setIsAddClubOpen(true)} className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Club
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((club) => (
          <Card
            key={club.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/club/${club.id}`)}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: club.color }}
                >
                  {club.logo ? (
                    <ImageWithFallback
                      src={club.logo}
                      alt={`${club.name} logo`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">{club.name.substring(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {club.orgType === 'department' ? 'Department' : 'Union'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {club.description || 'Student organization'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>View details</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Club Modal */}
      <Dialog open={isAddClubOpen} onOpenChange={setIsAddClubOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Club</DialogTitle>
            <DialogDescription>
              Create a new club and assign login credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClub} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clubId">Club ID</Label>
                <Input 
                  id="clubId" 
                  name="clubId" 
                  placeholder="e.g., nsu" 
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">Lowercase, no spaces</p>
              </div>
              <div>
                <Label htmlFor="clubName">Club Name</Label>
                <Input 
                  id="clubName" 
                  name="clubName" 
                  placeholder="e.g., NSU" 
                  required 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Brief description of the club"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Brand Color</Label>
              <Input 
                id="color" 
                name="color" 
                type="color" 
                defaultValue="#4ECDC4"
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Club Admin Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username/Email</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    type="email"
                    placeholder="clubname@uoregon.edu" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="text"
                    placeholder="Assign a password" 
                    required 
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These credentials will be shared with the club admin. Only upper admin can create or modify credentials.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddClubOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Add Club
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}