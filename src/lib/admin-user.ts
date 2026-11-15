import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Everything stored for one account, for the admin detail page. Call only after
 * requireAdmin(). Every call is written to the admin audit log.
 */
export async function loadUserDetails(admin: SupabaseClient, adminUserId: string, userId: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const [auth, profile, sub, prefs, family, consents, trips, memory, visited, reports, usage] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("travel_preferences").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("family_members").select("age_group, interests, created_at").eq("user_id", userId),
    admin.from("consents").select("kind, granted, policy_version, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("trips")
      .select("id, title, destination, start_date, end_date, travelers, currency, budget_total, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    admin.from("memory_items").select("statement, category, source, active, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("visited_places").select("name, destination, created_at").eq("user_id", userId),
    admin.from("content_reports").select("trip_id, reason, created_at").eq("user_id", userId),
    admin.from("ai_usage").select("kind, input_tokens, output_tokens, created_at").eq("user_id", userId).gte("created_at", monthStart),
  ]);

  await admin.from("admin_audit_log").insert({ admin_user_id: adminUserId, action: "view_user", target: userId });

  const byKind = new Map<string, { count: number; input: number; output: number }>();
  for (const u of usage.data ?? []) {
    const k = byKind.get(u.kind) ?? { count: 0, input: 0, output: 0 };
    k.count++;
    k.input += u.input_tokens ?? 0;
    k.output += u.output_tokens ?? 0;
    byKind.set(u.kind, k);
  }

  return {
    auth: auth.data.user ?? null,
    profile: (profile.data ?? null) as Record<string, unknown> | null,
    subscription: (sub.data ?? null) as Record<string, unknown> | null,
    preferences: (prefs.data ?? null) as Record<string, unknown> | null,
    family: family.data ?? [],
    consents: consents.data ?? [],
    trips: trips.data ?? [],
    memory: memory.data ?? [],
    visited: visited.data ?? [],
    reports: reports.data ?? [],
    usageThisMonth: [...byKind.entries()].map(([kind, v]) => ({ kind, ...v })),
  };
}

/** One trip with all days and activities, for the admin detail page. */
export async function loadUserTrip(admin: SupabaseClient, adminUserId: string, userId: string, tripId: string) {
  const { data: trip } = await admin.from("trips").select("*").eq("id", tripId).eq("user_id", userId).maybeSingle();
  if (!trip) return null;
  const { data: days } = await admin.from("trip_days")
    .select("id, day_number, day_date, theme, transit_notes").eq("trip_id", tripId).order("day_number");
  const ids = (days ?? []).map((d) => d.id);
  const { data: acts } = ids.length
    ? await admin.from("activities").select("trip_day_id, slot, position, name, description, cost").in("trip_day_id", ids).order("position")
    : { data: [] };
  await admin.from("admin_audit_log").insert({ admin_user_id: adminUserId, action: "view_trip", target: tripId });
  return { trip: trip as Record<string, unknown>, days: days ?? [], activities: acts ?? [] };
}
