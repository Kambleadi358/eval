
-- Fix storage RLS: allow anon to upload/read/delete from competition-entries
CREATE POLICY "Allow public upload to competition-entries"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'competition-entries');

CREATE POLICY "Allow public update in competition-entries"
ON storage.objects FOR UPDATE
USING (bucket_id = 'competition-entries');

CREATE POLICY "Allow public read from competition-entries"
ON storage.objects FOR SELECT
USING (bucket_id = 'competition-entries');

CREATE POLICY "Allow public delete from competition-entries"
ON storage.objects FOR DELETE
USING (bucket_id = 'competition-entries');
