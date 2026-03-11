# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-11

### Added
- Full-stack production app: Express backend + Vite/React frontend
- ICS feed sync from Outlook calendar sources (cron every 14 min)
- Custom ICS subscription link generator with per-club/type filters
- JWT-based auth with root admin and club_admin roles
- Club management: CRUD event types, approve account requests, force-set passwords
- Event editing with `manually_edited` flag to freeze ICS sync on edited events
- Collaboration tracking: pending / accepted / declined states from Outlook attendees
- RSVP fields on events: toggle, link, note
- About page CMS: block-based editor (TextBlock, MediaBlock, LinkContainerBlock, ClubShowcaseBlock)
- Our Team page with photo upload to Supabase Storage
- Password reset via Supabase PKCE + Resend email SDK
- Site settings key/value store with file upload to `mcc-public-assets` bucket
- Server status dashboard at `GET /` and `GET /status`
- org_type support: `union` | `department` badge on club pages
