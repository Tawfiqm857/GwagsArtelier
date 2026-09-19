CREATE TYPE public.verification_verdict AS ENUM ('Looks complete', 'Still ongoing', 'Not started / abandoned', 'Something looks wrong');
CREATE TYPE public.verification_media_type AS ENUM ('photo', 'video');

ALTER TABLE public.project_photos
  ALTER COLUMN uploaded_by DROP NOT NULL,
  ADD COLUMN verdict public.verification_verdict,
  ADD COLUMN media_type public.verification_media_type NOT NULL DEFAULT 'photo',
  ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN flagged boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Project photos are publicly readable" ON public.project_photos;
CREATE POLICY "Unflagged reports are publicly readable"
  ON public.project_photos FOR SELECT
  TO anon, authenticated
  USING (flagged = false);

DROP POLICY IF EXISTS "Authenticated users can submit project photos" ON public.project_photos;
CREATE POLICY "Users can submit reports, optionally anonymously"
  ON public.project_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_anonymous = false AND uploaded_by = auth.uid())
    OR (is_anonymous = true AND uploaded_by IS NULL)
  );

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));