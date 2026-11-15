import "server-only";
import { cacheLife } from "next/cache";

/**
 * Checks a suggested accommodation against Google Places and fetches its photos.
 * Only active when GOOGLE_PLACES_API_KEY is set (Google Cloud, "Places API (New)").
 * The key is used on the server only; photo addresses returned to the browser contain no key.
 */

export type StayPhoto = { src: string; credit: { name: string; url: string }[] };
export type StayDetails = {
  /** True when Google found this place. */
  verified: boolean;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  ratings: number | null;
  mapsUrl: string | null;
  photos: StayPhoto[];
};

const BASE = "https://places.googleapis.com/v1";

export const placesEnabled = () => Boolean(process.env["GOOGLE_PLACES_API_KEY"]?.trim());

type SearchPlace = {
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
};

const LODGING = /lodging|hotel|motel|resort|hostel|inn|guest_house|bed_and_breakfast|apartment|campground/;

/** Google's record of the accommodation with up to three photos, or null if not found or not configured. */
export async function stayDetails(name: string, area: string, place: string): Promise<StayDetails | null> {
  "use cache";
  cacheLife("hours");
  const key = process.env["GOOGLE_PLACES_API_KEY"]?.trim();
  if (!key || !name) return null;
  try {
    const res = await fetch(`${BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.photos,places.primaryType,places.types",
      },
      body: JSON.stringify({ textQuery: [name, area, place].filter(Boolean).join(", "), pageSize: 1 }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Places search ${res.status}`);
    const data = (await res.json()) as { places?: SearchPlace[] };
    const p = data.places?.[0];
    // Only accept an accommodation, so a restaurant or landmark with a similar name is not shown as the hotel.
    if (!p || !(p.types ?? [p.primaryType ?? ""]).some((t) => LODGING.test(t))) return null;

    const photos: StayPhoto[] = [];
    for (const ph of (p.photos ?? []).slice(0, 3)) {
      const r = await fetch(`${BASE}/${ph.name}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${encodeURIComponent(key)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const { photoUri } = (await r.json()) as { photoUri?: string };
      if (!photoUri) continue;
      photos.push({
        src: photoUri.startsWith("//") ? `https:${photoUri}` : photoUri,
        credit: (ph.authorAttributions ?? [])
          .filter((a) => a.displayName)
          .map((a) => ({ name: a.displayName!, url: a.uri?.startsWith("//") ? `https:${a.uri}` : a.uri ?? "" })),
      });
    }
    return {
      verified: true,
      name: p.displayName?.text ?? name,
      address: p.formattedAddress ?? "",
      latitude: p.location?.latitude ?? null,
      longitude: p.location?.longitude ?? null,
      rating: p.rating ?? null,
      ratings: p.userRatingCount ?? null,
      mapsUrl: p.googleMapsUri ?? null,
      photos,
    };
  } catch (e) {
    console.error("Places lookup failed", e instanceof Error ? e.message : e);
    return null;
  }
}
