import "server-only";
import { cacheLife } from "next/cache";

/**
 * Real public transport connections (times, platforms, changes) from the Swiss
 * timetable, via transport.opendata.ch (open data, no key). It covers Switzerland
 * and many connections into neighbouring countries, not the rest of the world.
 */

export const TIMETABLE_SOURCE = { name: "transport.opendata.ch (SBB timetable data)", url: "https://transport.opendata.ch" };
const BASE = "https://transport.opendata.ch/v1";

export type Station = { id: string; name: string };
export type Leg = {
  /** Train or bus label such as "IC 8" or "B 21"; null for a walk. */
  line: string | null;
  direction: string | null;
  from: string;
  fromTime: string;
  fromPlatform: string | null;
  to: string;
  toTime: string;
  toPlatform: string | null;
  walkMinutes: number | null;
};
export type Connection = {
  departure: string;
  arrival: string;
  durationMinutes: number;
  transfers: number;
  legs: Leg[];
};
export type ConnectionResult = {
  from: string;
  to: string;
  /** The date the connections are for. Differs from the asked date when that timetable is not published yet. */
  date: string;
  example: boolean;
  connections: Connection[];
};

/**
 * Station for each airport Jovia suggests. Where the timetable has no stop at the
 * airport itself, the nearest main station is used and `note` says so.
 */
export const AIRPORT_STATIONS: Record<string, Station & { note?: "nearest" }> = {
  ZRH: { id: "8503016", name: "Zürich Flughafen" },
  GVA: { id: "8501026", name: "Genève-Aéroport" },
  BSL: { id: "1402503", name: "Basel EuroAirport, Abflug" },
  BRN: { id: "8587776", name: "Bern Flughafen" },
  LUG: { id: "8505395", name: "Agno", note: "nearest" },
  MXP: { id: "8325635", name: "Malpensa Aeroporto T1" },
  FDH: { id: "8029162", name: "Friedrichshafen Stadt", note: "nearest" },
  STR: { id: "8029034", name: "Stuttgart Hbf", note: "nearest" },
  MUC: { id: "8000261", name: "München Hbf", note: "nearest" },
  LYS: { id: "8776290", name: "Lyon Saint-Exupéry TGV" },
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Local station names for place names in English, German, French and Italian, so that
 * "Lucerne", "Genf" or "Milan" find "Luzern", "Genève" and "Milano". Keys are normalised.
 */
const LOCAL_NAMES: Record<string, string> = {
  lucerne: "Luzern", lucerna: "Luzern",
  geneva: "Genève", genf: "Genève", ginevra: "Genève", geneve: "Genève",
  zurich: "Zürich HB", zurigo: "Zürich HB", zuerich: "Zürich HB",
  berne: "Bern", berna: "Bern",
  basle: "Basel SBB", bale: "Basel SBB", basilea: "Basel SBB", basel: "Basel SBB",
  neuenburg: "Neuchâtel", neuchatel: "Neuchâtel",
  sitten: "Sion", soleure: "Solothurn", soletta: "Solothurn",
  coire: "Chur", coira: "Chur",
  "st moritz": "St. Moritz", "saint moritz": "St. Moritz", "san maurizio": "St. Moritz",
  "st gallen": "St. Gallen", "saint gall": "St. Gallen", "san gallo": "St. Gallen",
  milan: "Milano Centrale", mailand: "Milano Centrale", milano: "Milano Centrale",
  turin: "Torino Porta Nuova", torino: "Torino Porta Nuova",
  venice: "Venezia Santa Lucia", venedig: "Venezia Santa Lucia", venise: "Venezia Santa Lucia", venezia: "Venezia Santa Lucia",
  florence: "Firenze S.M.N.", florenz: "Firenze S.M.N.", firenze: "Firenze S.M.N.",
  rome: "Roma Termini", rom: "Roma Termini", roma: "Roma Termini",
  munich: "München Hbf", munchen: "München Hbf", "monaco di baviera": "München Hbf",
  vienna: "Wien Hbf", wien: "Wien Hbf", vienne: "Wien Hbf",
  paris: "Paris Gare de Lyon", lyon: "Lyon Part-Dieu",
  strasbourg: "Strasbourg", strassburg: "Strasbourg",
  stuttgart: "Stuttgart Hbf", frankfurt: "Frankfurt (Main) Hbf", cologne: "Köln Hbf", koln: "Köln Hbf",
  hamburg: "Hamburg Hbf", berlin: "Berlin Hbf",
};

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`timetable ${res.status}`);
  return res.json();
}

/**
 * A station for a place name, or null. Only accepts a match whose name starts with the
 * place name and is not a local stop like "Tokyo, Lausanne" (a restaurant stop), so
 * places outside the timetable's area are not matched by accident.
 */
