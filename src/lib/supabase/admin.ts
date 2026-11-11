import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env";

/**
 * Service client that bypasses row level security. Server only.
 * Use it solely after an explicit authorization check (admin area, account deletion).
 */
export function createAdminClient() {
  const { url, secret } = supabaseEnv();
  if (!url || !secret) return null;
  return createClient(url.value, secret.value, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
