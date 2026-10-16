-- Durable outbound-email queue. Delivery is only recorded after the provider
-- accepts an idempotent send request; retries are bounded inside Resend's
-- 24-hour idempotency window.
CREATE TYPE "EmailDeliveryKind" AS ENUM (
  'POSTING_LETTER',
  'EARLY_WARNING',
  'EARLY_WARNING_ESCALATION'
);

CREATE TYPE "EmailDeliveryStatus" AS ENUM (
  'PENDING',
  'SENDING',
  'RETRY_SCHEDULED',
  'SENT',
  'FAILED'
);

CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  allocation_id uuid REFERENCES public.placement_allocations(id) ON DELETE CASCADE,
  alert_id uuid REFERENCES public.early_warning_alerts(id) ON DELETE CASCADE,
  kind "EmailDeliveryKind" NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  status "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  provider_message_id text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_deliveries_one_subject CHECK (num_nonnulls(allocation_id, alert_id) = 1),
  CONSTRAINT email_deliveries_allocation_recipient_key UNIQUE (kind, allocation_id, recipient),
  CONSTRAINT email_deliveries_alert_recipient_key UNIQUE (kind, alert_id, recipient)
);

CREATE INDEX email_deliveries_pending_idx
  ON public.email_deliveries (status, next_attempt_at);

CREATE INDEX email_deliveries_tenant_created_idx
  ON public.email_deliveries (tenant_id, created_at DESC);

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_deliveries FROM anon, authenticated;
