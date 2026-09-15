# Citizen Verification, Admin Console, Push Notifications, Trader Shops & Search

All approved features, built in order. Existing social and civic features stay untouched.

## Phase 1 — Citizen verification reports (photo/video, optional anonymity)

Residents visit a project site and submit proof of what they actually see, with a verdict on whether the claim matches reality. Reports can be sent anonymously.

On each project page, a "Verify this project" button opens a form:

- Verdict: **Looks complete**, **Still ongoing**, **Not started / abandoned**, or **Something looks wrong**.
- Photo or short video capture (camera opens directly on phones), plus optional written note.
- "Submit anonymously" toggle — when on, the report shows no name anywhere, including to admins.
- Optional location capture so reports can be tied to the site.

Reports appear on the project page in a "Community verification" section: verdict tally (e.g. 7 of 9 residents say still ongoing), media gallery, and each report's note. Anonymous ones show as "Anonymous resident".

Moderators can mark reports verified or flag them as spam; flagged reports are hidden from public view.

Database work:
- Extend the existing site-photo table into a verification report record: allow no author for anonymous submissions, add verdict, media type (photo/video), anonymity flag, optional coordinates, and a flagged state.
- Access rules: anyone can read non-flagged reports; signed-in residents can submit; anonymous submissions accepted without linking an identity; only moderators/admins can flag or verify.
- Storage: allow short video files in the existing private project media bucket, with a size cap; media served through the existing secure signed-link flow.

Note: truly anonymous submissions cannot be tied back to an account by design — that also means they can't be moderated per author, only per report.

## Phase 2 — Admin Console (`/admin`)

A single admin-only area (visible only to admins/moderators) so content is managed inside the app instead of direct database edits.

Tabs:

- **Projects** — create/edit projects, add/complete milestones. Reuse the existing Projects form fields (ward, entity badge, status, budgets, contractor, dates).
- **Revenue** — record revenue entries manually (ward, amount, source, optional linked project, notes) alongside the existing webhook.
- **Documents** — upload PDFs to the private transparency-docs bucket via secure signed-URL flow and publish them to the Transparency page.
- **Leadership** — add/edit leaders with portrait upload (leadership-photos bucket), bio, and display order.
- **Roles** — search members by email/name and grant or remove resident, verified trader, volunteer, and moderator roles. Admin role can only be granted by an existing admin.
- **Service requests** — link to the existing review screen so everything lives in one place.

Database change: add admin/moderator write policies on `projects`, `project_milestones`, `revenue_logs`, `transparency_documents`, `leadership`, and admin write on `user_roles` (these tables currently have no insert/update policies, so the console would otherwise be blocked).

## Phase 3 — Push notifications

Real phone-style notifications for messages, likes, comments, follows, and mentions even when the app is closed.

- New `push_subscriptions` table (user, endpoint, keys) — users store their own subscription; app asks permission from a bell/banner once.
- `send-push` edge function: validates the request, looks up the recipient's subscriptions, and delivers via web push. Triggered automatically whenever a new notification row is created.
- VAPID keys generated and stored as backend secrets (no user action needed).
- Notification clicks deep-link to the relevant page (chat, post, profile).

## Phase 4 — Trader shops

Every member with the verified-trader role (or who has active listings) gets a storefront.

- Shop view at `/shop/:userId`: seller header (name, bio, verified badge), grid of their active listings, "Contact on WhatsApp" per item.
- Profile page gains a "View Shop" button for sellers; marketplace cards link to the seller's shop.
- Admin console's Roles tab is how traders get verified. Add an optional `shop_name` field on profiles so shops can carry a brand name.

## Phase 5 — Search & discovery

- Search page (`/search`) with a bar in the navigation: tabs for **People**, **Posts**, **Projects**, and **Market**.
- Searches names, usernames, bios, post text, project titles/descriptions, and listing titles/categories.
- Tapping a result goes straight to the profile, post, project, or listing.

## Phase 6 — Polish & verification

- Shimmer skeletons and empty states for all new views; mobile-first layout consistent with the bottom nav.
- Full build check, admin and non-admin flow verification in the preview, and security linter re-run.
- Roadmap updated; remaining open item (the admin account password) stays as is until you provide a stronger password.

## Technical notes

- New tables follow the standard pattern: explicit grants, RLS enabled, policies scoped to owners/admins via the `private.has_role` helper.
- Admin console guards routes with `useRole().isAdmin`; the UI hides write controls for everyone else.
- Push uses standard Web Push (service worker + VAPID); no third-party push service needed.
- Search uses simple case-insensitive matching on existing public-read tables — no new tables required.
