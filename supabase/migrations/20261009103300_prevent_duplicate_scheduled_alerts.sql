-- A scheduled scan and a manual scan may overlap. Keep one open warning of
-- each scheduler-managed type per placement; resolved warnings remain part of
-- the audit history and do not block a later recurrence.
CREATE UNIQUE INDEX early_warning_alerts_open_scheduled_type_key
  ON public.early_warning_alerts (allocation_id, alert_type)
  WHERE is_resolved = false
    AND alert_type IN (
      'HOURS_BEHIND_SCHEDULE',
      'OVERDUE_LOGBOOK_ENTRY',
      'MISSED_SUPERVISION_VISIT'
    );
