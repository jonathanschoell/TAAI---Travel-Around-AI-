import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Plan a trip" };

const STEPS = [
  ["Tell us about the trip", "Destination, dates, who is travelling, interests, budget and special wishes."],
  ["TAAI builds your itinerary", "Mornings, afternoons and evenings for every day, with restaurants, travel hints and breaks."],
  ["Adjust until it fits", "Swap or remove activities, replan a day, make it cheaper or more relaxed, then save or export as PDF."],
];

export default async function PlanPage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="pill pill-signal">Coming next</span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Plan a trip</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The planner is not available yet. It is the next part of TAAI being built. This is how
          it will work:
        </p>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="card">
            <p className="font-display text-sm font-bold text-brand">Step {i + 1}</p>
            <h2 className="mt-1 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
