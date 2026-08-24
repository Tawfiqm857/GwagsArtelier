# Add "Install as App" / Home-Screen Support

## Goal
Make GwagsArtelier installable on phones and desktops as a standalone app icon, without adding offline caching or service workers.

## Why manifest-only
The request is for installability ("Add to Home Screen" / app icon). Offline support is a separate concern and is not requested. A web app manifest is the standard, lightweight way to enable install prompts and standalone launch behavior.

## Plan

### 1. Generate app icons
Create square PNG icons that match the GwagsArtelier red/black/white brand and place them in `public/`:
- `public/icon-192x192.png` (192x192, opaque background)
- `public/icon-512x512.png` (512x512, opaque background)
- `public/apple-touch-icon.png` (180x180, opaque background)

The existing `public/favicon.ico` will be kept.

### 2. Create web app manifest
Add `public/manifest.webmanifest` containing:
- `name`: "GwagsArtelier"
- `short_name`: "GwagsArtelier"
- `description`: A concise app description
- `start_url`: "/"
- `display`: "standalone"
- `background_color`: brand-appropriate dark/red value
- `theme_color`: brand-appropriate red value
- `icons`: references to the 192x192 and 512x512 PNGs with `purpose: "any"`

### 3. Update `index.html` head tags
Add the following inside `<head>`:
- `<link rel="manifest" href="/manifest.webmanifest" />`
- `<meta name="theme-color" content="#..." />` matching the manifest
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
- Ensure the existing favicon link is present and correct

### 4. Verify in preview
Open the app preview, confirm in DevTools Application > Manifest that the manifest is parsed, icons load, and no errors appear.

## What is NOT included
- No service worker
- No offline caching
- No `vite-plugin-pwa` or `workbox` additions
- No push notifications

These can be planned separately if requested later.

## Files to change/create
- Create `public/manifest.webmanifest`
- Create `public/icon-192x192.png`
- Create `public/icon-512x512.png`
- Create `public/apple-touch-icon.png`
- Update `index.html`
