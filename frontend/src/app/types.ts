export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  clubId: string;
  eventType: string;
  color?: string;
}

export interface Club {
  id: string;
  name: string;
  color: string;
  /** 'union' = student club/union  |  'department' = MCC department */
  orgType: 'union' | 'department';
  outlookLink?: string;
  logo?: string;
  description?: string;
  instagram?: string;
  linktree?: string;
  engage?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'club_officer' | 'student';
  clubId?: string;
}

export interface CollabEvent {
  id: string;
  title: string;
  partnerClubs: string[];
  status: 'pending' | 'approved' | 'rejected';
  proposedDate: Date;
  proposedBy: string;
  type?: 'club' | 'center'; // club = inter-club collaboration, center = MCC with other centers
  partnerCenter?: string; // For center-level collaborations
  eventId?: string; // Link to actual event if approved and created
}

export const EVENT_TYPES = [
  'Events',
  'Meetings',
  'Office Hours',
  'Other'
] as const;