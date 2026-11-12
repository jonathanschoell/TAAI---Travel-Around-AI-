import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTrip, reportTrip } from "@/app/(app)/actions";
import { requireUser } from "@/lib/auth";
import { BUDGET_PARTS, INTERESTS, SLOTS } from "@/lib/planner/options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your itinerary" };

type Activity = {
  id: string; trip_day_id: string; slot: string; position: number; name: string;
  category: string | null; description: string | null; duration_minutes: number | null;
  cost: number | null; price_type: string; verified: boolean;
  latitude: number | null; longitude: number | null;
};

const date = (iso: string | null) =>
  iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-CH", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "";

export default async function TripPage({ params, searchParams }: PageProps<"/trips/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips")
    .select("id, title, destination, start_date, end_date, travelers, currency, budget_total, summary, input, budget_breakdown")
    .eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!trip) notFound();

  const { data: days } = await supabase.from("trip_days")
    .select("id, day_number, day_date, theme, transit_notes").eq("trip_id", id).order("day_number");
  const dayIds = (days ?? []).map((d) => d.id);
  const { data: acts } = dayIds.length
    ? await supabase.from("activities")
        .select("id, trip_day_id, slot, position, name, category, description, duration_minutes, cost, price_type, verified, latitude, longitude")
        .in("trip_day_id", dayIds).order("position")
    : { data: [] as Activity[] };
  const activities = (acts ?? []) as Activity[];

  const money = (n: number) => `${trip.currency} ${Math.round(n).toLocaleString("en-CH")}`;
  const breakdown = (trip.budget_breakdown ?? {}) as Record<string, number>;
  const total = BUDGET_PARTS.reduce((sum, [k]) => sum + (Number(breakdown[k]) || 0), 0);
  const biggest = Math.max(1, ...BUDGET_PARTS.map(([k]) => Number(breakdown[k]) || 0));
  const saved = (trip.input ?? {}) as { tips?: string[]; stops?: { place: string; from: string; to: string }[] };
  const tips = (saved.tips ?? []).slice(0, 4);
  const stops = Array.isArray(saved.stops) ? saved.stops : [];
  const budget = trip.budget_total ? Number(trip.budget_total) : null;
  const catLabel = (c: string | null) => INTERESTS.find(([k]) => k === c)?.[1];

  return (
    <div className="flex flex-col gap-8">
      {query.notice === "reported" ? (
        <p className="notice notice-ok">Thank you. Your report was sent and will be reviewed.</p>
      ) : null}

      <header className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-muted">
            {trip.destination} · {date(trip.start_date)} to {date(trip.end_date)} · {trip.travelers}{" "}
            {trip.travelers === 1 ? "traveller" : "travellers"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">{trip.title}</h1>
          {trip.summary ? <p className="mt-3 max-w-3xl text-lg text-muted">{trip.summary}</p> : null}
          {stops.length ? (
            <p className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Route:</span>
              {stops.map((st) => (
                <span key={st.place + st.from} className="pill">
                  {st.place} · {date(st.from)} to {date(st.to)}
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <aside className="card">
          <p className="text-sm text-muted">Estimated total</p>
          <p className="font-display text-3xl font-extrabold tabular-nums">{money(total)}</p>
          {budget ? (
            <p className="mt-1 text-sm">
              {total <= budget
                ? `About ${money(budget - total)} under your budget of ${money(budget)}.`
                : `About ${money(total - budget)} over your budget of ${money(budget)}.`}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted">
            Saved to your account. All prices are AI estimates, not quotes. Check opening
            hours and prices before you book.
          </p>
        </aside>
      </header>

      <section className="flex flex-col gap-5">
        {(days ?? []).map((d) => {
          const todays = activities.filter((a) => a.trip_day_id === d.id);
          const dayCost = todays.reduce((s, a) => s + (Number(a.cost) || 0), 0);
          return (
            <article key={d.id} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-extrabold">
                  <span className="text-brand">Day {d.day_number}</span>
                  {d.theme ? ` · ${d.theme}` : ""}
                </h2>
                <p className="text-sm text-muted">
                  {date(d.day_date)} · est. {money(dayCost)}
                </p>
              </div>
              <div className="mt-4 grid gap-x-8 gap-y-5 lg:grid-cols-2">
                {SLOTS.map(([slot, slotLabel]) => {
                  const items = todays.filter((a) => a.slot === slot);
                  if (!items.length) return null;
                  return (
                    <div key={slot}>
                      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand">{slotLabel}</h3>
                      <ul className="mt-2 flex flex-col gap-3">
                        {items.map((a) => (
                          <li key={a.id} className="border-t border-line pt-3">
                            <p className="font-semibold">{a.name}</p>
                            {a.description ? <p className="mt-0.5 text-sm text-muted">{a.description}</p> : null}
                            <p className="mt-1.5 flex flex-wrap gap-1.5">
                              {catLabel(a.category) ? <span className="pill">{catLabel(a.category)}</span> : null}
                              {a.duration_minutes ? <span className="pill">{a.duration_minutes} min</span> : null}
                              <span className="pill">
                                {a.cost ? `est. ${money(Number(a.cost))}` : "Free or included"}
                              </span>
                              {a.verified ? null : <span className="pill">Not verified</span>}
                              {a.latitude !== null && a.longitude !== null ? (
                                <a className="pill underline" target="_blank" rel="noreferrer"
                                  href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=16/${a.latitude}/${a.longitude}`}>
                                  Open map
                                </a>
                              ) : null}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              {d.transit_notes ? (
                <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                  <span className="font-semibold text-ink">Getting around: </span>{d.transit_notes}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-bold">Budget overview</h2>
          <p className="mt-1 text-sm text-muted">All figures are estimates for the whole group.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {BUDGET_PARTS.map(([k, name]) => {
              const value = Number(breakdown[k]) || 0;
              return (
                <li key={k}>
                  <div className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="tabular-nums">est. {money(value)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-line">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.round((value / biggest) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
        <article className="card">
          <h2 className="text-xl font-bold">Tips for this trip</h2>
          {tips.length ? (
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
              {tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-muted">No extra tips for this trip.</p>
          )}
          <p className="mt-4 text-sm text-muted">
            Coming next: interactive map, photos, swapping or removing activities, and PDF export.
          </p>
        </article>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link href="/plan" className="btn btn-primary">Plan another trip</Link>
        <Link href="/dashboard" className="btn btn-ghost">All trips</Link>
        <form action={reportTrip}>
          <input type="hidden" name="trip_id" value={trip.id} />
          <button type="submit" className="btn btn-ghost">Report a problem with this plan</button>
        </form>
        <form action={deleteTrip}>
          <input type="hidden" name="trip_id" value={trip.id} />
          <button type="submit" className="btn btn-ghost text-danger">Delete trip</button>
        </form>
      </section>
    </div>
  );
}
