/**
 * Swiss reference data: cantons and the airports Swiss travellers usually fly from.
 * Coordinates are approximate (canton capital, airport terminal) and only used to rank
 * airports by straight-line distance. They are not travel times.
 */

export type Canton = { code: string; name: string; capital: string; lat: number; lng: number };

export const CANTONS: Canton[] = [
  { code: "AG", name: "Aargau", capital: "Aarau", lat: 47.3925, lng: 8.0444 },
  { code: "AI", name: "Appenzell Innerrhoden", capital: "Appenzell", lat: 47.331, lng: 9.409 },
  { code: "AR", name: "Appenzell Ausserrhoden", capital: "Herisau", lat: 47.386, lng: 9.279 },
  { code: "BE", name: "Bern", capital: "Bern", lat: 46.948, lng: 7.4474 },
  { code: "BL", name: "Basel-Landschaft", capital: "Liestal", lat: 47.484, lng: 7.734 },
  { code: "BS", name: "Basel-Stadt", capital: "Basel", lat: 47.5596, lng: 7.5886 },
  { code: "FR", name: "Fribourg", capital: "Fribourg", lat: 46.8065, lng: 7.1619 },
  { code: "GE", name: "Geneva", capital: "Geneva", lat: 46.2044, lng: 6.1432 },
  { code: "GL", name: "Glarus", capital: "Glarus", lat: 47.0405, lng: 9.068 },
  { code: "GR", name: "Graubünden", capital: "Chur", lat: 46.8508, lng: 9.532 },
  { code: "JU", name: "Jura", capital: "Delémont", lat: 47.3649, lng: 7.3445 },
  { code: "LU", name: "Lucerne", capital: "Lucerne", lat: 47.0502, lng: 8.3093 },
  { code: "NE", name: "Neuchâtel", capital: "Neuchâtel", lat: 46.99, lng: 6.9293 },
  { code: "NW", name: "Nidwalden", capital: "Stans", lat: 46.958, lng: 8.366 },
  { code: "OW", name: "Obwalden", capital: "Sarnen", lat: 46.896, lng: 8.246 },
  { code: "SG", name: "St. Gallen", capital: "St. Gallen", lat: 47.4245, lng: 9.3767 },
  { code: "SH", name: "Schaffhausen", capital: "Schaffhausen", lat: 47.697, lng: 8.634 },
  { code: "SO", name: "Solothurn", capital: "Solothurn", lat: 47.2088, lng: 7.5323 },
  { code: "SZ", name: "Schwyz", capital: "Schwyz", lat: 47.0207, lng: 8.653 },
  { code: "TG", name: "Thurgau", capital: "Frauenfeld", lat: 47.5536, lng: 8.8987 },
  { code: "TI", name: "Ticino", capital: "Bellinzona", lat: 46.1946, lng: 9.0244 },
  { code: "UR", name: "Uri", capital: "Altdorf", lat: 46.8805, lng: 8.644 },
  { code: "VD", name: "Vaud", capital: "Lausanne", lat: 46.5197, lng: 6.6323 },
  { code: "VS", name: "Valais", capital: "Sion", lat: 46.2331, lng: 7.3606 },
  { code: "ZG", name: "Zug", capital: "Zug", lat: 47.1662, lng: 8.5155 },
  { code: "ZH", name: "Zurich", capital: "Zurich", lat: 47.3769, lng: 8.5417 },
];

export type Airport = { code: string; name: string; country: string; lat: number; lng: number };

