# GwagsArtelier: password reset, session landing, profile polish, and a Pro Shop roadmap

With about 5 credits left, the plan is split: Phase 1 is a single focused build that fits the budget, Phase 2 is the Shop blueprint to build later.

## Phase 1 — build now (fits ~2-3 credits)

### 1. Forgot password
- "Forgot password?" link on the Sign In tab opens a small form that sends a reset email.
- New public `/reset-password` page: detects the recovery link, asks for a new password twice, saves it, then sends the user to the feed.
- Clear success/error toasts on both steps.

### 2. Stay signed in + land on Posts
- "Remember me" checkbox on the Sign In tab.
  - Checked (default): session persists, so relaunching the app keeps the user signed in.
  - Unchecked: session is cleared when the browser tab/app closes.
- When a signed-in user opens the app, `/` shows the Posts feed instead of the marketing hero. Visitors who are not signed in still get the hero landing page.
- After sign in or sign up, redirect straight to Posts.

### 3. Improved profile page
- Cover banner with the avatar overlapping it, cleaner two-column layout on desktop.
- Stat row (posts, followers, following) as tappable cards; tapping followers/following opens a list.
- Tabs: Posts / Media (image-only grid) / Likes.
- Editing gets username, display name, bio with a character counter, plus location and website fields.
- Own posts get a delete action; empty states invite a first post.
- Mobile-first spacing so it reads well at 411px wide.

### 4. Rename to GwagsArtelier
Every visible "GwagsPortrait" becomes "GwagsArtelier" — nav logo, hero, features copy, auth screen, toasts, page title and social preview tags.

## Phase 2 — Pro version with shops (separate build, plan only)

Concept: a Pro member can open a storefront on GwagsArtelier and sell goods or services to the Gwagwalada community.

Structure:
- **Shops**: name, handle, logo, banner, description, category, location, WhatsApp/phone contact, verified badge.
- **Listings**: title, description, price (NGN), photos, stock or "service", availability toggle.
- **Marketplace page**: browse and search listings, filter by category and location, shop profile pages.
- **Orders/enquiries**: buyer sends an enquiry or order request; seller sees it in a Shop Dashboard and marks it accepted/fulfilled. Chat handoff uses the existing Messages feature.
- **Reviews**: buyers rate a shop after a fulfilled order.
- **Pro gating**: a `pro` plan flag per user; only Pro members can create a shop and list more than a few items. Payment collection (Paystack/Flutterwave for NGN, or Stripe) is a decision for that phase — until then Pro can be granted manually.
- **Feed integration**: listings can be shared as posts; a "Shop" tab in navigation.

This is roughly 3-4 build steps on its own (schema + shop creation, marketplace browse, orders dashboard, Pro gating/payments), so it is best started with fresh credits.

## Credits note
5 credits realistically covers Phase 1 (forgot password + remember me/landing + profile redesign + rename) with a little room for fixes. Phase 2 needs its own budget. If you would rather spend the remaining credits differently, say which of the four Phase 1 items matter most and I will trim.

## Technical notes
- Reset flow uses `resetPasswordForEmail` with `redirectTo` = `${window.location.origin}/reset-password`, plus a new route in `App.tsx`; the reset page calls `updateUser({ password })`.
- "Remember me" is implemented in `useAuth` by choosing session vs local persistence for the auth token; default stays persistent.
- Root route renders the existing Posts feed when `useAuth().user` is present, hero otherwise — no new data layer.
- Profile adds `location` and `website` columns to `profiles` (nullable, with existing RLS policies covering them).
- Phase 2 tables (`shops`, `listings`, `orders`, `shop_reviews`, plan flag) get RLS plus GRANTs when that phase starts.
