import { ConnectionList } from "@/components/connection-list";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { cantonByCode } from "@/lib/swiss";
import { AIRPORT_STATIONS, connections, findAddress, findStation, TIMETABLE_SOURCE, type Station } from "@/lib/timetable";

type Props = {
  tripId: string;
  destination: string;
  startDate: string;
  endDate: string;
  origin: string;
  /** Street address for door-to-door connections; optional. */
  address: string;
  homeCanton: string;
  departure: string | null;
  stops: { place: string; from: string; to: string }[];
  outTime: string;
  returnTime: string;
};

/**
 * Real connections: home → departure airport (or straight to the destination by train),
 * between stops, and back home. Data from the Swiss timetable; nothing is guessed.
 */
export async function TripTravel(p: Props) {
  const { t: all } = await getI18n();
  const t = all.trip.travel;

  const canton = cantonByCode(p.homeCanton);
  const home: Station | null =
    (p.address ? await findAddress(p.origin && !p.address.toLowerCase().includes(p.origin.toLowerCase()) ? `${p.address}, ${p.origin}` : p.address) : null) ??
    (p.origin ? await findStation(p.origin) : null) ??
    (canton ? await findStation(canton.capital) : null);
  const fromDoor = Boolean(p.address && home && !/^\d+$/.test(home.id));
  const airport = p.departure ? AIRPORT_STATIONS[p.departure] ?? null : null;
  const firstPlace = p.stops[0]?.place ?? p.destination;
  const lastPlace = p.stops[p.stops.length - 1]?.place ?? p.destination;
  // Without a flight, try the train all the way (works for Switzerland and many places nearby).
  const firstStation = airport ? null : await findStation(firstPlace);
  const lastStation = airport ? null : lastPlace === firstPlace ? firstStation : await findStation(lastPlace);

  const outTarget = airport ?? firstStation;
  const backFrom = airport ?? lastStation;
  const [outbound, inbound] = await Promise.all([
    home && outTarget ? connections(home, outTarget, p.startDate, p.outTime) : null,
    home && backFrom ? connections(backFrom, home, p.endDate, p.returnTime) : null,
  ]);

  const between = await Promise.all(
    p.stops.slice(1).map(async (stop, i) => {
      const prev = p.stops[i];
      const [a, b] = await Promise.all([findStation(prev.place), findStation(stop.place)]);
      if (!a || !b) return null;
      const r = await connections(a, b, stop.from, "09:00");
      return r ? { title: f(t.between, { from: prev.place, to: stop.place }), result: r } : null;
    }),
  );
  const legs = between.filter((x): x is NonNullable<typeof x> => x !== null);
  const airportNote = airport?.note === "nearest" ? f(t.nearest, { station: airport.name }) : undefined;

  if (!home) {
    return <p className="text-sm text-muted">{t.noHome}</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      <form method="get" className="flex flex-wrap items-end gap-3" action={`/trips/${p.tripId}#travel`}>
        <div className="field">
          <label htmlFor="tt-out">{t.outAfter}</label>
          <input id="tt-out" name="out" type="time" defaultValue={p.outTime} className="input" />
        </div>
        <div className="field">
          <label htmlFor="tt-ret">{t.retAfter}</label>
          <input id="tt-ret" name="ret" type="time" defaultValue={p.returnTime} className="input" />
        </div>
        <button type="submit" className="btn btn-ghost">{t.update}</button>
      </form>
      {airport ? <p className="text-sm text-muted">{f(t.flightHint, { code: p.departure ?? "" })}</p> : null}
      {!fromDoor ? <p className="text-sm text-muted">{t.addAddress}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {outbound ? (
          <ConnectionList title={airport ? f(t.toAirport, { airport: airport.name }) : t.outbound} result={outbound} note={airportNote} />
        ) : (
          <p className="text-sm text-muted">{airport ? f(t.noneAirport, { airport: airport.name }) : f(t.none, { place: firstPlace })}</p>
        )}
        {legs.map((l) => <ConnectionList key={l.title} title={l.title} result={l.result} />)}
        {inbound ? (
          <ConnectionList title={airport ? f(t.fromAirport, { airport: airport.name }) : t.inbound} result={inbound} note={airportNote} />
        ) : null}
      </div>

      <p className="hint">
        {t.source}{" "}
        <a href={TIMETABLE_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{TIMETABLE_SOURCE.name}</a>.{" "}
        {t.sourceNote}
      </p>
    </div>
  );
}
