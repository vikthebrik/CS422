# About

Tags: #frontend #page #cms

**File:** `frontend/src/app/pages/About.tsx`
**Route:** `/about`

Block-based CMS page for MCC information. See [[About CMS]] for the full feature overview.

## Block Types

| Block type | Rendered as |
|------------|-------------|
| `text`     | Title + rich text paragraph |
| `media`    | Image or video with optional caption |
| `links`    | Titled grid of labeled link cards |
| `clubs`    | Club showcase — logo + name cards |

## Data Storage

Blocks stored as JSON array in `site_settings` table, key = `about-page`.

| Operation | Endpoint |
|-----------|----------|
| Fetch     | GET /site-settings/about-page |
| Save      | PUT /site-settings/about-page |
| Upload media | POST /site-settings/upload (base64 → Supabase Storage `mcc-public-assets`) |

## Admin Editing (root admin only)

A gear icon appears when `currentUser.role === 'admin'`. Capabilities:
- Edit text/title inline
- Reorder blocks up/down
- Delete blocks
- Add new blocks (text / media / links / clubs)
- Upload media to Supabase Storage
- Add/remove clubs in ClubShowcaseBlock

## Reads from [[AppContext]]
`currentUser`, `authToken`, `clubs`

## Related
- [[About CMS]] — feature design doc
- [[AppContext]] — auth state + club list for showcase block
- [[Types]] — Block, TextBlock, MediaBlock, LinkContainerBlock, ClubShowcaseBlock interfaces
- [[Server Entry]] — site-settings routes
