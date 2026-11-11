import type { Metadata } from "next";
import { PlanForm } from "@/components/plan-form";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { getQuota, TIERS } from "@/lib/billing";

export const metadata: Metadata = { title: "Plan a trip" };

// Creating an itinerary can take a couple of minutes.
export const maxDuration = 300;

export default async function PlanPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const quota = await getQuota(user);
  const limits = TIERS[quota.tier];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Plan a trip</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Only the destination and dates are required. The more you tell Jovia, the better the
          plan fits. All prices in the itinerary are estimates.
        </p>
      </div>
      <p className="notice flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className="pill pill-signal mr-2">{limits.label}</span>
          {quota.leftThisMonth} of {limits.plansPerMonth} itineraries left this month. Trips of up
          to {limits.maxDays} days.
        </span>
        {quota.tier === "free" ? <Link href="/pricing" className="underline">See Premium</Link> : null}
      </p>
      <PlanForm
        maxDays={limits.maxDays}
        defaults={{
          currency: profile?.currency ?? "CHF",
          travelers: profile?.default_travelers ?? 2,
          ageGroup: profile?.age_group ?? "",
        }}
      />
    </div>
  );
}
