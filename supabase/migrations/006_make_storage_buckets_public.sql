-- Make existing storage buckets public as well as newly created buckets.
-- The initial migration used ON CONFLICT DO NOTHING, so it did not update
-- buckets that already existed with public = false.
UPDATE storage.buckets
SET public = true
WHERE id IN ('scan-images', 'pdf-reports');

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('scan-images', 'scan-images', true),
  ('pdf-reports', 'pdf-reports', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;