export async function findStation(place: string): Promise<Station | null> {
  "use cache";
  cacheLife("days");
  const raw = place.split(/[,(]/)[0].trim();
  if (!raw) return null;
  const q = LOCAL_NAMES[norm(raw)] ?? raw;
  try {
    const data = (await getJson(`${BASE}/locations?type=station&query=${encodeURIComponent(q)}`)) as {
      stations?: { id: string | null; name: string | null }[];
    };
    const want = norm(q);
    const hit = (data.stations ?? []).find((s) => {
      if (!s.id || !s.name || s.name.includes(",")) return false;
      const name = norm(s.name);
      return name === want || name.startsWith(want + " ");
    });
    return hit ? { id: hit.id!, name: hit.name! } : null;
  } catch (e) {
    console.error("Station lookup failed", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * A street address as a starting point, so connections begin at the door (walk, tram or bus
 * to the station). Returns the timetable's own spelling of the address, or null.
 */
export async function findAddress(address: string): Promise<Station | null> {
  "use cache";
  cacheLife("days");
  const q = address.trim().slice(0, 160);
  if (q.length < 5) return null;
  try {
    const data = (await getJson(`${BASE}/locations?type=address&query=${encodeURIComponent(q)}`)) as {
      stations?: { name: string | null; coordinate?: { x: number | null; y: number | null } }[];
    };
    const hit = (data.stations ?? []).find((s) => s.name && s.coordinate?.x && s.coordinate?.y);
    // Addresses have no station number; the timetable accepts the address text itself.
    return hit ? { id: hit.name!, name: hit.name! } : null;
  } catch (e) {
    console.error("Address lookup failed", e instanceof Error ? e.message : e);
    return null;
  }
}

type RawSection = {
  journey: { category?: string | null; number?: string | null; to?: string | null } | null;
  walk: { duration?: number | null } | null;
  departure: { station: { name: string }; departure: string | null; platform: string | null };
  arrival: { station: { name: string }; arrival: string | null; platform: string | null };
};
type RawConnection = {
  from: { departure: string };
  to: { arrival: string };
  duration: string;
  transfers: number;
  sections: RawSection[];
};

const minutes = (d: string) => {
  const m = /(\d+)d(\d+):(\d+)/.exec(d);
  return m ? Number(m[1]) * 1440 + Number(m[2]) * 60 + Number(m[3]) : 0;
};
const clock = (iso: string | null) => (iso ? iso.slice(11, 16) : "");

export function toConnection(c: RawConnection): Connection {
  return {
    departure: c.from.departure,
    arrival: c.to.arrival,
    durationMinutes: minutes(c.duration),
    transfers: c.transfers,
    legs: c.sections.map((s) => ({
      line: s.journey ? [s.journey.category, s.journey.number].filter(Boolean).join(" ") || null : null,
      direction: s.journey?.to ?? null,
      from: s.departure.station.name,
      fromTime: clock(s.departure.departure),
      fromPlatform: s.departure.platform || null,
      to: s.arrival.station.name,
      toTime: clock(s.arrival.arrival),
      toPlatform: s.arrival.platform || null,
      walkMinutes: s.journey ? null : Math.max(1, Math.round((s.walk?.duration ?? 0) / 60)),
    })),
  };
}

async function query(from: string, to: string, date: string, time: string, arrive: boolean) {
  "use cache";
  cacheLife("hours");
  const qs = new URLSearchParams({ from, to, date, time, limit: "3" });
  if (arrive) qs.set("isArrivalTime", "1");
  const data = (await getJson(`${BASE}/connections?${qs}`)) as { connections?: RawConnection[] };
  return (data.connections ?? []).map(toConnection);
}

const DAY = 86_400_000;

/**
 * Up to three connections from `from` to `to` on `date`, leaving after `time`.
 * If that day's timetable is not published yet, the same weekday about two weeks
 * from today is used instead and the result is marked as an example.
 */
export async function connections(
  from: Station,
  to: Station,
  date: string,
  time: string,
  today = new Date().toISOString().slice(0, 10),
): Promise<ConnectionResult | null> {
  if (from.id === to.id) return null;
  // Dates outside the published timetable come back as an error, not as an empty list.
  let found: Connection[] = [];
  if (date >= today) {
    try {
      found = await query(from.id, to.id, date, time, false);
    } catch {
      found = [];
    }
  }
  if (found.length) return { from: from.name, to: to.name, date, example: false, connections: found };
  try {
    // Same weekday, 14–20 days from today.
    const wanted = new Date(date + "T12:00:00Z").getUTCDay();
    let t = Date.parse(today + "T12:00:00Z") + 14 * DAY;
    while (new Date(t).getUTCDay() !== wanted) t += DAY;
    const sample = new Date(t).toISOString().slice(0, 10);
    const ex = await query(from.id, to.id, sample, time, false);
    return ex.length ? { from: from.name, to: to.name, date: sample, example: true, connections: ex } : null;
  } catch (e) {
    console.error("Connection lookup failed", e instanceof Error ? e.message : e);
    return null;
  }
}
