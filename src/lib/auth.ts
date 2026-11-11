import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** The signed-in user, verified against Supabase on every request. */
export const getUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Admins are confirmed accounts whose email is listed in ADMIN_EMAILS (server-side env only). */
export function isAdminUser(user: User): boolean {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(
    user.email &&
      user.email_confirmed_at &&
      allowed.includes(user.email.toLowerCase()),
  );
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminUser(user)) notFound();
  return user;
}

export type Profile = {
  user_id: string;
  display_name: string;
  age_group: string | null;
  language: string;
  currency: string;
  default_travelers: number;
  personalization_enabled: boolean;
  created_at: string;
  last_seen_at: string | null;
};

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, age_group, language, currency, default_travelers, personalization_enabled, created_at, last_seen_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

export function safeNext(value: FormDataEntryValue | string | null | undefined) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")
    ? v
    : "/dashboard";
}

const TEN_MINUTES = 10 * 60 * 1000;

/** Records activity at most every ten minutes; this feeds the "active users" figures. */
export async function touchLastSeen(profile: Profile | null) {
  if (!profile) return;
  const last = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0;
  if (Date.now() - last <= TEN_MINUTES) return;
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", profile.user_id);
}
