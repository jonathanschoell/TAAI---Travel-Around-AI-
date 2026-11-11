/**
 * Supabase settings are read at request time and under several common names, so the
 * site works whether the values were typed in by hand or added by an integration.
 */
const URL_NAMES = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"];
const KEY_NAMES = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
];
const SECRET_NAMES = ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

export type Found = { name: string; value: string } | null;

function read(names: string[]): Found {
  for (const name of names) {
    // Dynamic lookup on purpose: the value is taken from the running server, not baked into the build.
    const raw = process.env[name];
    const value = raw?.trim().replace(/^["']|["']$/g, "").trim();
    if (value) return { name, value };
  }
  return null;
}

export function supabaseEnv() {
  const url = read(URL_NAMES);
  const key = read(KEY_NAMES);
  const secret = read(SECRET_NAMES);
  return {
    url: url ? { name: url.name, value: url.value.replace(/\/+$/, "") } : null,
    key,
    secret,
  };
}

export function isSupabaseConfigured() {
  const { url, key } = supabaseEnv();
  return Boolean(url && key);
}

/** Plain-language list of what is still missing, for error messages. Names only, never values. */
export function missingSettings(): string[] {
  const { url, key } = supabaseEnv();
  const missing: string[] = [];
  if (!url) missing.push(URL_NAMES[0]);
  if (!key) missing.push(KEY_NAMES[0]);
  return missing;
}

export const SETTING_NAMES = { URL_NAMES, KEY_NAMES, SECRET_NAMES };
export const PRIVACY_VERSION = "draft-2026-11";
