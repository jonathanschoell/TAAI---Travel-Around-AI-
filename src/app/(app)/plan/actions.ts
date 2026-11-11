"use server";

import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth";
import { CURRENCIES } from "@/lib/options";
import { generatePlan, PlannerError } from "@/lib/planner/ai";
import {
  INTERESTS,
  LEVELS,
  LODGING,
  MAX_TRIP_DAYS,
  PACES,
  PARTY_TYPES,
  TRAVEL_MODES,
  type TripInput,
} from "@/lib/planner/options";
import { getQuota, TIERS } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PlanFormState = { error?: string; values?: Record<string, string | string[]> };

const DAY = 24 * 60 * 60 * 1000;
const pick = (pairs: [string, string][], v: string, fallback: string) =>
  pairs.some(([k]) => k === v) ? v : fallback;

function parse(fd: FormData): { input?: TripInput; error?: string } {
  const s = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const destination = s("destination", 120);
  const startDate = s("start_date", 10);
  const endDate = s("end_date", 10);
  if (!destination) return { error: "Tell us where you want to go." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
    return { error: "Choose a start date and an end date." };
  const start = Date.parse(startDate + "T00:00:00Z");
  const end = Date.parse(endDate + "T00:00:00Z");
  if (Number.isNaN(start) || Number.isNaN(end) || end < start)
    return { error: "The end date must be on or after the start date." };
  const days = Math.round((end - start) / DAY) + 1;
  if (days > MAX_TRIP_DAYS)
    return { error: `Trips can be up to ${MAX_TRIP_DAYS} days long. Please shorten the dates.` };

  const travelers = Math.min(20, Math.max(1, Math.round(Number(fd.get("travelers")) || 1)));
  const children = Math.min(travelers - 1, Math.max(0, Math.round(Number(fd.get("children")) || 0)));
  const budgetRaw = Number(fd.get("budget"));
  const allowed = INTERESTS.map(([k]) => k);
  return {
    input: {
      destination,
      origin: s("origin", 120),
      startDate,
      endDate,
      days,
      travelers,
      party: pick(PARTY_TYPES, s("party"), travelers === 1 ? "solo" : "couple"),
      adultAgeGroup: s("adult_age_group", 10),
      children,
      childrenAges: children > 0 ? s("children_ages", 60) : "",
      interests: fd.getAll("interests").map(String).filter((i) => allowed.includes(i)),
      budget: Number.isFinite(budgetRaw) && budgetRaw > 0 ? Math.round(budgetRaw) : null,
      currency: CURRENCIES.includes(s("currency")) ? s("currency") : "CHF",
      travelMode: pick(TRAVEL_MODES, s("travel_mode"), "any"),
      lodging: pick(LODGING, s("lodging"), "any"),
      level: pick(LEVELS, s("level"), "mid"),
      pace: pick(PACES, s("pace"), "balanced"),
      wishes: s("wishes", 600),
      constraints: s("constraints", 600),
    },
  };
}

function keep(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$")) continue;
    const all = fd.getAll(key).map(String);
    out[key] = key === "interests" ? all : (all[0] ?? "");
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

export async function createTrip(_: PlanFormState, fd: FormData): Promise<PlanFormState> {
  const user = await requireUser();
  const values = keep(fd);
  const { input, error } = parse(fd);
  if (!input) return { error, values };

  const quota = await getQuota(user);
  const limits = TIERS[quota.tier];
  if (input.days > limits.maxDays)
    return {
      error:
        quota.tier === "free"
          ? `Free accounts can plan trips of up to ${limits.maxDays} days. Shorten the dates, or see Pricing for longer trips.`
          : `Trips can be up to ${limits.maxDays} days long. Please shorten the dates.`,
      values,
    };
  if (quota.leftThisMonth <= 0)
    return {
      error:
        quota.tier === "free"
          ? `You have used your ${limits.plansPerMonth} free itineraries for this month. See Pricing for more.`
          : `You have reached this month's limit of ${limits.plansPerMonth} itineraries.`,
      values,
    };
  if (quota.leftToday <= 0)
    return { error: "You have reached today's limit. Please try again tomorrow.", values };
  const admin = createAdminClient();

  const profile = await getProfile(user.id);
  const context = await loadPersonalContext(user.id, profile?.personalization_enabled ?? false);

  let result;
  try {
    result = await generatePlan(input, context, quota.tier);
  } catch (e) {
    const kind = e instanceof PlannerError ? e.kind : "failed";
    const messages: Record<string, string> = {
      not_configured: "The AI planner is not connected yet. The site owner still has to add a valid ANTHROPIC_API_KEY.",
      busy: "The AI service is very busy right now. Please try again in a minute.",
      incomplete: "The plan came back incomplete. Please try again, or shorten the trip a little.",
      failed: "We could not create the plan this time. Nothing was saved. Please try again.",
    };
    return { error: messages[kind], values };
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
    input: { ...input, tips: plan.tips },
    budget_breakdown: plan.budget,
  }).select("id").single();
  if (tripError || !trip)
    return { error: "The plan was created but could not be saved. Please try again.", values };

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
    return { error: "The plan was created but could not be saved. Please try again.", values };
  }

  redirect(`/trips/${trip.id}`);
}
