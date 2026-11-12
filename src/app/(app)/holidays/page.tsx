import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { addDays, findBridges, findWindows, type FinderMode, type Window } from "@/lib/holiday-finder";
import { getHolidays, HOLIDAY_SOURCE } from "@/lib/holidays";
import { CANTONS, cantonByCode } from "@/lib/swiss";

export const metadata: Metadata = { title: "Holiday finder" };

const MIN_DAYS = 2;
const MAX_DAYS = 21;
const MAX_RANGE_DAYS = 548; // about 18 months

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const fmt = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-CH", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

function WindowCard({ w, mode }: { w: Window; mode: FinderMode }) {
  return (
    <li className="card flex flex-col gap-3">
      <div>
        <p className="font-display text-lg font-bold">{fmt(w.start)}</p>
        <p className="text-sm text-muted">to {fmt(w.end)} · {w.days} days</p>
      </div>
      <p className="flex flex-wrap gap-1.5">
        <span className="pill pill-signal">
          {w.leaveDays === 0 ? "No days of leave" : `${w.leaveDays} ${w.leaveDays === 1 ? "day" : "days"} of leave`}
        </span>
        {mode === "family" ? (
          <span className="pill">No school days missed</span>
        ) : w.schoolHolidayDays === 0 ? (
          <span className="pill">Outside school holidays</span>
        ) : (
          <span className="pill">{w.schoolHolidayDays} days in school holidays</span>
        )}
      </p>
      {w.schoolHoliday ? (
        <p className="text-sm">
          During: <span className="font-semibold">{w.schoolHoliday}</span>
          {w.varies ? <span className="text-muted"> (dates vary by municipality, check your school)</span> : null}
        </p>
      ) : null}
      {w.publicHolidays.length ? (
        <p className="text-sm">Public holidays included: {w.publicHolidays.join(", ")}</p>
      ) : null}
      <Link href={`/plan?start=${w.start}&end=${w.end}`} className="btn btn-ghost mt-auto sm:w-fit">
        Plan a trip on these dates
      </Link>
    </li>
  );
}

export default async function HolidayFinderPage({ searchParams }: PageProps<"/holidays">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const q = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const canton = cantonByCode(one(q.canton) || profile?.home_canton);
  const mode: FinderMode = one(q.mode) === "family" ? "family" : "work";
  const days = Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.round(Number(one(q.days)) || 7)));
  let from = isDate(one(q.from)) ? one(q.from) : today;
  if (from < today) from = today;
  let to = isDate(one(q.to)) ? one(q.to) : addDays(from, 365);
  if (to > addDays(from, MAX_RANGE_DAYS)) to = addDays(from, MAX_RANGE_DAYS);
  const submitted = Boolean(one(q.canton));

  let error = "";
  let windows: Window[] = [];
  let bridges: ReturnType<typeof findBridges> = [];
  if (submitted) {
    if (!canton) error = "Choose your canton.";
    else if (to < addDays(from, days - 1)) error = `The period must be at least ${days} days long.`;
    else {
      const holidays = await getHolidays(canton.code, from, to);
      if (!holidays) {
        error = "The holiday calendar could not be loaded right now. Please try again in a minute.";
      } else {
        const school = holidays.filter((h) => h.kind === "school");
        const publicDays = holidays.filter((h) => h.kind === "public");
        windows = findWindows({ from, to, days, mode, school, publicDays });
        bridges = findBridges(publicDays, from, to);
        if (mode === "family" && school.length === 0)
          error = `No school holidays for ${canton.name} were found in this period. The calendar may be incomplete.`;
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Holiday finder</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Find the best dates for your trip from your canton&apos;s school holidays, public
          holidays and weekends. Families see dates that fit the school holidays. Everyone else
          sees dates that need the fewest days of leave.
        </p>
      </div>

      <form method="get" className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="field">
          <label htmlFor="hf-canton">Your canton</label>
          <select id="hf-canton" name="canton" className="input" required defaultValue={canton?.code ?? ""}>
            <option value="" disabled>Choose…</option>
            {CANTONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hf-days">Trip length in days</label>
          <input id="hf-days" name="days" type="number" min={MIN_DAYS} max={MAX_DAYS} inputMode="numeric"
            className="input" defaultValue={days} />
        </div>
        <div className="field">
          <label htmlFor="hf-from">Earliest start</label>
          <input id="hf-from" name="from" type="date" min={today} className="input" defaultValue={from} />
        </div>
        <div className="field">
          <label htmlFor="hf-to">Latest return</label>
          <input id="hf-to" name="to" type="date" min={today} className="input" defaultValue={to} />
        </div>
        <fieldset className="field md:col-span-2 lg:col-span-4">
          <legend className="label mb-1.5">Who is it for</legend>
          <div className="flex flex-wrap gap-2">
            <label className="chip">
              <input type="radio" name="mode" value="work" defaultChecked={mode === "work"} className="sr-only" />
              <span>Working</span>
            </label>
            <label className="chip">
              <input type="radio" name="mode" value="family" defaultChecked={mode === "family"} className="sr-only" />
              <span>School children</span>
            </label>
          </div>
        </fieldset>
        <div className="md:col-span-2 lg:col-span-4">
          <button type="submit" className="btn btn-primary sm:w-fit">Find dates</button>
        </div>
      </form>

      {error ? <p className="notice notice-error">{error}</p> : null}

      {submitted && !error && canton ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-extrabold">
              Best {days}-day trips from {canton.name}
            </h2>
            {windows.length ? (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {windows.map((w) => <WindowCard key={w.start} w={w} mode={mode} />)}
              </ul>
            ) : (
              <p className="notice">
                No {days}-day trip fits completely into the school holidays in this period. Try a
                shorter trip or a longer period.
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="text-xl font-bold">Long weekends</h2>
            {bridges.length ? (
              <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {bridges.map((b) => (
                  <li key={b.start} className="border-t border-line pt-3">
                    <p className="font-semibold">{b.holiday}</p>
                    <p className="text-sm text-muted">{fmt(b.start)} to {fmt(b.end)}</p>
                    <p className="mt-1 text-sm">
                      {b.daysOff} days off{" "}
                      {b.leaveDays === 0 ? "without taking leave" : `for ${b.leaveDays} bridge day`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted">No long weekends in this period.</p>
            )}
          </section>

          <p className="hint">
            School and public holidays from the{" "}
            <a href={HOLIDAY_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{HOLIDAY_SOURCE.name}</a>.
            The calendar can be incomplete, and school holidays can differ between municipalities.
            Check your school&apos;s calendar and your employer&apos;s holidays before booking.
            Jovia does not have live prices yet, so it cannot say which dates are cheaper. Travel
            demand is often highest during school holidays.
          </p>
        </>
      ) : null}
    </div>
  );
}
