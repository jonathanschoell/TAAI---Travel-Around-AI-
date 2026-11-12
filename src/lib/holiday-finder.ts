/**
 * Smart Holiday Finder: finds good travel dates from a canton's school holidays,
 * public holidays and weekends. Pure date arithmetic, no prices: Jovia does not have
 * live fares yet, so it never claims a date is cheaper.
 */

export type Period = { name: string; start: string; end: string; varies?: boolean };

export type FinderMode = "family" | "work";

export type Window = {
  start: string;
  end: string;
  days: number;
  /** Weekdays that are not public holidays: days of leave an employee would need. */
  leaveDays: number;
  /** Weekdays outside school holidays and public holidays: school days a child would miss. */
  schoolDaysMissed: number;
  /** Days of the trip that fall into the canton's school holidays. */
  schoolHolidayDays: number;
  /** Names of the public holidays inside the window. */
  publicHolidays: string[];
  /** Name of the school holiday the window overlaps most, if any. */
  schoolHoliday: string | null;
  /** Start date of that school holiday, to tell this year's from next year's. */
  schoolHolidayStart: string | null;
  /** True when that school holiday's dates differ between municipalities. */
  varies: boolean;
};

export type Bridge = {
  holiday: string;
  date: string;
  /** Days in a row away from work, weekends included. */
  daysOff: number;
  leaveDays: number;
  start: string;
  end: string;
};

const DAY = 86400000;
const toMs = (iso: string) => Date.parse(iso + "T00:00:00Z");
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => toIso(toMs(iso) + n * DAY);
const weekday = (iso: string) => new Date(toMs(iso)).getUTCDay(); // 0 Sunday … 6 Saturday
const isWeekend = (iso: string) => {
  const d = weekday(iso);
  return d === 0 || d === 6;
};
const inside = (iso: string, p: Period) => iso >= p.start && iso <= p.end;

function describe(start: string, days: number, school: Period[], publicDays: Period[]): Window {
  const end = addDays(start, days - 1);
  let leaveDays = 0;
  let schoolDaysMissed = 0;
  let schoolHolidayDays = 0;
  const names = new Set<string>();
  const overlap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const pub = publicDays.find((p) => inside(d, p));
    const sch = school.find((p) => inside(d, p));
    if (pub) names.add(pub.name);
    if (sch) {
      schoolHolidayDays++;
      const key = `${sch.name}|${sch.start}`;
      overlap.set(key, (overlap.get(key) ?? 0) + 1);
    }
    if (!isWeekend(d) && !pub) {
      leaveDays++;
      if (!sch) schoolDaysMissed++;
    }
  }
  const mainKey = [...overlap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const [main, mainStart] = mainKey ? mainKey.split("|") : [null, null];
  return {
    start,
    end,
    days,
    leaveDays,
    schoolDaysMissed,
    schoolHolidayDays,
    publicHolidays: [...names],
    schoolHoliday: main,
    schoolHolidayStart: mainStart,
    varies: Boolean(main && school.find((p) => p.name === main && p.start === mainStart)?.varies),
  };
}

const overlaps = (a: Window, b: Window) => a.start <= b.end && b.start <= a.end;

/** Joins periods with the same name that follow each other without a gap. */
export function joinAdjacent(periods: Period[]): Period[] {
  const out: Period[] = [];
  for (const p of [...periods].sort((a, b) => a.start.localeCompare(b.start))) {
    const last = out.find((o) => o.name === p.name && p.start <= addDays(o.end, 1) && p.end >= o.start);
    if (last) {
      if (p.end > last.end) last.end = p.end;
      last.varies = Boolean(last.varies || p.varies);
    } else out.push({ ...p });
  }
  return out;
}

/**
 * The best non-overlapping windows of `days` days between `from` and `to`.
 * Family: no school days missed first, then the fewest days of leave.
 * Work: the fewest days of leave first, then as little school-holiday overlap as possible
 * (school holidays are usually the busiest travel times).
 */
export function findWindows(opts: {
  from: string;
  to: string;
  days: number;
  mode: FinderMode;
  school: Period[];
  publicDays: Period[];
  limit?: number;
}): Window[] {
  const { from, to, days, mode, publicDays, limit = 6 } = opts;
  const school = joinAdjacent(opts.school);
  const all: Window[] = [];
  for (let s = from; addDays(s, days - 1) <= to; s = addDays(s, 1)) {
    all.push(describe(s, days, school, publicDays));
  }
  const pool = mode === "family" ? all.filter((w) => w.schoolDaysMissed === 0) : all;
  pool.sort((a, b) =>
    mode === "family"
      ? a.leaveDays - b.leaveDays || a.start.localeCompare(b.start)
      : a.leaveDays - b.leaveDays || a.schoolHolidayDays - b.schoolHolidayDays || a.start.localeCompare(b.start),
  );
  // Spread the suggestions over the year: one per school holiday for families,
  // one per month for everyone else.
  const groupOf = (w: Window) => (mode === "family" ? `${w.schoolHoliday}|${w.schoolHolidayStart}` : w.start.slice(0, 7));
  const picked: Window[] = [];
  const usedGroups = new Set<string>();
  for (const w of pool) {
    if (picked.length >= limit) break;
    const g = groupOf(w);
    if (usedGroups.has(g) || picked.some((p) => overlaps(p, w))) continue;
    picked.push(w);
    usedGroups.add(g);
  }
  return picked.sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Long weekends: runs of three or more days off (weekends plus public holidays) that need
 * no leave, and runs of four or more that need a single bridge day.
 */
export function findBridges(publicDays: Period[], from: string, to: string): Bridge[] {
  const isPublic = (d: string) => publicDays.find((p) => inside(d, p));
  const isOff = (d: string) => isWeekend(d) || Boolean(isPublic(d));
  const runFrom = (d: string, step: 1 | -1) => {
    let n = 0;
    let x = d;
    while (isOff(x)) {
      n++;
      x = addDays(x, step);
    }
    return n;
  };
  const out: Bridge[] = [];
  const add = (start: string, end: string, leaveDays: number) => {
    const named: Period | undefined = (() => {
      for (let d = start; d <= end; d = addDays(d, 1)) {
        const p = isPublic(d);
        if (p) return p;
      }
      return undefined;
    })();
    if (!named || out.some((b) => b.start <= end && start <= b.end)) return;
    out.push({
      holiday: named.name,
      date: named.start,
      daysOff: Math.round((toMs(end) - toMs(start)) / DAY) + 1,
      leaveDays,
      start,
      end,
    });
  };

  // Free long weekends first, so a bridge suggestion never hides one.
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (!isOff(d) || isOff(addDays(d, -1))) continue;
    const len = runFrom(d, 1);
    if (len >= 3) add(d, addDays(d, len - 1), 0);
  }
  // Then one bridge day between two runs of days off.
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isOff(d)) continue;
    const before = runFrom(addDays(d, -1), -1);
    const after = runFrom(addDays(d, 1), 1);
    if (!before || !after || before + after + 1 < 4) continue;
    if (!isPublic(addDays(d, -1)) && !isPublic(addDays(d, 1))) continue;
    add(addDays(d, -before), addDays(d, after), 1);
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}
