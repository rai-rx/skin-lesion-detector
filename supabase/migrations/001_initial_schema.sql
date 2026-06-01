-- ENUM for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Users table (syncs with auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Lesion profiles (body location tracking)
CREATE TABLE lesions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body_location TEXT NOT NULL,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Scan results (linked to lesion profiles)
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesion_id UUID REFERENCES lesions(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  primary_diagnosis TEXT NOT NULL,
  primary_diagnosis_code TEXT,
  confidence_rate REAL NOT NULL,
  risk_level TEXT,
  secondary_findings JSONB DEFAULT '[]',
  abcde_metrics JSONB DEFAULT '{}',
  heatmap_url TEXT,
  pdf_report_url TEXT,
  user_notes TEXT,
  is_valid_upload BOOLEAN DEFAULT TRUE,
  rejection_reason TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Medical corrections (admin review queue)
CREATE TABLE corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ai_prediction TEXT NOT NULL,
  actual_diagnosis TEXT NOT NULL,
  biopsy_confirmed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  admin_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_lesions_user_id ON lesions(user_id);
CREATE INDEX idx_scans_lesion_id ON scans(lesion_id);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at);
CREATE INDEX idx_scans_primary_diagnosis_code ON scans(primary_diagnosis_code);
CREATE INDEX idx_corrections_admin_reviewed ON corrections(admin_reviewed);

-- Trigger Function: Auto-create public.users row + Make first user an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the very first user in the database
  SELECT NOT EXISTS(SELECT 1 FROM public.users) INTO is_first_user;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'user'::user_role END
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
