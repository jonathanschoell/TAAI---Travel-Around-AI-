import { CURRENCIES } from "@/lib/options";
import { f } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/en";
import { cantonByCode } from "@/lib/swiss";
import {
  INTERESTS,
  LEVELS,
  LODGING,
  MAX_STOPS,
  MAX_TRAVELLERS,
  MAX_TRIP_DAYS,
  PACES,
  PARTY_TYPES,
  TRAVEL_MODES,
  type TripInput,
} from "@/lib/planner/options";

const DAY = 24 * 60 * 60 * 1000;
const pick = (pairs: [string, string][], v: string, fallback: string) =>
  pairs.some(([k]) => k === v) ? v : fallback;

/** Checks the planner form and turns it into a clean trip request. */
export function parseTripForm(
  fd: FormData,
  e: typeof en.plan.errors = en.plan.errors,
): { input?: TripInput; error?: string } {
  const s = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const destination = s("destination", 120);
  const startDate = s("start_date", 10);
  const endDate = s("end_date", 10);
  if (!destination) return { error: e.destination };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
    return { error: e.dates };
  const start = Date.parse(startDate + "T00:00:00Z");
  const end = Date.parse(endDate + "T00:00:00Z");
  if (Number.isNaN(start) || Number.isNaN(end) || end < start)
    return { error: e.endBeforeStart };
  const days = Math.round((end - start) / DAY) + 1;
  if (days > MAX_TRIP_DAYS)
    return { error: f(e.tooLong, { n: MAX_TRIP_DAYS }) };

  const party = pick(PARTY_TYPES, s("party"), "couple");
  const rawAges = fd.getAll("ages").map((x) => String(x).trim()).slice(0, MAX_TRAVELLERS);
  let ages: (number | null)[] = rawAges.map((x) => (x === "" ? null : Number(x)));
  if (ages.some((x) => x !== null && (!Number.isInteger(x) || x < 0 || x > 120)))
    return { error: e.ages };
  if (party === "solo") ages = [ages[0] ?? null];
  else if (party === "couple") ages = [ages[0] ?? null, ages[1] ?? null];
  else {
    if (ages.length < 2) return { error: e.groupSize };
    if (ages.some((x) => x === null)) return { error: e.everyAge };
    if (!ages.some((x) => x !== null && x >= 18))
      return { error: e.adult };
  }
  const travelers = ages.length;

  const places = fd.getAll("stop_place").map((x) => String(x).trim().slice(0, 80));
  const froms = fd.getAll("stop_from").map(String);
  const tos = fd.getAll("stop_to").map(String);
  const stops: TripInput["stops"] = [];
  for (let i = 0; i < Math.min(places.length, MAX_STOPS); i++) {
    const place = places[i];
    const from = froms[i] ?? "";
    const to = tos[i] ?? "";
    if (!place && !from && !to) continue;
    if (!place) return { error: f(e.stopPlace, { n: i + 1 }) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
      return { error: f(e.stopDates, { place }) };
    if (to < from) return { error: f(e.stopOrder, { place }) };
    if (from < startDate || to > endDate)
      return { error: f(e.stopRange, { place, start: startDate, end: endDate }) };
    stops.push({ place, from, to });
  }
  stops.sort((x, y) => x.from.localeCompare(y.from));

  const budgetRaw = Number(fd.get("budget"));
  const allowed = INTERESTS.map(([k]) => k);
  return {
    input: {
      destination,
      origin: s("origin", 120),
      homeCanton: cantonByCode(s("home_canton", 2))?.code ?? "",
      homeCoords: coords(fd),
      startDate,
      endDate,
      days,
      travelers,
      party,
      ages,
      stops,
      interests: fd.getAll("interests").map(String).filter((i) => allowed.includes(i)),
      budget: Number.isFinite(budgetRaw) && budgetRaw > 0 ? Math.round(budgetRaw) : null,
      currency: CURRENCIES.includes(s("currency")) ? s("currency") : "CHF",
      travelMode: pick(TRAVEL_MODES, s("travel_mode"), "any"),
      lodging: pick(LODGING, s("lodging"), "any"),
      level: pick(LEVELS, s("level"), "mid"),
      pace: pick(PACES, s("pace"), "balanced"),
      wishes: s("wishes", 600),
      constraints: s("constraints", 600),
    },
  };
}


/** Optional device location, only if both values are valid coordinates. */
function coords(fd: FormData): { lat: number; lng: number } | null {
  const lat = Number(fd.get("home_lat"));
  const lng = Number(fd.get("home_lng"));
  if (!fd.get("home_lat") || !fd.get("home_lng")) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
}
