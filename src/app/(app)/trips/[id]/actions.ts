"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { editsLeftToday, getTier, TIERS } from "@/lib/billing";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { PlannerError, suggestReplacement } from "@/lib/planner/ai";
import type { TripInput } from "@/lib/planner/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ReplaceState = { error?: string; notice?: string };

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

/** Swaps one activity for an AI suggestion; the rest of the trip stays as it is. */
export async function replaceActivity(_: ReplaceState, fd: FormData): Promise<ReplaceState> {
  const user = await requireUser();
  const { t, locale } = await getI18n();
  const T = t.client.replace;
  const id = String(fd.get("activity_id") ?? "");
  const wish = String(fd.get("wish") ?? "").trim().slice(0, 300);
  if (!isUuid(id)) return { error: T.failed };

  const supabase = await createClient();
  // Row level security only returns the person's own rows.
  const { data: act } = await supabase.from("activities")
    .select("id, trip_day_id, slot, name, description").eq("id", id).maybeSingle();
  if (!act) return { error: T.failed };
  const { data: day } = await supabase.from("trip_days")
    .select("id, trip_id, day_number, theme").eq("id", act.trip_day_id).maybeSingle();
  if (!day) return { error: T.failed };
  const { data: trip } = await supabase.from("trips")
    .select("id, destination, input").eq("id", day.trip_id).maybeSingle();
  if (!trip) return { error: T.failed };

  const tier = await getTier(user);
  if ((await editsLeftToday(user, tier)) <= 0) return { error: f(T.limit, { n: TIERS[tier].editsPerDay }) };

  const { data: dayIds } = await supabase.from("trip_days").select("id").eq("trip_id", trip.id);
  const { data: names } = await supabase.from("activities").select("name")
    .in("trip_day_id", (dayIds ?? []).map((d) => d.id));

  const input = (trip.input ?? {}) as TripInput;
  const stops = Array.isArray(input.stops) ? input.stops : [];
  const themePlace = stops.find((s) => day.theme?.toLowerCase().startsWith(s.place.toLowerCase()))?.place;

  let result;
  try {
    result = await suggestReplacement(
      {
        input: { ...input, destination: input.destination ?? trip.destination, stops, ages: input.ages ?? [], interests: input.interests ?? [] },
        place: themePlace ?? trip.destination,
        dayNumber: day.day_number,
        dayTheme: day.theme ?? "",
        current: { slot: act.slot, name: act.name, description: act.description ?? "" },
        avoid: (names ?? []).map((n) => n.name),
        wish,
      },
      tier,
      locale,
    );
  } catch (e) {
    const kind = e instanceof PlannerError ? e.kind : "failed";
    return { error: kind === "busy" ? t.plan.errors.busy : kind === "not_configured" ? t.plan.errors.not_configured : T.failed };
  }

  const admin = createAdminClient();
  if (admin) {
    await admin.from("ai_usage").insert({
      user_id: user.id, kind: "edit", input_tokens: result.usage.input_tokens, output_tokens: result.usage.output_tokens,
    });
  }
  const a = result.activity;
  const { error } = await supabase.from("activities").update({
    name: a.name,
    category: a.category,
    description: a.description,
    duration_minutes: a.duration_minutes,
    cost: a.cost,
    latitude: a.latitude,
    longitude: a.longitude,
    price_type: "estimated",
    verified: false,
    source: "ai",
  }).eq("id", act.id);
  if (error) return { error: T.failed };

  revalidatePath(`/trips/${trip.id}`);
  return { notice: f(T.done, { name: a.name }) };
}
