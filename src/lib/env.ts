export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until the Supabase project URL and publishable key are set in the environment. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const PRIVACY_VERSION = "draft-2026-11";
