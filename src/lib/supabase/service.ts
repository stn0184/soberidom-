import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

// service_role — ТОЛЬКО в серверном коде (SPEC 5.8): промокоды, письма, admin-операции.
export function createServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
