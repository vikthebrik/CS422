export interface CollaboratorInfo {
  club_id: string;
  club_name: string;
  club_logo?: string | null;
}

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
  requiresRsvp?: boolean;
  rsvpLink?: string | null;
  rsvpNote?: string | null;
  collaborators?: CollaboratorInfo[];
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
  /** Login/contact email for the club admin account */
  adminEmail?: string;
  /** Custom section names for department orgs (exec/board/intern tiers) */
  sectionLabels?: { exec?: string; board?: string; intern?: string };
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

// ---------------------------------------------------------------------------
// About-page block types
// ---------------------------------------------------------------------------

export interface TextBlock {
  id: string;
  type: 'text';
  title?: string;
  content: string;
}

export interface MediaBlock {
  id: string;
  type: 'media';
  mediaType: 'image' | 'video';
  url: string;
  caption?: string;
}

export interface LinkItem {
  label: string;
  url: string;
  description?: string;
}

export interface LinkContainerBlock {
  id: string;
  type: 'links';
  title?: string;
  links: LinkItem[];
}

export interface ClubShowcaseBlock {
  id: string;
  type: 'clubs';
  title?: string;
  clubIds: string[];
}

export type Block = TextBlock | MediaBlock | LinkContainerBlock | ClubShowcaseBlock;