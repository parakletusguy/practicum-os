-- The Auth user ID is linked only after the user presents a verified Supabase
-- session and their existing institution email matches an unlinked Person.
ALTER TABLE public.persons ADD COLUMN auth_user_id UUID;

CREATE UNIQUE INDEX persons_auth_user_id_key
  ON public.persons (auth_user_id);
