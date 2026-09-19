DROP POLICY IF EXISTS "Anyone can view verified project photos" ON storage.objects;
CREATE POLICY "Anyone can view project media via signed links"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'project-photos');