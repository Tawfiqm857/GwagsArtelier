CREATE POLICY "Users upload own membership docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'membership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own membership docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'membership-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own membership docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'membership-docs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR private.has_role(auth.uid(), 'admin')
    OR private.has_role(auth.uid(), 'moderator')
  )
);