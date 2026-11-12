import "server-only";

/**
 * Swiss school and public holidays from the OpenHolidays API (openholidaysapi.org),
 * a free open-data service. School holidays can differ between municipalities and
 * school types within a canton; those variants are merged into one date range here.
 */

export const HOLIDAY_SOURCE = { name: "OpenHolidays API", url: "https://www.openholidaysapi.org" };

const BASE = "https://openholidaysapi.org";
const TTL_MS = 12 * 60 * 60 * 1000;
const memo = new Map<string, { at: number; data: RawHoliday[] }>();

type RawHoliday = {
  startDate: string;
  endDate: string;
  type?: string;
  nationwide?: boolean;
  name?: { language: string; text: string }[];
};

export type Holiday = {
  name: string;
  start: string;
  end: string;
  /** True when the dates differ between municipalities or school types in the canton. */
  varies: boolean;
  kind: "school" | "public";
};

async function load(path: "SchoolHolidays" | "PublicHolidays", canton: string, from: string, to: string, lang: string) {
  const qs = new URLSearchParams({
    countryIsoCode: "CH",
    languageIsoCode: lang,
    validFrom: from,
    validTo: to,
    subdivisionCode: `CH-${canton}`,
  });
  const url = `${BASE}/${path}?${qs}`;
  const hit = memo.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`OpenHolidays ${res.status}`);
  const data = (await res.json()) as RawHoliday[];
  if (!Array.isArray(data)) throw new Error("Unexpected holiday data");
  memo.set(url, { at: Date.now(), data });
  return data;
}

const nameOf = (h: RawHoliday, lang: string) =>
  h.name?.find((n) => n.language === lang)?.text ?? h.name?.find((n) => n.language === "EN")?.text ?? h.name?.[0]?.text ?? "—";
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Merges variants of the same holiday (different school groups) that overlap in time. */
export function mergeHolidays(raw: RawHoliday[], kind: Holiday["kind"], lang = "EN"): Holiday[] {
  const out: Holiday[] = [];
  for (const h of raw) {
    if (!isDate(h.startDate) || !isDate(h.endDate)) continue;
    if (kind === "public" && h.type !== "Public") continue;
    const name = nameOf(h, lang);
    const same = out.find((o) => o.name === name && h.startDate <= o.end && h.endDate >= o.start);
    if (same) {
      if (same.start !== h.startDate || same.end !== h.endDate) same.varies = true;
      if (h.startDate < same.start) same.start = h.startDate;
      if (h.endDate > same.end) same.end = h.endDate;
    } else {
      out.push({ name, start: h.startDate, end: h.endDate, varies: false, kind });
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/** School and public holidays in a canton between two dates. Returns null if the service is unavailable. */
export async function getHolidays(canton: string, from: string, to: string, locale = "en"): Promise<Holiday[] | null> {
  if (!/^[A-Z]{2}$/.test(canton)) return null;
  const lang = ["en", "de", "fr", "it"].includes(locale) ? locale.toUpperCase() : "EN";
  try {
    const [school, publicDays] = await Promise.all([
      load("SchoolHolidays", canton, from, to, lang),
      load("PublicHolidays", canton, from, to, lang),
    ]);
    return [...mergeHolidays(school, "school", lang), ...mergeHolidays(publicDays, "public", lang)].sort((a, b) =>
      a.start.localeCompare(b.start),
    );
  } catch (e) {
    console.error("Holiday lookup failed", e);
    return null;
  }
}

/** School holidays from today for the next twelve months. */
export async function getUpcomingSchoolHolidays(canton: string, locale = "en") {
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 365 * 86400000).toISOString().slice(0, 10);
  return (await getHolidays(canton, from, to, locale))?.filter((h) => h.kind === "school") ?? null;
}
