import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const params = await searchParams;
  const name = profile?.display_name || "traveller";
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, destination, start_date, end_date, travelers")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const day = (iso: string | null) =>
    iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-CH", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

  return (
    <div className="flex flex-col gap-8">
      {params.notice === "password-updated" ? (
        <p className="notice notice-ok">Your new password is saved.</p>
      ) : null}
      {params.notice === "trip-deleted" ? <p className="notice notice-ok">The trip was deleted.</p> : null}
      <section>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Welcome, {name}</h1>
        <p className="mt-2 max-w-2xl text-muted">
          This is your private space. Your trips, preferences and everything Jovia learns about
          how you like to travel will live here.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card flex flex-col gap-3 md:col-span-2">
          <h2 className="text-xl font-bold">Plan a trip</h2>
          <p className="text-muted">
            Describe who is travelling, what you enjoy and your budget. Jovia builds a
            day-by-day itinerary and saves it here.
          </p>
          <Link href="/plan" className="btn btn-primary sm:w-fit">Plan a new trip</Link>
        </article>

        <article className="card flex flex-col gap-3">
          <h2 className="text-xl font-bold">Your profile</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Currency</dt><dd>{profile?.currency ?? "CHF"}</dd>
            <dt className="text-muted">Age group</dt><dd>{profile?.age_group ?? "Not set"}</dd>
          </dl>
          <Link href="/profile" className="btn btn-ghost sm:w-fit">Edit profile</Link>
        </article>

        <article className="card md:col-span-3">
          <h2 className="text-xl font-bold">Your trips</h2>
          {trips && trips.length > 0 ? (
            <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((t) => (
                <li key={t.id}>
                  <Link href={`/trips/${t.id}`} className="block rounded-2xl border border-line p-4 hover:border-brand">
                    <p className="font-display text-lg font-bold">{t.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {t.destination} · {day(t.start_date)} to {day(t.end_date)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">No trips yet. Your saved itineraries will appear here.</p>
          )}
        </article>
      </section>
    </div>
  );
}
