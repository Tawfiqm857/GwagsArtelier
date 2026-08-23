# Rebrand to GwagsArtelier + app improvements

## 1. Rename everywhere
Replace "GwagsPortrait" with "GwagsArtelier" across the whole app:
- Browser tab title, description and social preview tags in `index.html`
- Navigation logo text
- Hero badge and copy
- Features section copy
- Auth page heading and signup toast ("Welcome to GwagsArtelier!")
- Design system comment in `index.css`, README title
- Keep the Gwagwalada, Abuja positioning in the copy

## 2. Improvements to ship in the same pass
- **Real SEO metadata**: proper title (<60 chars), description (<160), matching og/twitter tags instead of the Lovable defaults.
- **Polished 404 page**: currently hardcoded grey/blue colors that break dark mode — rebuild with theme tokens and a link back to the feed.
- **Consistent page shell**: every route gets the Navigation bar and correct top padding so content isn't hidden under the fixed nav.
- **Working hero buttons**: "Join GwagsArtelier" goes to sign up (or the feed when already signed in), "Explore Posts" scrolls to / navigates to the posts feed.
- **Loading + empty states**: skeleton placeholders while posts/friends/messages load, and friendly empty states with a clear next action.
- **Mobile polish**: tighter hero type scale, safe tap targets, and a bottom-safe layout on small screens (preview is 411px wide).

## 3. Optional next steps (say the word)
- Groups/Messages feature depth (roles, presence, read receipts)
- Push notifications (needs a service worker + provider)
- Custom logo/favicon for the new GwagsArtelier brand

## Technical notes
Frontend-only changes: text/branding edits, `index.html` head tags, `NotFound.tsx` rewrite with semantic tokens, hero CTA wiring with `react-router` navigation, and skeleton/empty-state components. No database or auth logic changes.
