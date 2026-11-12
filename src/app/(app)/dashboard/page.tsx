import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getQuota } from "@/lib/billing";
import { f } from "@/lib/i18n/config";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("dashboard");

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const params = await searchParams;
  const { t: all, date } = await getI18n();
  const t = all.dashboard;
  const quota = await getQuota(user);
  const name = profile?.display_name || t.traveller;
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, title, destination, start_date, end_date, travelers")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-8">
      {params.notice === "password-updated" ? (
        <p className="notice notice-ok">{t.passwordUpdated}</p>
      ) : null}
      {params.notice === "trip-deleted" ? <p className="notice notice-ok">{t.tripDeleted}</p> : null}
      <section>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{f(t.welcome, { name })}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.lead}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card flex flex-col gap-3 md:col-span-2">
          <h2 className="text-xl font-bold">{t.planTitle}</h2>
          <p className="text-muted">{t.planLead}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/plan" className="btn btn-primary">{t.planNew}</Link>
            <Link href="/holidays" className="btn btn-ghost">{t.findDates}</Link>
          </div>
        </article>

        <article className="card flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t.profileTitle}</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">{t.plan}</dt>
            <dd><a href="/profile#plans" className="underline">{all.plans[quota.tier]}</a></dd>
            <dt className="text-muted">{t.currency}</dt><dd>{profile?.currency ?? "CHF"}</dd>
            <dt className="text-muted">{t.ageGroup}</dt><dd>{profile?.age_group ?? t.notSet}</dd>
          </dl>
          <Link href="/profile" className="btn btn-ghost sm:w-fit">{t.editProfile}</Link>
        </article>

        <article className="card md:col-span-3">
          <h2 className="text-xl font-bold">{t.tripsTitle}</h2>
          {trips && trips.length > 0 ? (
            <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <Link href={`/trips/${trip.id}`} className="block rounded-2xl border border-line p-4 hover:border-brand">
                    <p className="font-display text-lg font-bold">{trip.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {trip.destination} · {date(trip.start_date)} {t.to} {date(trip.end_date)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">{t.noTrips}</p>
          )}
        </article>
      </section>
    </div>
  );
}
