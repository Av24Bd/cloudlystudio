-- COPY EVERY LINE IN THIS FILE AND RUN IT IN SUPABASE SQL EDITOR --

-- 1. Create Bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Reset Policies (Prevents "already exists" errors)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- 3. Enable Allow Public Read Access (Everyone can see images)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );

-- 4. Enable Admin Upload (Only you can upload)
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'assets' );

-- 5. Enable Admin Update (Only you can change files)
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'assets' )
WITH CHECK ( bucket_id = 'assets' );

-- 6. Enable Admin Delete
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'assets' );
