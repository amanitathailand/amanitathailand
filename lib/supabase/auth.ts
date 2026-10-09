import { createClientServer } from '@/lib/supabase/server';

/**
 * Returns the authenticated Supabase user, if the request carries a valid session.
 * API routes use this helper instead of trusting client-only sessionStorage flags.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClientServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  return {
    supabase,
    user: error ? null : user,
  };
}
