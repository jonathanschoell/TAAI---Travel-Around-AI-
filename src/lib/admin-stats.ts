import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const DAY = 24 * 60 * 60 * 1000;

/** Usage figures for the admin overview. Call only after requireAdmin(). */
export async function loadAdminOverview(admin: SupabaseClient, adminUserId: string) {
  const now = Date.now();
  const since = (days: number) => new Date(now - days * DAY).toISOString();
  const count = (table: string) => admin.from(table).select("*", { count: "exact", head: true });

  const [total, active1, active7, active30, new7, trips, personalised, list] = await Promise.all([
    count("profiles"),
    count("profiles").gte("last_seen_at", since(1)),
    count("profiles").gte("last_seen_at", since(7)),
    count("profiles").gte("last_seen_at", since(30)),
    count("profiles").gte("created_at", since(7)),
    count("trips"),
    count("profiles").eq("personalization_enabled", true),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  await admin.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action: "view_overview",
  });

  const users = [...(list.data?.users ?? [])].sort((a, b) =>
    (b.last_sign_in_at ?? "").localeCompare(a.last_sign_in_at ?? ""),
  );
  const tiles: [string, number | null][] = [
    ["Registered users", total.count],
    ["Active in the last 24 hours", active1.count],
    ["Active in the last 7 days", active7.count],
    ["Active in the last 30 days", active30.count],
    ["New in the last 7 days", new7.count],
    ["Saved trips", trips.count],
    ["Personalisation on", personalised.count],
  ];
  return { users, tiles };
}
