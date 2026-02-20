import { useState, useMemo } from 'react';
import { Users, Plus, Clock, Check, X, Calendar, Building2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { collabEvents } from '../data/mockData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export function Collab() {
  const { clubs, currentUser } = useApp();
  const navigate = useNavigate();
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [partnerCenterName, setPartnerCenterName] = useState('');

  const isUpperAdmin = currentUser?.role === 'admin';
  const isClubAdmin = currentUser?.role === 'club_officer';

  // Filter collaborations based on user role
  const relevantCollabs = useMemo(() => {
    if (isUpperAdmin) {
      // Upper admin sees only center-level collaborations
      return collabEvents.filter(e => e.type === 'center');
    } else if (isClubAdmin && currentUser?.clubId) {
      // Club admin sees only club collaborations involving their club
      return collabEvents.filter(e => 
        e.type === 'club' && 
        (e.proposedBy === currentUser.clubId || e.partnerClubs.includes(currentUser.clubId))
      );
    }
    return [];
  }, [isUpperAdmin, isClubAdmin, currentUser?.clubId]);

  const togglePartner = (clubId: string) => {
    setSelectedPartners(prev =>
      prev.includes(clubId)
        ? prev.filter(id => id !== clubId)
        : [...prev, clubId]
    );
  };

  const handleSubmitProposal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUpperAdmin && partnerCenterName) {
      toast.success(`Center collaboration proposal with ${partnerCenterName} submitted!`);
    } else {
      toast.success('Collaborative event proposal submitted!');
    }
    setIsProposalModalOpen(false);
    setSelectedPartners([]);
    setPartnerCenterName('');
  };

  const handleApprove = (collabId: string) => {
    toast.success('Collaboration approved!');
  };

  const handleReject = (collabId: string) => {
    toast.error('Collaboration declined');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl mb-1">
            {isUpperAdmin ? 'Center Collaborations' : 'Club Collaborations'}
          </h2>
          <p className="text-muted-foreground">
            {isUpperAdmin 
              ? 'Manage MCC collaborations with other campus centers'
              : 'Coordinate and manage multi-club events'}
          </p>
        </div>
        <Button onClick={() => setIsProposalModalOpen(true)} className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Propose {isUpperAdmin ? 'Collaboration' : 'Event'}
        </Button>
      </div>

      {/* Collaboration Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{relevantCollabs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{relevantCollabs.filter(e => e.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active {isUpperAdmin ? 'Centers' : 'Partnerships'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {isUpperAdmin 
                ? new Set(relevantCollabs.map(e => e.partnerCenter).filter(Boolean)).size
                : new Set(relevantCollabs.flatMap(e => e.partnerClubs)).size
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique collaborations</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Proposals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Proposals</CardTitle>
          <CardDescription>
            {isUpperAdmin ? 'Center collaboration requests' : 'Events awaiting partner approval'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relevantCollabs.filter(e => e.status === 'pending').map(event => {
              if (isUpperAdmin) {
                // Center collaboration view
                return (
                  <div key={event.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="bg-accent/20 text-accent-foreground rounded-lg p-2 mt-1">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{event.title}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getStatusVariant(event.status)} className="capitalize">
                                {getStatusIcon(event.status)}
                                <span className="ml-1">{event.status}</span>
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(event.proposedDate, 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge style={{ backgroundColor: '#154734', color: 'white' }}>
                                MCC (Proposing)
                              </Badge>
                              {event.partnerCenter && (
                                <Badge variant="outline" style={{ borderColor: '#154734', color: '#154734' }}>
                                  {event.partnerCenter}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:flex-col">
                        <Button size="sm" className="bg-primary" onClick={() => handleApprove(event.id)}>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(event.id)}>
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Club collaboration view
                const proposingClub = clubs.find(c => c.id === event.proposedBy);
                const partnerClubs = event.partnerClubs.map(id => clubs.find(c => c.id === id)).filter(Boolean);
                const isProposer = event.proposedBy === currentUser?.clubId;
                
                return (
                  <div key={event.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="bg-accent/20 text-accent-foreground rounded-lg p-2 mt-1">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{event.title}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getStatusVariant(event.status)} className="capitalize">
                                {getStatusIcon(event.status)}
                                <span className="ml-1">{event.status}</span>
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(event.proposedDate, 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {proposingClub && (
                                <Badge style={{ backgroundColor: proposingClub.color, color: 'white' }}>
                                  {proposingClub.name} {isProposer ? '(You)' : '(Proposing)'}
                                </Badge>
                              )}
                              {partnerClubs.map(club => club && (
                                <Badge key={club.id} variant="outline" style={{ borderColor: club.color, color: club.color }}>
                                  {club.name} {club.id === currentUser?.clubId ? '(You)' : ''}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {!isProposer && (
                        <div className="flex gap-2 sm:flex-col">
                          <Button size="sm" className="bg-primary" onClick={() => handleApprove(event.id)}>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(event.id)}>
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
            {relevantCollabs.filter(e => e.status === 'pending').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pending proposals at the moment
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved Events */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isUpperAdmin ? 'Active Center Collaborations' : 'Upcoming Collaborative Events'}
          </CardTitle>
          <CardDescription>
            {isUpperAdmin ? 'Approved center partnerships' : 'Approved multi-club events'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relevantCollabs.filter(e => e.status === 'approved').map(event => {
              if (isUpperAdmin) {
                return (
                  <div 
                    key={event.id} 
                    className={`border border-border rounded-lg p-4 ${
                      event.eventId ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''
                    }`}
                    onClick={() => event.eventId && navigate(`/event/${event.eventId}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary rounded-lg p-2 mt-1">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.eventId && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {format(event.proposedDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge style={{ backgroundColor: '#154734', color: 'white' }}>
                            MCC
                          </Badge>
                          {event.partnerCenter && (
                            <Badge style={{ backgroundColor: '#154734', color: 'white' }}>
                              {event.partnerCenter}
                            </Badge>
                          )}
                        </div>
                        {event.eventId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Click to view event details
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                const proposingClub = clubs.find(c => c.id === event.proposedBy);
                const partnerClubs = event.partnerClubs.map(id => clubs.find(c => c.id === id)).filter(Boolean);
                
                return (
                  <div 
                    key={event.id} 
                    className={`border border-border rounded-lg p-4 ${
                      event.eventId ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''
                    }`}
                    onClick={() => event.eventId && navigate(`/event/${event.eventId}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 text-primary rounded-lg p-2 mt-1">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.eventId && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {format(event.proposedDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[proposingClub, ...partnerClubs].filter(Boolean).map(club => club && (
                            <Badge key={club.id} style={{ backgroundColor: club.color, color: 'white' }}>
                              {club.name}
                            </Badge>
                          ))}
                        </div>
                        {event.eventId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Click to view event details
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            {relevantCollabs.filter(e => e.status === 'approved').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No approved collaborations yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Propose Event Modal */}
      <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isUpperAdmin ? 'Propose Center Collaboration' : 'Propose Collaborative Event'}
            </DialogTitle>
            <DialogDescription>
              {isUpperAdmin 
                ? 'Create a new collaboration proposal with another campus center'
                : 'Create a new event proposal and invite partner organizations'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProposal} className="space-y-4">
            <div>
              <Label htmlFor="event-title">
                {isUpperAdmin ? 'Collaboration Title' : 'Event Title'}
              </Label>
              <Input 
                id="event-title" 
                name="title" 
                placeholder={isUpperAdmin ? 'e.g., Cross-Center Leadership Summit' : 'e.g., Multicultural Food Festival'} 
                required 
              />
            </div>
            <div>
              <Label htmlFor="event-description">Description</Label>
              <Textarea 
                id="event-description" 
                name="description" 
                placeholder={isUpperAdmin ? 'Describe the center collaboration...' : 'Describe the collaborative event...'}
                rows={4}
                required 
              />
            </div>
            <div>
              <Label htmlFor="event-date">Proposed Date</Label>
              <Input id="event-date" name="date" type="date" required />
            </div>
            {isUpperAdmin ? (
              <div>
                <Label htmlFor="partner-center">Partner Center</Label>
                <Input 
                  id="partner-center" 
                  value={partnerCenterName}
                  onChange={(e) => setPartnerCenterName(e.target.value)}
                  placeholder="e.g., Women's Center, LGBTQ+ Center" 
                  required 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the name of the campus center you'd like to collaborate with
                </p>
              </div>
            ) : (
              <div>
                <Label>Partner Organizations</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select clubs you'd like to collaborate with
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {clubs.filter(c => c.id !== currentUser?.clubId).map(club => (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => togglePartner(club.id)}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${selectedPartners.includes(club.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: club.color }}
                      />
                      <span className="font-medium">{club.name}</span>
                      {selectedPartners.includes(club.id) && (
                        <Check className="h-4 w-4 ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProposalModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary" 
                disabled={!isUpperAdmin && selectedPartners.length === 0}
              >
                Submit Proposal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}