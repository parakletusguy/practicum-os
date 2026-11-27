CREATE TYPE public."StudentIntakeStatus" AS ENUM ('PENDING', 'ENROLLED', 'DISMISSED');

CREATE TABLE public.student_intake_responses (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  submitted_at timestamptz(6) NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  matric_number text NOT NULL,
  level text CHECK (level IN ('100L', '200L', '300L', '400L')),
  status public."StudentIntakeStatus" NOT NULL DEFAULT 'PENDING',
  reviewed_at timestamptz(6),
  CONSTRAINT student_intake_responses_tenant_id_source_id_key UNIQUE (tenant_id, source_id)
);

CREATE INDEX student_intake_responses_tenant_id_status_submitted_at_id_idx
  ON public.student_intake_responses (tenant_id, status, submitted_at, id);

ALTER TABLE public.student_intake_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_intake_responses FROM PUBLIC, anon, authenticated;
