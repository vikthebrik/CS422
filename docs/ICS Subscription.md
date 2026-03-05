# ICS Subscription

Tags: #feature #frontend #backend

Allows users to subscribe to a filtered calendar feed in external apps (Google Calendar, Apple Calendar, etc.).

## Status

Currently showing an "under construction / coming soon" placeholder in the UI. All functional code has been stripped from the frontend component.

## Backend Endpoint

`GET /events/ics?filters=clubId:typeId,...`

- Returns a standards-compliant `.ics` file
- `typeId` is optional per filter rule: `clubId:` (with no typeId) means all types for that club
- Multiple filters: `clubId1:typeId1,clubId2:typeId2,...`

## typeIdMap

[[AppContext]] exposes `typeIdMap: Record<string, string>` — maps event type **name → UUID**.
Was used by the now-removed `SubscriptionLinkGenerator` to build the `?filters=` query string.

## Related
- [[AppContext]] — `typeIdMap` maps type name → UUID
- [[Server Entry]] — GET /events/ics implementation
- [[API]] — endpoint reference
