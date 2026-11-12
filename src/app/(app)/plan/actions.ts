"use server";

import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { generatePlan, PlannerError, type SwissContext } from "@/lib/planner/ai";
import { getHolidays } from "@/lib/holidays";
import { cantonByCode, nearestAirports } from "@/lib/swiss";
import type { TripInput } from "@/lib/planner/options";
import { parseTripForm } from "@/lib/planner/parse";
import { getQuota, TIERS } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export type PlanFormState = { error?: string; values?: Record<string, string | string[]> };

const DAY = 24 * 60 * 60 * 1000;
const LIST_FIELDS = ["interests", "ages", "stop_place", "stop_from", "stop_to"];


function keep(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$")) continue;
    const all = fd.getAll(key).map(String);
    out[key] = LIST_FIELDS.includes(key) ? all : (all[0] ?? "");
  }
  return out;
}

/**
 * The single place where the AI may read stored preferences and memory.
 * Returns nothing unless the person has turned long-term personalisation on.
 */
async function loadPersonalContext(userId: string, enabled: boolean): Promise<string> {
  if (!enabled) return "";
  const supabase = await createClient();
  const [{ data: memory }, { data: visited }] = await Promise.all([
    supabase.from("memory_items").select("statement").eq("user_id", userId).eq("active", true)
      .order("weight", { ascending: false }).limit(12),
    supabase.from("visited_places").select("name, destination").eq("user_id", userId).limit(30),
  ]);
  const lines = (memory ?? []).map((m) => `- ${m.statement}`);
  if (visited?.length)
    lines.push(
      "- Already visited, do not suggest again unless asked: " +
        visited.map((v) => (v.destination ? `${v.name} (${v.destination})` : v.name)).join("; "),
    );
  return lines.join("\n");
}

/** Departure airports and canton holidays for the trip, from reference and official data. */
async function swissContext(input: TripInput, locale: string): Promise<SwissContext | null> {
  const canton = cantonByCode(input.homeCanton);
  const point = input.homeCoords ?? (canton ? { lat: canton.lat, lng: canton.lng } : null);
  if (!point) return null;
  const holidays = canton ? await getHolidays(canton.code, input.startDate, input.endDate, locale) : null;
  const label = [input.origin, canton ? `canton ${canton.name}` : ""].filter(Boolean).join(", ");
  return {
    homeLabel: label || "their shared location",
    airports: nearestAirports(point.lat, point.lng, 4),
    holidays,
  };
}

export async function createTrip(_: PlanFormState, fd: FormData): Promise<PlanFormState> {
  const user = await requireUser();
  const values = keep(fd);
  const { t, locale } = await getI18n();
  const E = t.plan.errors;
  const { input, error } = parseTripForm(fd, E);
  if (!input) return { error, values };

  const quota = await getQuota(user);
  const limits = TIERS[quota.tier];
  if (input.days > limits.maxDays)
    return {
      error:
        quota.tier === "free"
          ? f(E.freeTooLong, { n: limits.maxDays })
          : f(E.tooLong, { n: limits.maxDays }),
      values,
    };
  if (quota.leftThisMonth <= 0)
    return {
      error:
        quota.tier === "free"
          ? f(E.freeUsed, { n: limits.plansPerMonth })
          : f(E.monthLimit, { n: limits.plansPerMonth }),
      values,
    };
  if (quota.leftToday <= 0)
    return { error: E.dayLimit, values };
  const admin = createAdminClient();

  const profile = await getProfile(user.id);
  const context = await loadPersonalContext(user.id, profile?.personalization_enabled ?? false);
  const swiss = await swissContext(input, locale);

  let result;
  try {
    result = await generatePlan(input, context, quota.tier, swiss, locale);
  } catch (e) {
    const kind = e instanceof PlannerError ? e.kind : "failed";
    const messages: Record<string, string> = {
      not_configured: E.not_configured, busy: E.busy, incomplete: E.incomplete, failed: E.failed,
    };
    return { error: messages[kind] ?? E.failed, values };
  }
  const { plan, usage } = result;

  if (admin) {
    await admin.from("ai_usage").insert({
      user_id: user.id, kind: "plan", input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
    });
  }

  const supabase = await createClient();
  const { data: trip, error: tripError } = await supabase.from("trips").insert({
    user_id: user.id,
    title: plan.title,
    destination: input.destination,
    start_date: input.startDate,
    end_date: input.endDate,
    travelers: input.travelers,
    currency: input.currency,
    budget_total: input.budget,
    summary: plan.summary,
    // The device location is used for this plan only and is not stored.
    input: {
      ...input,
      homeCoords: null,
      tips: plan.tips,
      departure: plan.departure,
      airports: swiss?.airports ?? [],
      holidays: swiss?.holidays ?? [],
    },
    budget_breakdown: plan.budget,
  }).select("id").single();
  if (tripError || !trip)
    return { error: E.notSaved, values };

  const startMs = Date.parse(input.startDate + "T00:00:00Z");
  const { data: dayRows, error: dayError } = await supabase.from("trip_days").insert(
    plan.days.map((d) => ({
      trip_id: trip.id,
      user_id: user.id,
      day_number: d.day_number,
      day_date: new Date(startMs + (d.day_number - 1) * DAY).toISOString().slice(0, 10),
      theme: d.theme,
      transit_notes: d.transit_notes,
    })),
  ).select("id, day_number");

  const dayId = new Map((dayRows ?? []).map((r) => [r.day_number, r.id]));
  const activities = plan.days.flatMap((d) =>
    d.activities.map((a, position) => ({
      trip_day_id: dayId.get(d.day_number),
      user_id: user.id,
      position,
      ...a,
      price_type: "estimated",
      verified: false,
      source: "ai",
    })),
  );
  const actError = dayError
    ? dayError
    : (await supabase.from("activities").insert(activities)).error;
  if (actError) {
    await supabase.from("trips").delete().eq("id", trip.id);
    return { error: E.notSaved, values };
  }

  redirect(`/trips/${trip.id}`);
}