export const AIRPORTS: Airport[] = [
  { code: "ZRH", name: "Zurich", country: "Switzerland", lat: 47.4647, lng: 8.5492 },
  { code: "GVA", name: "Geneva", country: "Switzerland", lat: 46.2381, lng: 6.109 },
  { code: "BSL", name: "Basel-Mulhouse (EuroAirport)", country: "France/Switzerland", lat: 47.5896, lng: 7.5299 },
  { code: "BRN", name: "Bern", country: "Switzerland", lat: 46.9141, lng: 7.4971 },
  { code: "LUG", name: "Lugano", country: "Switzerland", lat: 46.004, lng: 8.9106 },
  { code: "MXP", name: "Milan Malpensa", country: "Italy", lat: 45.6306, lng: 8.7281 },
  { code: "FDH", name: "Friedrichshafen", country: "Germany", lat: 47.6713, lng: 9.5115 },
  { code: "STR", name: "Stuttgart", country: "Germany", lat: 48.6899, lng: 9.222 },
  { code: "MUC", name: "Munich", country: "Germany", lat: 48.3538, lng: 11.7861 },
  { code: "LYS", name: "Lyon", country: "France", lat: 45.7256, lng: 5.0811 },
];

export const cantonByCode = (code: string | null | undefined) =>
  CANTONS.find((c) => c.code === code) ?? null;

/** Great-circle distance in kilometres. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export type NearbyAirport = { code: string; name: string; country: string; km: number };

/** Airports sorted by straight-line distance from a point. */
export function nearestAirports(lat: number, lng: number, count = 4): NearbyAirport[] {
  return AIRPORTS.map((a) => ({
    code: a.code,
    name: a.name,
    country: a.country,
    km: Math.round(distanceKm(lat, lng, a.lat, a.lng)),
  }))
    .sort((x, y) => x.km - y.km)
    .slice(0, count);
}

/** Canton names in each site language; English uses the names in CANTONS. */
const CANTON_NAMES: Record<"de" | "fr" | "it", Record<string, string>> = {
  de: { AG: "Aargau", AI: "Appenzell Innerrhoden", AR: "Appenzell Ausserrhoden", BE: "Bern", BL: "Basel-Landschaft", BS: "Basel-Stadt", FR: "Freiburg", GE: "Genf", GL: "Glarus", GR: "Graubünden", JU: "Jura", LU: "Luzern", NE: "Neuenburg", NW: "Nidwalden", OW: "Obwalden", SG: "St. Gallen", SH: "Schaffhausen", SO: "Solothurn", SZ: "Schwyz", TG: "Thurgau", TI: "Tessin", UR: "Uri", VD: "Waadt", VS: "Wallis", ZG: "Zug", ZH: "Zürich" },
  fr: { AG: "Argovie", AI: "Appenzell Rhodes-Intérieures", AR: "Appenzell Rhodes-Extérieures", BE: "Berne", BL: "Bâle-Campagne", BS: "Bâle-Ville", FR: "Fribourg", GE: "Genève", GL: "Glaris", GR: "Grisons", JU: "Jura", LU: "Lucerne", NE: "Neuchâtel", NW: "Nidwald", OW: "Obwald", SG: "Saint-Gall", SH: "Schaffhouse", SO: "Soleure", SZ: "Schwytz", TG: "Thurgovie", TI: "Tessin", UR: "Uri", VD: "Vaud", VS: "Valais", ZG: "Zoug", ZH: "Zurich" },
  it: { AG: "Argovia", AI: "Appenzello Interno", AR: "Appenzello Esterno", BE: "Berna", BL: "Basilea Campagna", BS: "Basilea Città", FR: "Friburgo", GE: "Ginevra", GL: "Glarona", GR: "Grigioni", JU: "Giura", LU: "Lucerna", NE: "Neuchâtel", NW: "Nidvaldo", OW: "Obvaldo", SG: "San Gallo", SH: "Sciaffusa", SO: "Soletta", SZ: "Svitto", TG: "Turgovia", TI: "Ticino", UR: "Uri", VD: "Vaud", VS: "Vallese", ZG: "Zugo", ZH: "Zurigo" },
};

export function cantonName(code: string, locale: string) {
  const local = locale === "de" || locale === "fr" || locale === "it" ? CANTON_NAMES[locale][code] : undefined;
  return local ?? cantonByCode(code)?.name ?? code;
}

/** Cantons sorted by their name in the given language. */
export function cantonsFor(locale: string) {
  return CANTONS.map((c) => ({ ...c, name: cantonName(c.code, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale));
}
