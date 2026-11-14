"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { PRIVACY_VERSION } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AGE_GROUPS, CURRENCIES } from "@/lib/options";
import { cantonByCode } from "@/lib/swiss";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { DICTS } from "@/lib/i18n/dictionaries";

export type AppFormState = { error?: string; notice?: string };

export async function updateProfile(_: AppFormState, fd: FormData): Promise<AppFormState> {
  const user = await requireUser();
  const name = String(fd.get("display_name") ?? "").trim().slice(0, 60);
  const age = String(fd.get("age_group") ?? "");
  const currency = String(fd.get("currency") ?? "");
  const canton = String(fd.get("home_canton") ?? "");
  const place = String(fd.get("home_place") ?? "").trim().slice(0, 80);
  const askedLanguage = String(fd.get("language") ?? "");
  const T = (await getI18n()).t.profile;

  if (!name) return { error: T.errors.name };
  if (!CURRENCIES.includes(currency)) return { error: T.errors.currency };
  const language = isLocale(askedLanguage) ? askedLanguage : null;

  const supabase = await createClient();
  const base = {
    display_name: name,
    age_group: AGE_GROUPS.includes(age) ? age : null,
    currency,
    ...(language ? { language } : {}),
  };
  const home = { home_canton: cantonByCode(canton)?.code ?? null, home_place: place || null };
  let { error } = await supabase.from("profiles").update({ ...base, ...home }).eq("user_id", user.id);
  if (error && /home_(canton|place)/.test(error.message)) {
    // The home columns do not exist until migration 0003 has been run.
    ({ error } = await supabase.from("profiles").update(base).eq("user_id", user.id));
    if (!error)
      return { notice: T.savedNoHome };
  }
  if (error) return { error: T.errors.failed };
  if (language) {
    await supabase.auth.updateUser({ data: { language } });
    (await cookies()).set(LOCALE_COOKIE, language, {
      path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    });
  }
  revalidatePath("/", "layout");
  // Texts in the new language, so the confirmation matches the page after the switch.
  const saved = language ? DICTS[language].profile.saved : T.saved;
  return { notice: saved };
}

export async function setPersonalization(fd: FormData) {
  const user = await requireUser();
  const enabled = fd.get("enabled") === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ personalization_enabled: enabled })
    .eq("user_id", user.id);
  if (!error) {
    await supabase.from("consents").insert({
      user_id: user.id,
      kind: "personalization",
      granted: enabled,
      policy_version: PRIVACY_VERSION,
    });
  }
  revalidatePath("/my-data");
}

export async function deleteAccount(_: AppFormState, fd: FormData): Promise<AppFormState> {
  const user = await requireUser();
  const password = String(fd.get("password") ?? "");
  const A = (await getI18n()).t.account;
  if (!password || !user.email) return { error: A.enterPassword };

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (check.error) return { error: A.wrongPassword };

  const admin = createAdminClient();
  if (!admin)
    return { error: A.notConnected };
  // Deleting the auth user removes every row that references it (ON DELETE CASCADE).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: A.deleteFailed };
  await supabase.auth.signOut();
  redirect("/login?notice=deleted");
}

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export async function deleteTrip(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("trip_id") ?? "");
  if (isUuid(id)) {
    const supabase = await createClient();
    await supabase.from("trips").delete().eq("id", id).eq("user_id", user.id);
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?notice=trip-deleted");
}

/** Lets people flag AI-generated content from inside the app. */
export async function reportTrip(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("trip_id") ?? "");
  if (!isUuid(id)) redirect("/dashboard");
  const supabase = await createClient();
  await supabase.from("content_reports").insert({
    user_id: user.id,
    trip_id: id,
    reason: "reported_from_trip_page",
  });
  redirect(`/trips/${id}?notice=reported`);
}

/** Admin only: give or remove Premium by hand, until online payment is connected. */
export async function setUserTier(_: AppFormState, fd: FormData): Promise<AppFormState> {
  const me = await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const asked = String(fd.get("tier") ?? "");
  const tier = asked === "premium" || asked === "unlimited" ? asked : "free";
  if (!email) return { error: "Enter the email address of the account." };
  const admin = createAdminClient();
  if (!admin) return { error: "The secret key is missing on the server." };

  let userId: string | null = null;
  for (let page = 1; page <= 10 && !userId; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    userId = users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (users.length < 200) break;
  }
  if (!userId) return { error: "No account with that email address was found." };

  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId, tier, status: "active", source: "manual", current_period_end: null,
  });
  if (error)
    return { error: "Could not save. Has supabase/migrations/0002_subscriptions.sql been run in Supabase?" };
  await admin.from("admin_audit_log").insert({ admin_user_id: me.id, action: `set_tier_${tier}`, target: userId });
  revalidatePath("/admin");
  const names = { free: "Free", premium: "Premium", unlimited: "Unlimited" };
  return { notice: `${email} is now on the ${names[tier]} plan.` };
}
