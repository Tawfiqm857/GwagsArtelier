# GEM Rebrand + Transparency & Governance Platform + Marketplace

This plan bundles the approved GEM rebrand/install-as-app work with three new civic modules and a marketplace. All existing social features (posts, friends, groups, messages, notifications, profiles) stay untouched.

## Phase 1 — Finish GEM rebrand & install-as-app

Complete the work already started so the app builds and previews cleanly.

- Fix the `resetPassword` build error in `src/hooks/useAuth.tsx`.
- Apply the green/blue/gold colour system across the app.
- Replace old name references with "GEM" in Navigation, Hero, Features, Auth, ResetPassword, index.html, and README.
- Use the uploaded GEM crest as the navigation logo and favicon.
- Add the web app manifest and install button so GEM can be added to home screens.

## Phase 2 — Roles system

Add a roles layer without breaking existing auth.

- Create `public.app_role` enum: `resident`, `verified_trader`, `volunteer`, `moderator`, `admin`.
- Create `public.user_roles` table (`id`, `user_id`, `role`, unique on `(user_id, role)`).
- Create `public.has_role(_user_id uuid, _role app_role)` security-definer helper.
- Grant `SELECT` to authenticated, `ALL` to service_role.
- Enable RLS and add policies so users can read their own roles; only admins can assign roles.
- Seed the current signed-in user as `admin` so the new admin pages are reachable immediately.

## Phase 3 — Dual-Entity Project Transparency Engine

Track public projects, milestones, and resident-submitted site photos.

### Database
- `public.projects`: title, description, ward (`Gwagwalada Center`, `Paiko`, `Ibwa`, `Zuba`, `Kutunku`), entity_badge (`GEM Grassroots`, `Area Council Municipal`, `Joint Initiative`), status (`Planning`, `In Progress`, `Completed`), budget_approved, budget_spent, contractor_name, contractor_contact, start_date, target_completion_date.
- `public.project_milestones`: project_id, title, description, target_date, completed_at.
- `public.project_photos`: project_id, uploaded_by, photo_url, caption, submitted_at, verified (default false).
- Storage bucket `project-photos` (public).

### Access
- Everyone can read projects, milestones, and photos.
- Authenticated users can submit photos.
- Only admin/moderator can create/edit projects and milestones, and mark photos verified.

### UI
- `/projects`: filterable grid by ward, status, and entity badge; cards show badge, ward, animated progress bar, and status.
- `/projects/:id`: budget allocation chart, contractor info, milestone timeline, photo gallery, and a photo-upload modal for residents.

## Phase 4 — Revenue Synchronization & Public Transparency Hub

Show where public money comes from and where it goes.

### Database
- `public.revenue_logs`: ward, amount, source, linked_project_id (nullable), recorded_at, notes.
- `public.transparency_documents`: title, document_type (`Financial Summary`, `Balance Sheet`, `Audit Report`, `Press Release`, `Governance Guideline`), file_url, published_at.
- Storage bucket `transparency-docs` (public).

### Access
- Public read on revenue_logs and documents.
- Only admin (or a service-role edge function) can write revenue_logs.
- Only admin can upload/publish documents.

### UI
- `/transparency`: live impact counters (total revenue digitized, volunteer count, ward coverage %, completed projects), pulled from aggregate queries.
- Interactive "tax-to-project" visualizer linking revenue entries to projects.
- Downloadable document list.

### Edge function
- `revenue-webhook`: POST endpoint that validates a shared secret, parses incoming revenue payload, and inserts into `revenue_logs`. Secret stored in Supabase secrets.

## Phase 5 — Governance Showcase & Community Services Portal

Introduce leadership, service requests, and volunteer onboarding.

### Database
- `public.leadership`: name, role_title, photo_url, bio, display_order.
- `public.service_requests`: requester_id (nullable), request_type (`Resident Assistance`, `Volunteer Onboarding`, `Grievance Report`), ward, description, contact_info (nullable), is_anonymous, status (`Submitted`, `In Review`, `Resolved`), submitted_at.
- Storage bucket `leadership-photos` (public).

### Access
- Public read on leadership.
- Users can insert their own service_requests.
- Anonymous submissions allowed via an `anon` insert policy that omits requester_id and rejects identifying info when `is_anonymous` is true.
- Only admin/moderator can read and update all service requests.

### UI
- `/governance`: mission statement, leadership hierarchy grid, downloadable governance documents.
- `/services`: three forms — Resident Assistance, Volunteer Onboarding, Anonymous Grievance/Extortion report.
- `/admin/services`: admin view to review and update request status.

## Phase 6 — Marketplace

A simple buy/sell board for goods and services.

### Database
- `public.marketplace_listings`: seller_id, title, description, price, currency (`NGN`), category, image_urls, contact_method (`WhatsApp`, `In-app message`), contact_value, status (`Active`, `Sold`, `Archived`), created_at.
- Storage bucket `marketplace-images` (public).

### Access
- Public read on active listings.
- Authenticated users can create/update/delete their own listings.
- Admin/moderator can moderate (update status).

### UI
- `/marketplace`: grid of active listings with category filter and search.
- `/marketplace/new`: create listing form with image upload.
- `/marketplace/:id`: listing detail with seller contact action.

## Phase 7 — Navigation & routing

- Add top-level routes: `/projects`, `/transparency`, `/governance`, `/services`, `/marketplace`.
- Add them to the main navigation.
- Keep Feed, Posts, Friends, Groups, Messages, Profile, and Auth exactly as they are.

## Phase 8 — Polish

- Shimmer loading skeletons for all new list/grid views.
- Empty-state graphics for lists with no data.
- Responsive layouts for mobile and desktop.
- Final build check and preview verification.

## What is NOT changing

- Existing social features: auth, profiles, posts, likes, comments, follows, groups, messages, notifications.
- Existing Supabase tables and RLS policies for those features.

## Implementation order

1. Finish rebrand & install-as-app.
2. Roles system.
3. Project Transparency Engine.
4. Revenue Hub.
5. Governance & Services Portal.
6. Marketplace.
7. Navigation polish and final verification.

This is a large build. Approval here means we proceed through the phases in order, surfacing any decisions needed along the way.
