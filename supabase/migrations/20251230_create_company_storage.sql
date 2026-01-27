-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their company folders
CREATE POLICY "Authenticated users can upload company documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-documents'
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to company documents (for logos, etc.)
CREATE POLICY "Public read access to company documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-documents');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their company documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-documents'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their company documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-documents'
  AND auth.uid() IS NOT NULL
);
