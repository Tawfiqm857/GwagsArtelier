# GEM Rebrand + Install as App

Two things in one pass: rename the app to GEM with your shield logo throughout, recolour it to match that logo, and add the option to install it as an app on phones and computers.

## 1. Fix the current build error (prerequisite)

The sign-in code is mid-edit from a previous session and currently stops the app from building — the "forgot password" function was declared but never finished. Completing it is the first step so everything else can be seen in the preview.

## 2. Rename to GEM

The old name appears in these places and all become "GEM":

- Top navigation bar
- Home page hero heading and welcome badge
- Features section
- Sign in / sign up page heading and welcome message
- Password reset page
- Browser tab title and sharing preview text
- Project README

Supporting copy keeps the Gwagwalada meaning, using the logo's own wording: "Gwagwalada Elite Movement — empowering youth, building legacy."

## 3. Use your logo

- Save the uploaded shield as the app's logo image.
- Top navigation shows the logo on its own, no text beside it (as chosen), sized to fit the bar cleanly on phone and desktop.
- Sign in / sign up page shows the logo above the form.
- Set the browser tab icon (favicon) from the same shield.

## 4. Recolour the app to match the logo

Replace the current red / black / white scheme with the logo's palette, applied through the app's central colour settings so every button, link, badge and card updates together:

- Deep green as the main colour
- Royal blue as the secondary colour
- Gold as the highlight / accent colour
- Clean white and near-black for page backgrounds and text

Light and dark mode both get their own tuned versions so text stays readable, and contrast is checked on buttons, badges and the feed.

## 5. Add "install as app"

So people can add GEM to their phone home screen or install it on desktop with its own icon:

- Add an app description file naming GEM, its colours and its icons.
- Add app icon images at the sizes phones and desktops need, made from the shield logo.
- Add the matching tags to the page so browsers offer the install option.

This covers installing and launching GEM as a standalone app with its own icon. It does not add offline use — the app still needs internet, as it does today.

## 6. Check the result

Open the preview and confirm: the logo shows in the navigation and on the sign-in page, the new colours read well in both light and dark mode, the tab icon updated, and the browser recognises GEM as installable with no errors.

## Technical notes

- Finish `resetPassword` in `src/hooks/useAuth.tsx` (add the function and include it in the context value) to clear the TS2741 error.
- Create a CDN asset pointer for the logo via `lovable-assets create` from `/mnt/user-uploads/GEM_logo.jpg`; import the pointer in `Navigation.tsx` and `Auth.tsx`.
- Favicon must be a real square file: `magick` the upload down to `public/favicon.png`, point `index.html` at it, remove `public/favicon.ico`.
- Rewrite the HSL token blocks in `src/index.css` (`:root` and `.dark`) plus the gradient/shadow tokens; update `tailwind.config.ts` if new named colours are added. No hardcoded colour utilities in components.
- Manifest-only PWA: `public/manifest.webmanifest` (`display: standalone`, `start_url: "/"`, theme/background colours, 192px and 512px icons), `public/icon-192x192.png`, `public/icon-512x512.png`, `public/apple-touch-icon.png`, plus `manifest`, `theme-color` and `apple-touch-icon` tags in `index.html`. No service worker, no `vite-plugin-pwa`.
- Replace the stale `index.html` metadata (title, description, `og:*` still referencing the old project) with GEM copy.
