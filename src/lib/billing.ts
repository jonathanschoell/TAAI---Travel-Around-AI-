import "server-only";
import type { User } from "@supabase/supabase-js";
import { isAdminUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Tier = "free" | "premium";

/** What each tier may do. Change the numbers here; the rest of the app reads them. */
export const TIERS: Record<Tier, { label: string; plansPerMonth: number; plansPerDay: number; maxDays: number }> = {
  free: { label: "Free", plansPerMonth: 2, plansPerDay: 2, maxDays: 21 },
  premium: { label: "Premium", plansPerMonth: 30, plansPerDay: 8, maxDays: 21 },
};

/** Admins always count as premium so they can test everything. */
export async function getTier(user: User): Promise<Tier> {
  if (isAdminUser(user)) return "premium";
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || data.tier !== "premium" || data.status !== "active") return "free";
  if (data.current_period_end && new Date(data.current_period_end).getTime() < Date.now()) return "free";
  return "premium";
}

export type Quota = {
  tier: Tier;
  usedThisMonth: number;
  usedToday: number;
  leftThisMonth: number;
  leftToday: number;
  /** False when usage cannot be counted (secret key missing); limits are then not enforced. */
  counted: boolean;
};

export async function getQuota(user: User): Promise<Quota> {
  const tier = await getTier(user);
  const limits = TIERS[tier];
  const admin = createAdminClient();
  if (!admin) {
    return { tier, usedThisMonth: 0, usedToday: 0, leftThisMonth: limits.plansPerMonth, leftToday: limits.plansPerDay, counted: false };
  }
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const count = (since: string) =>
    admin.from("ai_usage").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("kind", "plan").gte("created_at", since);
  const [month, day] = await Promise.all([count(monthStart), count(dayStart)]);
  const usedThisMonth = month.count ?? 0;
  const usedToday = day.count ?? 0;
  return {
    tier,
    usedThisMonth,
    usedToday,
    leftThisMonth: Math.max(0, limits.plansPerMonth - usedThisMonth),
    leftToday: Math.max(0, limits.plansPerDay - usedToday),
    counted: true,
  };
}
