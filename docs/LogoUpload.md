# LogoUpload

Tags: #frontend #component

**File:** `frontend/src/app/components/LogoUpload.tsx`

Shared logo upload component used in [[ClubPage]], [[ClubManagement]].

## Behavior

- User selects an image file → converted to base64 data URL client-side
- Calls `POST /clubs/:id/logo { dataUrl, filename }` with Bearer token
- Backend uploads to Supabase Storage bucket `club-logos` (auto-created if absent)
- Backend updates `logo_url` on the club row
- On success: calls `updateClub()` in [[AppContext]] with new logo URL

## API

| Action | Endpoint |
|--------|----------|
| Upload logo | POST /clubs/:id/logo (requireAuth) |

Permission scoping:
- Root admin → any club
- club_admin → own club only

## Props

| Prop | Type | Description |
|------|------|-------------|
| `clubId` | `string` | Club UUID |
| `authToken` | `string \| null` | Bearer token |
| `onUploaded` | `(url: string) => void` | Called after successful upload |

## Related
- [[ClubPage]] — primary usage
- [[ClubManagement]] — also used in club list rows
- [[AppContext]] — `updateClub()` mutation
- [[Server Entry]] — POST /clubs/:id/logo route
