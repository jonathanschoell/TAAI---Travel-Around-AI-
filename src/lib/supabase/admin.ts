import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/env";

/**
 * Service client that bypasses row level security. Server only.
 * Use it solely after an explicit authorization check (admin area, account deletion).
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secret) return null;
  return createClient(supabaseUrl, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
