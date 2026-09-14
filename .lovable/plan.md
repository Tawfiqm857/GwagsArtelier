# Fix private photo loading + set the admin password

Two pieces of work: make the photos in Projects, Governance and Marketplace actually appear, and change the password on the existing admin account.

## 1. Photos currently don't show

Project site photos, leadership portraits and marketplace images are stored privately, but the pages try to read them as if they were public links, so they come back blank or broken.

Fix: switch those three areas to short-lived secure links generated on demand.

- Projects detail page: resident-submitted site photos
- Governance page: leadership portraits
- Marketplace: listing images (grid and detail)

Upload flows stay exactly as they are — only how images are read changes. A small shared helper will generate the secure links and cache them briefly so lists don't re-request the same image repeatedly. Broken or missing files fall back to a neutral placeholder instead of a broken icon.

## 2. Admin account password

`tawfiqm857@gmail.com` stays the admin account, with its password changed to `AdminUser`.

Note: the account currently has leaked-password protection turned on, which rejects common passwords. `AdminUser` is short and simple, so it may be refused. If it is, I'll report back rather than silently weaken the security setting — you can then either pick a stronger password or tell me to turn that protection off.

## Technical notes

- Add `src/lib/storage.ts` with `getSignedUrl(bucket, path)` / `getSignedUrls(bucket, paths[])` using `supabase.storage.from(bucket).createSignedUrl(...)` (1 hour expiry) plus an in-memory cache keyed by `bucket/path`.
- Replace `getPublicUrl` calls in `ProjectDetail.tsx`, `Governance.tsx` and `Marketplace.tsx` with the signed-URL helper resolved in an effect into local state.
- Stored values are full public URLs in some rows; the helper will strip any `/storage/v1/object/public/<bucket>/` prefix to recover the object path.
- Password change runs through an admin-privileged update against the auth user; HIBP rejection will surface as an error.
