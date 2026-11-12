import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTrip, reportTrip } from "@/app/(app)/actions";
import { requireUser } from "@/lib/auth";
import { chfRate, FX_SOURCE } from "@/lib/fx";
import { HOLIDAY_SOURCE } from "@/lib/holidays";
import { BUDGET_PARTS, SLOTS } from "@/lib/planner/options";
import { createClient } from "@/lib/supabase/server";
import { f } from "@/lib/i18n/config";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("trip");

type Activity = {
  id: string; trip_day_id: string; slot: string; position: number; name: string;
  category: string | null; description: string | null; duration_minutes: number | null;
  cost: number | null; price_type: string; verified: boolean;
  latitude: number | null; longitude: number | null;
};


export default async function TripPage({ params, searchParams }: PageProps<"/trips/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { t: all, date: fmtDate, number } = await getI18n();
  const t = all.trip;
  const date = (iso: string | null) => fmtDate(iso, { weekday: "short", day: "numeric", month: "short" });

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

  const money = (n: number) => `${trip.currency} ${number(n)}`;
  const breakdown = (trip.budget_breakdown ?? {}) as Record<string, number>;
  const total = BUDGET_PARTS.reduce((sum, [k]) => sum + (Number(breakdown[k]) || 0), 0);
  const biggest = Math.max(1, ...BUDGET_PARTS.map(([k]) => Number(breakdown[k]) || 0));
  const saved = (trip.input ?? {}) as {
    tips?: string[];
    stops?: { place: string; from: string; to: string }[];
    departure?: { code: string; reason: string } | null;
    airports?: { code: string; name: string; country: string; km: number }[];
    holidays?: { name: string; start: string; end: string; varies: boolean; kind: "school" | "public" }[];
    homeCanton?: string;
  };
  const airports = Array.isArray(saved.airports) ? saved.airports : [];
  const holidays = Array.isArray(saved.holidays) ? saved.holidays : [];
  const departure = saved.departure ?? null;
  const fx = trip.currency !== "CHF" ? await chfRate(trip.currency) : null;
  const tips = (saved.tips ?? []).slice(0, 4);
  const stops = Array.isArray(saved.stops) ? saved.stops : [];
  const budget = trip.budget_total ? Number(trip.budget_total) : null;
  const catLabel = (c: string | null) => (c ? (all.client.options.interests as Record<string, string>)[c] : undefined);

  return (
    <div className="flex flex-col gap-8">
      {query.notice === "reported" ? (
        <p className="notice notice-ok">{t.reported}</p>
      ) : null}

      <header className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-muted">
            {trip.destination} · {date(trip.start_date)} {t.to} {date(trip.end_date)} · {trip.travelers}{" "}
            {trip.travelers === 1 ? t.travellerOne : t.travellerOther}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-5xl">{trip.title}</h1>
          {trip.summary ? <p className="mt-3 max-w-3xl text-lg text-muted">{trip.summary}</p> : null}
          {stops.length ? (
            <p className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{t.route}</span>
              {stops.map((st) => (
                <span key={st.place + st.from} className="pill">
                  {st.place} · {date(st.from)} {t.to} {date(st.to)}
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <aside className="card">
          <p className="text-sm text-muted">{t.estimatedTotal}</p>
          <p className="font-display text-3xl font-extrabold tabular-nums">{money(total)}</p>
          {fx ? (
            <p className="text-sm text-muted tabular-nums">
              {f(t.fx, { chf: number(total * fx.chfPerUnit), date: fmtDate(fx.date), cur: trip.currency, rate: fx.chfPerUnit.toFixed(4) })}{" "}
              <a href={FX_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{FX_SOURCE.name}</a>
              {t.fxFees}
            </p>
          ) : null}
          {budget ? (
            <p className="mt-1 text-sm">
              {total <= budget
                ? f(t.under, { diff: money(budget - total), budget: money(budget) })
                : f(t.over, { diff: money(total - budget), budget: money(budget) })}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted">{t.savedNote}</p>
        </aside>
      </header>

      {airports.length || holidays.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {airports.length ? (
            <article className="card">
              <h2 className="text-xl font-bold">{t.gettingThere}</h2>
              {departure ? (
                <p className="mt-2">
                  <span className="pill pill-signal mr-2">{f(t.suggested, { code: departure.code })}</span>
                  {departure.reason}
                </p>
              ) : null}
              <ul className="mt-3 flex flex-wrap gap-2">
                {airports.map((a) => (
                  <li key={a.code} className="pill">
                    <span className="font-bold">{a.code}</span> {a.name} · {a.km} km
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted">{t.airportsNote}</p>
            </article>
          ) : null}
          {holidays.length ? (
            <article className="card">
              <h2 className="text-xl font-bold">{t.holidaysTitle}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {holidays.map((h) => (
                  <li key={h.kind + h.name + h.start} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-0">
                    <span>
                      <span className="pill mr-2">{h.kind === "school" ? t.school : t.public}</span>
                      {h.name}
                    </span>
                    <span className="text-sm text-muted">
                      {date(h.start)}{h.end !== h.start ? ` ${t.to} ${date(h.end)}` : ""}
                      {h.varies ? ` · ${t.varies}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted">
                {t.holidaysFrom}{" "}
                <a href={HOLIDAY_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{HOLIDAY_SOURCE.name}</a>.
                {t.holidaysNote}
              </p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-5">
        {(days ?? []).map((d) => {
          const todays = activities.filter((a) => a.trip_day_id === d.id);
          const dayCost = todays.reduce((s, a) => s + (Number(a.cost) || 0), 0);
          return (
            <article key={d.id} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-extrabold">
                  <span className="text-brand">{f(t.day, { n: d.day_number })}</span>
                  {d.theme ? ` · ${d.theme}` : ""}
                </h2>
                <p className="text-sm text-muted">
                  {date(d.day_date)} · {f(t.est, { amount: money(dayCost) })}
                </p>
              </div>
              <div className="mt-4 grid gap-x-8 gap-y-5 lg:grid-cols-2">
                {SLOTS.map(([slot]) => {
                  const slotLabel = (t.slots as Record<string, string>)[slot] ?? slot;
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
                                {a.cost ? f(t.est, { amount: money(Number(a.cost)) }) : t.free}
                              </span>
                              {a.verified ? null : <span className="pill">{t.notVerified}</span>}
                              {a.latitude !== null && a.longitude !== null ? (
                                <a className="pill underline" target="_blank" rel="noreferrer"
                                  href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=16/${a.latitude}/${a.longitude}`}>
                                  {t.openMap}
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
                  <span className="font-semibold text-ink">{t.gettingAround} </span>{d.transit_notes}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-bold">{t.budgetTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.budgetLead}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {BUDGET_PARTS.map(([k]) => {
              const name = (t.budgetParts as Record<string, string>)[k] ?? k;
              const value = Number(breakdown[k]) || 0;
              return (
                <li key={k}>
                  <div className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="tabular-nums">{f(t.est, { amount: money(value) })}</span>
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
          <h2 className="text-xl font-bold">{t.tipsTitle}</h2>
          {tips.length ? (
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
              {tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          ) : (
            <p className="mt-2 text-muted">{t.noTips}</p>
          )}
          <p className="mt-4 text-sm text-muted">{t.comingNext}</p>
        </article>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link href="/plan" className="btn btn-primary">{t.another}</Link>
        <Link href="/dashboard" className="btn btn-ghost">{t.allTrips}</Link>
        <form action={reportTrip}>
          <input type="hidden" name="trip_id" value={trip.id} />
          <button type="submit" className="btn btn-ghost">{t.report}</button>
        </form>
        <form action={deleteTrip}>
          <input type="hidden" name="trip_id" value={trip.id} />
          <button type="submit" className="btn btn-ghost text-danger">{t.delete}</button>
        </form>
      </section>
    </div>
  );
}
