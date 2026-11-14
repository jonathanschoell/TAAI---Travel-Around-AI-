import "server-only";

/**
 * Search links to booking sites, pre-filled with the trip's place, dates and travellers.
 * Jovia does not see prices or availability: the person searches and books on the
 * provider's site. Partner IDs, once there are partner agreements, come from env vars:
 *   BOOKING_AFFILIATE_ID   → Booking.com "aid"
 *   GETYOURGUIDE_PARTNER_ID → GetYourGuide "partner_id"
 */

export type BookingLink = {
  kind: "flights" | "hotels" | "activities";
  provider: string;
  /** Place the link is about (hotel stop, activity city, flight destination). */
  place: string;
  from: string;
  to: string;
  url: string;
  /** True when the link carries a partner ID (commission possible). */
  partner: boolean;
};

type Trip = {
  destination: string;
  startDate: string;
  endDate: string;
  ages: (number | null)[];
  travelers: number;
  currency: string;
  stops: { place: string; from: string; to: string }[];
  departure: string | null;
};

const DAY = 86_400_000;
const nextDay = (iso: string) => new Date(Date.parse(iso + "T00:00:00Z") + DAY).toISOString().slice(0, 10);
const env = (k: string) => process.env[k]?.trim() || "";

/** Adults and child ages for hotel searches; missing ages count as adults. */
export function party(ages: (number | null)[], travelers: number) {
  const known = ages.slice(0, Math.max(travelers, 1));
  const children = known.filter((a): a is number => a !== null && a < 18);
  const adults = Math.max(1, Math.max(travelers, known.length) - children.length);
  return { adults, children };
}

export function bookingSearch(place: string, checkin: string, checkout: string, trip: Trip, locale: string) {
  const { adults, children } = party(trip.ages, trip.travelers);
  const qs = new URLSearchParams({
    ss: place,
    checkin,
    checkout: checkout > checkin ? checkout : nextDay(checkin),
    group_adults: String(adults),
    group_children: String(children.length),
    no_rooms: "1",
    selected_currency: trip.currency || "CHF",
    lang: locale === "en" ? "en-gb" : locale,
  });
  for (const age of children) qs.append("age", String(age));
  const aid = env("BOOKING_AFFILIATE_ID");
  if (aid) qs.set("aid", aid);
  return { url: `https://www.booking.com/searchresults.html?${qs}`, partner: Boolean(aid) };
}

export function flightSearch(trip: Trip, locale: string) {
  const { adults, children } = party(trip.ages, trip.travelers);
  const who = children.length
    ? ` with ${adults} ${adults === 1 ? "adult" : "adults"} and ${children.length} ${children.length === 1 ? "child" : "children"}`
    : ` with ${adults} ${adults === 1 ? "adult" : "adults"}`;
  const from = trip.departure ? ` from ${trip.departure}` : "";
  const q = `Flights to ${trip.destination}${from} on ${trip.startDate} through ${trip.endDate}${who}`;
  const qs = new URLSearchParams({ q, curr: trip.currency || "CHF", hl: locale });
  return { url: `https://www.google.com/travel/flights?${qs}`, partner: false };
}

export function activitySearch(place: string) {
  const qs = new URLSearchParams({ q: place });
  const pid = env("GETYOURGUIDE_PARTNER_ID");
  if (pid) qs.set("partner_id", pid);
  return { url: `https://www.getyourguide.com/s/?${qs}`, partner: Boolean(pid) };
}

/** All links for a trip: one flight search, one hotel search per stop (or for the whole stay), activities per place. */
export function bookingLinks(trip: Trip, locale: string): BookingLink[] {
  const legs = trip.stops.length
    ? trip.stops.map((s) => ({ place: s.place, from: s.from, to: s.to }))
    : [{ place: trip.destination, from: trip.startDate, to: trip.endDate }];
  const links: BookingLink[] = [];
  links.push({ kind: "flights", provider: "Google Flights", place: trip.destination, from: trip.startDate, to: trip.endDate, ...flightSearch(trip, locale) });
  for (const leg of legs) {
    links.push({ kind: "hotels", provider: "Booking.com", place: leg.place, from: leg.from, to: leg.to, ...bookingSearch(leg.place, leg.from, leg.to, trip, locale) });
  }
  const places = [...new Set(legs.map((l) => l.place))];
  for (const place of places) {
    const leg = legs.find((l) => l.place === place)!;
    links.push({ kind: "activities", provider: "GetYourGuide", place, from: leg.from, to: leg.to, ...activitySearch(place) });
  }
  return links;
}
