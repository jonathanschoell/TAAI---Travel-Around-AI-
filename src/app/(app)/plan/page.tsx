import type { Metadata } from "next";
import { PlanForm } from "@/components/plan-form";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Plan a trip" };

// Creating an itinerary can take a couple of minutes.
export const maxDuration = 300;

export default async function PlanPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Plan a trip</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Only the destination and dates are required. The more you tell TAAI, the better the
          plan fits. All prices in the itinerary are estimates.
        </p>
      </div>
      <PlanForm
        defaults={{
          currency: profile?.currency ?? "CHF",
          travelers: profile?.default_travelers ?? 2,
          ageGroup: profile?.age_group ?? "",
        }}
      />
    </div>
  );
}
