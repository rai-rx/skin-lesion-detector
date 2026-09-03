-- Keep clinical images and reports private. Access is granted through signed URLs.
UPDATE storage.buckets
SET public = false
WHERE id IN ('scan-images', 'pdf-reports');

DROP POLICY IF EXISTS "Anyone can view scan-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pdf-reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pdfs" ON storage.objects;

CREATE POLICY "Users can upload own scan files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Users can read own scan files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'scan-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Users can upload own reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pdf-reports' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Users can read own reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pdf-reports' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));