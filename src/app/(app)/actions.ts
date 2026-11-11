"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PRIVACY_VERSION } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AGE_GROUPS, CURRENCIES } from "@/lib/options";

export type AppFormState = { error?: string; notice?: string };

export async function updateProfile(_: AppFormState, fd: FormData): Promise<AppFormState> {
  const user = await requireUser();
  const name = String(fd.get("display_name") ?? "").trim().slice(0, 60);
  const age = String(fd.get("age_group") ?? "");
  const currency = String(fd.get("currency") ?? "");
  const travelers = Number(fd.get("default_travelers") ?? 1);

  if (!name) return { error: "Enter a name for your profile." };
  if (!CURRENCIES.includes(currency)) return { error: "Choose a currency from the list." };
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20)
    return { error: "Number of travellers must be between 1 and 20." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      age_group: AGE_GROUPS.includes(age) ? age : null,
      currency,
      default_travelers: travelers,
    })
    .eq("user_id", user.id);
  if (error) return { error: "We could not save your profile. Please try again." };
  revalidatePath("/", "layout");
  return { notice: "Profile saved." };
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
  if (!password || !user.email) return { error: "Enter your password to confirm." };

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (check.error) return { error: "That password is not correct." };

  const admin = createAdminClient();
  if (!admin)
    return { error: "Account deletion is not connected yet. Please contact the site owner." };
  // Deleting the auth user removes every row that references it (ON DELETE CASCADE).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "We could not delete the account. Please try again." };
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
