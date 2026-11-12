import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { addDays, findBridges, findWindows, type FinderMode, type Window } from "@/lib/holiday-finder";
import { getHolidays, HOLIDAY_SOURCE } from "@/lib/holidays";
import { cantonByCode, cantonName, cantonsFor } from "@/lib/swiss";
import { f } from "@/lib/i18n/config";
import type { Dict } from "@/lib/i18n/dictionaries";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("holidays");

const MIN_DAYS = 2;
const MAX_DAYS = 21;
const MAX_RANGE_DAYS = 548; // about 18 months

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
type Fmt = (iso: string) => string;

function WindowCard({ w, mode, t, fmt }: { w: Window; mode: FinderMode; t: Dict["holidays"]; fmt: Fmt }) {
  return (
    <li className="card flex flex-col gap-3">
      <div>
        <p className="font-display text-lg font-bold">{fmt(w.start)}</p>
        <p className="text-sm text-muted">{f(t.toDays, { date: fmt(w.end), n: w.days })}</p>
      </div>
      <p className="flex flex-wrap gap-1.5">
        <span className="pill pill-signal">
          {w.leaveDays === 0 ? t.noLeave : f(w.leaveDays === 1 ? t.leaveOne : t.leaveOther, { n: w.leaveDays })}
        </span>
        {mode === "family" ? (
          <span className="pill">{t.noSchoolMissed}</span>
        ) : w.schoolHolidayDays === 0 ? (
          <span className="pill">{t.outsideSchool}</span>
        ) : (
          <span className="pill">{f(t.inSchool, { n: w.schoolHolidayDays })}</span>
        )}
      </p>
      {w.schoolHoliday ? (
        <p className="text-sm">
          {t.during} <span className="font-semibold">{w.schoolHoliday}</span>
          {w.varies ? <span className="text-muted"> {t.variesNote}</span> : null}
        </p>
      ) : null}
      {w.publicHolidays.length ? (
        <p className="text-sm">{f(t.publicIncluded, { list: w.publicHolidays.join(", ") })}</p>
      ) : null}
      <Link href={`/plan?start=${w.start}&end=${w.end}`} className="btn btn-ghost mt-auto sm:w-fit">
        {t.planOnDates}
      </Link>
    </li>
  );
}

export default async function HolidayFinderPage({ searchParams }: PageProps<"/holidays">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const q = await searchParams;
  const { t: all, locale, date } = await getI18n();
  const t = all.holidays;
  const fmt: Fmt = (iso) => date(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

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
    if (!canton) error = t.errors.canton;
    else if (to < addDays(from, days - 1)) error = f(t.errors.period, { n: days });
    else {
      const holidays = await getHolidays(canton.code, from, to, locale);
      if (!holidays) {
        error = t.errors.unavailable;
      } else {
        const school = holidays.filter((h) => h.kind === "school");
        const publicDays = holidays.filter((h) => h.kind === "public");
        windows = findWindows({ from, to, days, mode, school, publicDays });
        bridges = findBridges(publicDays, from, to);
        if (mode === "family" && school.length === 0)
          error = f(t.errors.noSchool, { canton: cantonName(canton.code, locale) });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-3xl text-muted">{t.lead}</p>
      </div>

      <form method="get" className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="field">
          <label htmlFor="hf-canton">{t.canton}</label>
          <select id="hf-canton" name="canton" className="input" required defaultValue={canton?.code ?? ""}>
            <option value="" disabled>{t.choose}</option>
            {cantonsFor(locale).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hf-days">{t.length}</label>
          <input id="hf-days" name="days" type="number" min={MIN_DAYS} max={MAX_DAYS} inputMode="numeric"
            className="input" defaultValue={days} />
        </div>
        <div className="field">
          <label htmlFor="hf-from">{t.earliest}</label>
          <input id="hf-from" name="from" type="date" min={today} className="input" defaultValue={from} />
        </div>
        <div className="field">
          <label htmlFor="hf-to">{t.latest}</label>
          <input id="hf-to" name="to" type="date" min={today} className="input" defaultValue={to} />
        </div>
        <fieldset className="field md:col-span-2 lg:col-span-4">
          <legend className="label mb-1.5">{t.forWhom}</legend>
          <div className="flex flex-wrap gap-2">
            <label className="chip">
              <input type="radio" name="mode" value="work" defaultChecked={mode === "work"} className="sr-only" />
              <span>{t.working}</span>
            </label>
            <label className="chip">
              <input type="radio" name="mode" value="family" defaultChecked={mode === "family"} className="sr-only" />
              <span>{t.schoolChildren}</span>
            </label>
          </div>
        </fieldset>
        <div className="md:col-span-2 lg:col-span-4">
          <button type="submit" className="btn btn-primary sm:w-fit">{t.find}</button>
        </div>
      </form>

      {error ? <p className="notice notice-error">{error}</p> : null}

      {submitted && !error && canton ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-extrabold">
              {f(t.best, { n: days, canton: cantonName(canton.code, locale) })}
            </h2>
            {windows.length ? (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {windows.map((w) => <WindowCard key={w.start} w={w} mode={mode} t={t} fmt={fmt} />)}
              </ul>
            ) : (
              <p className="notice">{f(t.none, { n: days })}</p>
            )}
          </section>

          <section className="card">
            <h2 className="text-xl font-bold">{t.longWeekends}</h2>
            {bridges.length ? (
              <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {bridges.map((b) => (
                  <li key={b.start} className="border-t border-line pt-3">
                    <p className="font-semibold">{b.holiday}</p>
                    <p className="text-sm text-muted">{fmt(b.start)} {t.to} {fmt(b.end)}</p>
                    <p className="mt-1 text-sm">
                      {f(t.daysOff, { n: b.daysOff })}{" "}
                      {b.leaveDays === 0 ? t.withoutLeave : f(t.bridge, { n: b.leaveDays })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-muted">{t.noLongWeekends}</p>
            )}
          </section>

          <p className="hint">
            {t.sourceFrom}{" "}
            <a href={HOLIDAY_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{HOLIDAY_SOURCE.name}</a>.
            {t.sourceNote}
          </p>
        </>
      ) : null}
    </div>
  );
}
