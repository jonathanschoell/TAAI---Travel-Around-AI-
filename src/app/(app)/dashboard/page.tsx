import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const params = await searchParams;
  const name = profile?.display_name || "traveller";

  return (
    <div className="flex flex-col gap-8">
      {params.notice === "password-updated" ? (
        <p className="notice notice-ok">Your new password is saved.</p>
      ) : null}
      <section>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome, {name}</h1>
        <p className="mt-2 max-w-2xl text-muted">
          This is your private space. Your trips, preferences and everything TAAI learns about
          how you like to travel will live here.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Plan a trip</h2>
            <span className="pill pill-signal">Coming next</span>
          </div>
          <p className="text-muted">
            The AI trip planner is the next part being built. You will describe who is travelling,
            what you enjoy and your budget, and get a day-by-day itinerary.
          </p>
          <Link href="/plan" className="btn btn-ghost sm:w-fit">See what is planned</Link>
        </article>

        <article className="card flex flex-col gap-3">
          <h2 className="text-xl font-bold">Your profile</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Currency</dt><dd>{profile?.currency ?? "CHF"}</dd>
            <dt className="text-muted">Travellers</dt><dd>{profile?.default_travelers ?? 1}</dd>
            <dt className="text-muted">Age group</dt><dd>{profile?.age_group ?? "Not set"}</dd>
          </dl>
          <Link href="/profile" className="btn btn-ghost sm:w-fit">Edit profile</Link>
        </article>

        <article className="card md:col-span-3">
          <h2 className="text-xl font-bold">Saved trips</h2>
          <p className="mt-2 text-muted">
            No trips yet. Once the planner is live, every itinerary you save appears here.
          </p>
        </article>
      </section>
    </div>
  );
}
