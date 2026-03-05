# About CMS

Tags: #feature #frontend #backend

Block-based content management system powering the [[About]] page (`/about`).

## Architecture

- Content stored as JSON array (`Block[]`) in `site_settings` table, key = `about-page`
- Public read via `GET /site-settings/about-page`
- Root admin write via `PUT /site-settings/about-page`
- Media uploaded to `mcc-public-assets` Supabase Storage bucket via `POST /site-settings/upload`

## Block Types

| Type | Interface | Contents |
|------|-----------|----------|
| `text` | `TextBlock` | `title`, `content` (rich text string) |
| `media` | `MediaBlock` | `mediaType` (image/video), `url`, `caption` |
| `links` | `LinkContainerBlock` | `title`, `links[]` (label, url, description) |
| `clubs` | `ClubShowcaseBlock` | `title`, `clubIds[]` |

All block types share: `id` (generated), `type`.

## Admin Editing

Gear icon visible only to `currentUser.role === 'admin'`. Capabilities:
- Edit any block's text/title inline
- Reorder blocks (up/down)
- Delete blocks
- Add new blocks (choose type from modal)
- Upload images/videos (base64 → Supabase Storage URL)
- Manage club IDs in ClubShowcaseBlock (select from AppContext.clubs)

## Default Content

If `site_settings` has no `about-page` key, a default intro block is shown.

## Related
- [[About]] — the page that renders CMS blocks
- [[Database]] — `site_settings` table; `mcc-public-assets` bucket
- [[Server Entry]] — GET/PUT /site-settings/:key, POST /site-settings/upload
- [[Types]] — Block, TextBlock, MediaBlock, LinkContainerBlock, ClubShowcaseBlock
- [[AppContext]] — `clubs` used for ClubShowcaseBlock
