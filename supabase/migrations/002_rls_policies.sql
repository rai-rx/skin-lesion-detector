-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Users Policies
-- --------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON users FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- --------------------------------------------------------
-- Lesions Policies
-- --------------------------------------------------------
-- Users can manage their own lesions
CREATE POLICY "Users can view own lesions" 
ON lesions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesions" 
ON lesions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesions" 
ON lesions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lesions" 
ON lesions FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all lesions
CREATE POLICY "Admins can view all lesions" 
ON lesions FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- --------------------------------------------------------
-- Scans Policies
-- --------------------------------------------------------
-- Users can manage their own scans (via lesion_id)
CREATE POLICY "Users can view own scans" 
ON scans FOR SELECT 
USING (EXISTS (SELECT 1 FROM lesions WHERE lesions.id = scans.lesion_id AND lesions.user_id = auth.uid()));

CREATE POLICY "Users can insert own scans" 
ON scans FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM lesions WHERE lesions.id = scans.lesion_id AND lesions.user_id = auth.uid()));

CREATE POLICY "Users can update own scans" 
ON scans FOR UPDATE 
USING (EXISTS (SELECT 1 FROM lesions WHERE lesions.id = scans.lesion_id AND lesions.user_id = auth.uid()));

CREATE POLICY "Users can delete own scans" 
ON scans FOR DELETE 
USING (EXISTS (SELECT 1 FROM lesions WHERE lesions.id = scans.lesion_id AND lesions.user_id = auth.uid()));

-- Admins can view all scans
CREATE POLICY "Admins can view all scans" 
ON scans FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- --------------------------------------------------------
-- Corrections Policies
-- --------------------------------------------------------
-- Users can manage their own corrections
CREATE POLICY "Users can view own corrections" 
ON corrections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own corrections" 
ON corrections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can manage all corrections
CREATE POLICY "Admins can manage all corrections" 
ON corrections FOR ALL 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));


-- --------------------------------------------------------
-- Storage Setup
-- --------------------------------------------------------
-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-reports', 'pdf-reports', true) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to scan-images
CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'scan-images');

-- Allow anyone to view scan-images (since they are public urls anyway)
CREATE POLICY "Anyone can view scan-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'scan-images');

-- Allow authenticated users to upload to pdf-reports
CREATE POLICY "Authenticated users can upload pdfs" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'pdf-reports');

-- Allow anyone to view pdf-reports
CREATE POLICY "Anyone can view pdf-reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pdf-reports');
