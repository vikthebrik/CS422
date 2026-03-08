/**
 * @file types.ts
 * @description Shared TypeScript types for the MCC Calendar Hub frontend.
 *
 * ## Type Relationships
 * ```
 * Club ──────────────┐
 *   id               │   referenced by Event.clubId
 *   color (palette)  │   color from useClubs deterministic palette
 *   orgType          │   'union' | 'department'
 *   social_links     │
 *   sectionLabels    │   used by OurTeam.tsx for section header text
 *                    │
 * Event ─────────────┤
 *   clubId ──────────┘   FK → Club.id
 *   collaborators[]      CollaboratorInfo[] — other clubs on the event
 *   eventType            string matched against eventTypeNames in AppContext
 *   requiresRsvp         drives RSVP badge / link display in EventDetailModal
 *
 * Block (About page CMS)
 *   TextBlock | MediaBlock | LinkContainerBlock | ClubShowcaseBlock
 *   stored as JSON array in site_settings table (key = "about-page")
 * ```
 */

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
  manuallyEdited?: boolean;
  collaborators?: CollaboratorInfo[];
}

export interface MeetingScheduleEntry {
  day: string;
  time: string;
  location: string;
  notes?: string;
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
  /** Public contact email stored in social_links (overrides adminEmail in display) */
  contactEmail?: string;
  /** Custom section names for department orgs (exec/board/intern tiers) */
  sectionLabels?: { exec?: string; board?: string; intern?: string };
  /** Approximate recurring meeting schedule — stored in metadata_tags.meeting_schedule */
  meetingSchedule?: MeetingScheduleEntry[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'club_officer' | 'student';
  clubId?: string;
}

/**
 * Fallback event type list used in EventPage edit form when live event types
 * haven't loaded from `/event-types` yet. The authoritative list lives in
 * `AppContext.eventTypeNames` (fetched at runtime).
 */
export const EVENT_TYPES = [
  'Events',
  'Meetings',
  'Office Hours',
  'Other'
] as const;

// ---------------------------------------------------------------------------
// About-page block types (CMS stored in site_settings table)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// About-page block types (CMS stored in site_settings table)
// ---------------------------------------------------------------------------

export interface BlockStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  padding?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  useCard?: boolean;
}

export interface BaseBlock {
  id: string;
  style?: BlockStyle;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  title?: string;
  content: string;
  contentType?: 'plain' | 'markdown';
}

export interface MediaBlock extends BaseBlock {
  type: 'media';
  mediaType: 'image' | 'video';
  url: string;
  caption?: string;
  layout?: 'full' | 'inline-left' | 'inline-right';
}

export interface LinkItem {
  label: string;
  url: string;
  description?: string;
}

export interface LinkContainerBlock extends BaseBlock {
  type: 'links';
  title?: string;
  links: LinkItem[];
}

export interface ClubShowcaseBlock extends BaseBlock {
  type: 'clubs';
  title?: string;
  clubIds: string[];
}

export type Block = TextBlock | MediaBlock | LinkContainerBlock | ClubShowcaseBlock;
