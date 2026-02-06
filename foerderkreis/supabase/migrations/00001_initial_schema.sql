-- Foerderkreis Initial Schema
-- Schule des Lebens - Volunteer hour tracking & job marketplace

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Families
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 8),
  monthly_hour_target NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  yearly_legal_minimum NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  hourly_compensation_rate NUMERIC(6,2) NOT NULL DEFAULT 30.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT, -- admin-only, for exemptions/hardship
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  skill_tags TEXT[] NOT NULL DEFAULT '{}',
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin', 'circle_lead')),
  privacy_mode BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kreise (Circles)
CREATE TABLE kreise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  color TEXT, -- hex color
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kreis Memberships
CREATE TABLE kreis_memberships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kreis_id UUID NOT NULL REFERENCES kreise(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'lead')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kreis_id)
);

-- Jobs (Volunteer tasks)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  kreis_id UUID REFERENCES kreise(id) ON DELETE SET NULL,
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estimated_hours NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'in_progress', 'completed', 'cancelled')),
  location TEXT,
  skills_needed TEXT[] NOT NULL DEFAULT '{}',
  due_date DATE,
  max_claimants INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Claims
CREATE TABLE job_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'completed', 'withdrawn')),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (job_id, user_id)
);

-- Volunteer Hours
CREATE TABLE volunteer_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  kreis_id UUID REFERENCES kreise(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT NOT NULL,
  date_performed DATE NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Outreach Log
CREATE TABLE email_outreach_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_volunteer_hours_family_id ON volunteer_hours(family_id);
CREATE INDEX idx_volunteer_hours_user_id ON volunteer_hours(user_id);
CREATE INDEX idx_volunteer_hours_date ON volunteer_hours(date_performed);
CREATE INDEX idx_volunteer_hours_family_date ON volunteer_hours(family_id, date_performed);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_kreis_id ON jobs(kreis_id);
CREATE INDEX idx_jobs_urgency ON jobs(urgency);
CREATE INDEX idx_job_claims_job_id ON job_claims(job_id);
CREATE INDEX idx_job_claims_user_id ON job_claims(user_id);
CREATE INDEX idx_kreis_memberships_kreis_id ON kreis_memberships(kreis_id);
CREATE INDEX idx_email_outreach_family_id ON email_outreach_log(family_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER kreise_updated_at BEFORE UPDATE ON kreise
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreise ENABLE ROW LEVEL SECURITY;
ALTER TABLE kreis_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outreach_log ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: get user's family_id
CREATE OR REPLACE FUNCTION user_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- FAMILIES policies
CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (id = user_family_id() OR is_admin());

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update families"
  ON families FOR UPDATE
  USING (is_admin());

-- Families: allow reading family by invite_code for joining
CREATE POLICY "Users can find family by invite code"
  ON families FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- USERS policies
CREATE POLICY "Users can view all user profiles"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid() OR is_admin());

-- KREISE policies
CREATE POLICY "Anyone authenticated can view kreise"
  ON kreise FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage kreise"
  ON kreise FOR ALL
  USING (is_admin());

-- KREIS_MEMBERSHIPS policies
CREATE POLICY "Anyone authenticated can view memberships"
  ON kreis_memberships FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join kreise"
  ON kreis_memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave kreise"
  ON kreis_memberships FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- JOBS policies
CREATE POLICY "Anyone authenticated can view jobs"
  ON jobs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND posted_by = auth.uid());

CREATE POLICY "Job poster or admin can update jobs"
  ON jobs FOR UPDATE
  USING (posted_by = auth.uid() OR is_admin());

CREATE POLICY "Job poster or admin can delete jobs"
  ON jobs FOR DELETE
  USING (posted_by = auth.uid() OR is_admin());

-- JOB_CLAIMS policies
CREATE POLICY "Anyone authenticated can view claims"
  ON job_claims FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can claim jobs"
  ON job_claims FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own claims"
  ON job_claims FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can withdraw their own claims"
  ON job_claims FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- VOLUNTEER_HOURS policies
CREATE POLICY "Users can view own family hours"
  ON volunteer_hours FOR SELECT
  USING (family_id = user_family_id() OR is_admin());

CREATE POLICY "Users can log hours for own family"
  ON volunteer_hours FOR INSERT
  WITH CHECK (user_id = auth.uid() AND family_id = user_family_id());

CREATE POLICY "Users can edit own recent hours"
  ON volunteer_hours FOR UPDATE
  USING (
    (user_id = auth.uid() AND created_at > NOW() - INTERVAL '48 hours')
    OR is_admin()
  );

CREATE POLICY "Users can delete own recent hours"
  ON volunteer_hours FOR DELETE
  USING (
    (user_id = auth.uid() AND created_at > NOW() - INTERVAL '48 hours')
    OR is_admin()
  );

-- Leaderboard: allow viewing all volunteer_hours for aggregation
CREATE POLICY "Authenticated users can view hours for leaderboard"
  ON volunteer_hours FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- EMAIL_OUTREACH_LOG policies
CREATE POLICY "Admins can view outreach log"
  ON email_outreach_log FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert outreach log"
  ON email_outreach_log FOR INSERT
  WITH CHECK (is_admin());

-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VIEW: Family hours summary (for dashboard/leaderboard)
-- ============================================

CREATE OR REPLACE VIEW family_hours_summary AS
SELECT
  f.id AS family_id,
  f.name AS family_name,
  f.monthly_hour_target,
  f.yearly_legal_minimum,
  f.is_active,
  COALESCE(SUM(vh.hours) FILTER (
    WHERE DATE_TRUNC('month', vh.date_performed) = DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS hours_this_month,
  COALESCE(SUM(vh.hours) FILTER (
    WHERE DATE_TRUNC('year', vh.date_performed) = DATE_TRUNC('year', CURRENT_DATE)
  ), 0) AS hours_this_year,
  COALESCE(SUM(vh.hours), 0) AS hours_total,
  -- Cumulative balance: target = months elapsed * monthly target
  COALESCE(SUM(vh.hours) FILTER (
    WHERE DATE_TRUNC('year', vh.date_performed) = DATE_TRUNC('year', CURRENT_DATE)
  ), 0) - (EXTRACT(MONTH FROM CURRENT_DATE) * f.monthly_hour_target) AS balance
FROM families f
LEFT JOIN volunteer_hours vh ON vh.family_id = f.id
WHERE f.is_active = TRUE
GROUP BY f.id, f.name, f.monthly_hour_target, f.yearly_legal_minimum, f.is_active;
