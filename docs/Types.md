# Types

Tags: #frontend #types

**File:** `frontend/src/app/types.ts`

Shared TypeScript interfaces used across the entire frontend.

## Core Types

### Event
```ts
Event {
  id, title, description, location
  startTime: Date       // mapped from API start_time
  endTime: Date
  clubId: string        // FK → Club.id
  eventType: string     // matches eventTypeNames in [[AppContext]]
  color?: string        // inherited from Club.color
  requiresRsvp?: boolean
  rsvpLink?: string | null
  rsvpNote?: string | null
  collaborators?: CollaboratorInfo[]
}
```
See: [[useEvents]], [[RSVP System]], [[Collaboration System]]

### Club
```ts
Club {
  id, name, color
  orgType: 'union' | 'department'
  outlookLink?          // ICS feed URL (mapped from ics_source_url)
  logo?, description?
  instagram?, linktree?, engage?
  adminEmail?
  sectionLabels?: { exec?, board?, intern? }  // used by [[OurTeam]]
}
```
See: [[useClubs]], [[Database]]

### User
```ts
User {
  id, name, email
  role: 'admin' | 'club_officer' | 'student'
  clubId?: string
}
```
See: [[Auth Flow]], [[Auth Middleware]]

### CollaboratorInfo
```ts
CollaboratorInfo { club_id, club_name, club_logo? }
```
Appears in `Event.collaborators[]`. See: [[Collaboration System]]

## About Page CMS Types
`Block = TextBlock | MediaBlock | LinkContainerBlock | ClubShowcaseBlock`

See: [[About CMS]], [[About]]

## EVENT_TYPES Constant
Fallback list `['Events', 'Meetings', 'Office Hours', 'Other']` used in [[EventPage]] edit form when live event types haven't loaded. Authoritative list lives in [[AppContext]] `eventTypeNames`.

## Related
- [[AppContext]] — uses all core types
- [[useClubs]] — produces Club[]
- [[useEvents]] — produces Event[]
- [[Database]] — DB schema backing these types
