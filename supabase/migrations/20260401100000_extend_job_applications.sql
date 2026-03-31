-- Add missing columns to job_applications for external/mock job support
DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS external_job_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_email TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_phone TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS resume_url TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS external_job_title TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS external_company_name TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Make job_id nullable so we can store external-only applications
ALTER TABLE public.job_applications ALTER COLUMN job_id DROP NOT NULL;

-- Index for external job lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_external_id ON public.job_applications(external_job_id) WHERE external_job_id IS NOT NULL;

-- Allow unique constraint on user + external_job_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_user_external ON public.job_applications(user_id, external_job_id) WHERE external_job_id IS NOT NULL;
