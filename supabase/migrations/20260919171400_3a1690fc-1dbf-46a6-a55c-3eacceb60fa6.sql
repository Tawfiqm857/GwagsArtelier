CREATE POLICY "Moderators can read all reports"
  ON public.project_photos FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'moderator'::app_role));