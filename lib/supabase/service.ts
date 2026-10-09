import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role access is intentionally available only in server code.
 * Public routes should degrade safely when the key is not configured rather than
 * falling back to exposing admin_settings through the anon key.
 */
export function createServiceClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
