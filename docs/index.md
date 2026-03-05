# MCC Calendar Hub — Documentation Index

> University of Oregon Multicultural Center event calendar platform.

## System Overview
- [[Architecture]] — full stack diagram, data flow, deployment
- [[Database]] — Supabase schema, tables, migrations
- [[API]] — all backend endpoints (public / auth / admin / internal)
- [[Auth Flow]] — login, session restore, role gates, password flows

## Frontend

### State & Data
- [[AppContext]] — global state provider (events, clubs, auth, filters)
- [[useClubs]] — fetches and maps club data from API
- [[useEvents]] — fetches and maps event data from API
- [[Types]] — shared TypeScript interfaces (Event, Club, User, Block)

### Routing
- [[Routing]] — React Router tree, route protection, role guards

### Layout Shell
- [[Layout]] — page shell (nav + sidebar + tabs + toaster)
- [[NavigationBar]] — top bar, auth buttons, sign-out
- [[FilterSidebar]] — club/type/search filters, advanced mode

### Pages
- [[Dashboard]] — main calendar view with event filtering
- [[ClubPage]] — single club detail, events, team, edit modal
- [[ClubManagement]] — root-admin org/request/event-type management
- [[ClubRoster]] — public club directory
- [[EventPage]] — event detail, edit, collaborator management
- [[Collab]] — collaboration invite inbox for club officers
- [[About]] — block-based CMS page for MCC info

### Auth Pages
- [[Auth Pages]] — login, forgot/reset password, request account, confirm email, change password

### Components
- [[CalendarGrid]] — day/week/month calendar views
- [[EventDetailModal]] — read-only event popup from dashboard
- [[OurTeam]] — club member directory with CRUD
- [[LogoUpload]] — club logo upload with client-side resize
- [[LoginDialog]] — admin/officer login modal
- [[ProtectedRoute]] — route auth guard
- [[EventReminderPopup]] — bottom-right today's events notification
- [[EmptyState]] — no-events fallback UI

## Backend

### Core
- [[Server Entry]] — Express app, middleware, all routes
- [[Cache]] — in-memory TTL cache for GET responses
- [[Auth Middleware]] — JWT validation, role extraction

### Background
- [[ICS Sync]] — cron job that polls Outlook ICS feeds
- [[Populate Supabase]] — ICS parser → Supabase upsert logic

## Features
- [[Event Filtering]] — how filter state flows from sidebar to calendar
- [[Collaboration System]] — how clubs co-host events
- [[RSVP System]] — RSVP toggles, links, notes on events
- [[About CMS]] — block-based content management for the About page
- [[ICS Subscription]] — ICS export endpoint (subscription coming soon)
- [[Org Management]] — club CRUD, join requests, approval flow
