-- Event trigger functions execute under the event trigger owner. They are not
-- application RPCs and must not be callable by public API roles.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
