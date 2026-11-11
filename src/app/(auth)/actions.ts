"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, missingSettings, PRIVACY_VERSION } from "@/lib/env";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; notice?: string; email?: string };

function notConfigured() {
  return (
    "Sign-in is not connected yet. Missing on the server: " +
    missingSettings().join(", ") +
    ". Open /setup-check on this site for details."
  );
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
  if (!isSupabaseConfigured()) return { error: notConfigured() };
  const email = text(fd, "email").toLowerCase();
  const name = text(fd, "name").slice(0, 60);
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email address.", email };
  if (password.length < MIN_PASSWORD)
    return { error: `Use at least ${MIN_PASSWORD} characters for your password.`, email };
  if (password !== confirm)
    return { error: "The two passwords do not match.", email };
  if (fd.get("age") !== "on")
    return { error: "You need to be 16 or older to create an account.", email };
  if (fd.get("privacy") !== "on")
    return { error: "Please accept the terms of use and the privacy policy to continue.", email };

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
      return { error: "That password is too easy to guess. Choose a longer or less common one.", email };
    if (error.code === "over_email_send_rate_limit" || error.status === 429)
      return { error: "Too many attempts. Wait a minute and try again.", email };
    if (!error.status)
      return {
        error: "The sign-in service could not be reached. Open /setup-check on this site to see why.",
        email,
      };
    return {
      error: `We could not create the account (${error.code ?? error.status}). Please try again.`,
      email,
    };
  }
  // Same message whether or not the address was already registered.
  return {
    notice:
      "Check your inbox. We sent a confirmation link to " +
      email +
      ". Your account becomes active once you open it.",
    email,
  };
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: notConfigured() };
  const email = text(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed")
      return {
        error:
          "Please confirm your email first. Open the link we sent you, or request a new one below.",
        email,
      };
    if (error.status === 429)
      return { error: "Too many attempts. Wait a minute and try again.", email };
    if (!error.status)
      return {
        error: "The sign-in service could not be reached. Open /setup-check on this site to see why.",
        email,
      };
    return { error: "Email or password is incorrect.", email };
  }
  redirect(safeNext(fd.get("next")));
}

export async function resendConfirmation(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: notConfigured() };
  const email = text(fd, "email").toLowerCase();
  if (!email) return { error: "Enter your email address first." };
  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard` },
  });
  return { notice: "If that address has an unconfirmed account, a new link is on its way.", email };
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: notConfigured() };
  const email = text(fd, "email").toLowerCase();
  if (!email) return { error: "Enter your email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  // Never reveal whether the address exists.
  return {
    notice: "If an account exists for that address, we sent a link to set a new password.",
  };
}

export async function updatePassword(_: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { error: notConfigured() };
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD)
    return { error: `Use at least ${MIN_PASSWORD} characters for your password.` };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user)
    return { error: "This reset link has expired. Request a new one and try again." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password")
      return { error: "Choose a password you have not used for this account before." };
    if (error.code === "weak_password")
      return { error: "That password is too easy to guess. Choose a longer or less common one." };
    return { error: "We could not save the new password. Please try again." };
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
