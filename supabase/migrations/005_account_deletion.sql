-- Enable cascading deletes for account deletion
-- When auth.users record is deleted:
--   auth.users -> profiles (already CASCADE)
--   profiles -> conference_registrations (already CASCADE)
--   profiles -> bookings (already CASCADE)
--   profiles -> children (already CASCADE)
--   profiles -> merch_orders (already CASCADE)
--   profiles -> invitations (MISSING - fixed below)

-- Fix invitations.inviter_id: cascade delete when inviter's profile is deleted
ALTER TABLE public.invitations
  DROP CONSTRAINT invitations_inviter_id_fkey,
  ADD CONSTRAINT invitations_inviter_id_fkey
    FOREIGN KEY (inviter_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix invitations.invitee_id: cascade delete when invitee's profile is deleted
ALTER TABLE public.invitations
  DROP CONSTRAINT invitations_invitee_id_fkey,
  ADD CONSTRAINT invitations_invitee_id_fkey
    FOREIGN KEY (invitee_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Allow users to delete their own account via Supabase Auth
-- This RPC function lets authenticated users call auth.admin_delete_user on themselves
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account TO authenticated;
