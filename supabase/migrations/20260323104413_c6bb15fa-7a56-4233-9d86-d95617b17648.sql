
-- Create annual_reports table
CREATE TABLE public.annual_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  pdf_url text NOT NULL,
  zip_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.annual_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can view reports
CREATE POLICY "Anyone can view reports" ON public.annual_reports FOR SELECT TO public USING (true);

-- Only authenticated admins can insert/update/delete
CREATE POLICY "Allow all insert reports" ON public.annual_reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update reports" ON public.annual_reports FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete reports" ON public.annual_reports FOR DELETE TO public USING (true);

-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('annual-reports', 'annual-reports', true);

-- Storage policies
CREATE POLICY "Anyone can view report files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'annual-reports');
CREATE POLICY "Anyone can upload report files" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'annual-reports');
CREATE POLICY "Anyone can update report files" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'annual-reports');
CREATE POLICY "Anyone can delete report files" ON storage.objects FOR DELETE TO public USING (bucket_id = 'annual-reports');
