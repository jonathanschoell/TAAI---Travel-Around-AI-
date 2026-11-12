"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isLocale, LOCALE_COOKIE } from "./config";

/** Saves the chosen language for this browser and, when signed in, in the profile. */
export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  if (!isSupabaseConfigured()) return;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) await supabase.from("profiles").update({ language: locale }).eq("user_id", data.user.id);
}
