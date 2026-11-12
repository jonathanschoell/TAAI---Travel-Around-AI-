"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, missingSettings, PRIVACY_VERSION } from "@/lib/env";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export type FormState = { error?: string; notice?: string; email?: string; needsConfirm?: boolean };

const texts = async () => (await getI18n()).t.auth;

async function notConfigured() {
  return f((await texts()).errors.notConfigured, { missing: missingSettings().join(", ") });
}
const MIN_PASSWORD = 10;

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

function text(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: await notConfigured() };
  const T = await texts();
  const email = text(fd, "email").toLowerCase();
  const name = text(fd, "name").slice(0, 60);
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: T.errors.invalidEmail, email };
  if (password.length < MIN_PASSWORD)
    return { error: f(T.errors.shortPassword, { n: MIN_PASSWORD }), email };
  if (password !== confirm)
    return { error: T.errors.mismatch, email };
  if (fd.get("age") !== "on")
    return { error: T.errors.age, email };
  if (fd.get("privacy") !== "on")
    return { error: T.errors.accept, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard`,
      data: { display_name: name, privacy_version: PRIVACY_VERSION },
    },
  });
  if (error) {
    if (error.code === "weak_password")
      return { error: T.errors.weak, email };
    if (error.code === "over_email_send_rate_limit" || error.status === 429)
      return { error: T.errors.rateLimit, email };
    if (!error.status)
      return {
        error: T.errors.unreachable,
        email,
      };
    return {
      error: f(T.errors.createFailed, { code: String(error.code ?? error.status) }),
      email,
    };
  }
  // Same message whether or not the address was already registered.
  return {
    notice: f(T.notices.checkInbox, { email }),
    email,
  };
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: await notConfigured() };
  const T = await texts();
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: T.errors.enterBoth, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed")
      return {
        error: T.errors.confirmFirst,
        needsConfirm: true,
        email,
      };
    if (error.status === 429)
      return { error: T.errors.rateLimit, email };
    if (!error.status)
      return {
        error: T.errors.unreachable,
        email,
      };
    return { error: T.errors.wrong, email };
  }
  redirect(safeNext(fd.get("next")));
}

export async function resendConfirmation(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: await notConfigured() };
  const T = await texts();
  const email = text(fd, "email").toLowerCase();
  if (!email) return { error: T.errors.enterEmailFirst };
  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard` },
  });
  return { notice: T.notices.resent, email };
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: await notConfigured() };
  const T = await texts();
  const email = text(fd, "email").toLowerCase();
  if (!email) return { error: T.errors.enterEmail };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  // Never reveal whether the address exists.
  return {
    notice: T.notices.resetSent,
  };
}

export async function updatePassword(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: await notConfigured() };
  const T = await texts();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD)
    return { error: f(T.errors.shortPassword, { n: MIN_PASSWORD }) };
  if (password !== confirm) return { error: T.errors.mismatch };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user)
    return { error: T.errors.resetExpired };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password")
      return { error: T.errors.samePassword };
    if (error.code === "weak_password")
      return { error: T.errors.weak };
    return { error: T.errors.saveFailed };
  }
  redirect("/dashboard?notice=password-updated");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
