import "server-only";
import { cacheLife } from "next/cache";

/**
 * Freely licensed destination photos from Wikimedia (Wikivoyage first, then Wikipedia),
 * with the author and licence shown next to the photo as the licences require.
 * No API key is needed. Results are cached for a day so each place is looked up rarely.
 */

export type Photo = {
  src: string;
  width: number;
  height: number;
  /** Plain-text author, may be empty when the file page names none. */
  author: string;
  license: string;
  /** File page on Wikimedia Commons (credit link). */
  pageUrl: string;
};

const UA = "JoviaTravelPlanner/1.0 (https://www.jovia.agency; JoviaSwitzerland@gmail.com)";
const WIKIS = ["https://en.wikivoyage.org", "https://en.wikipedia.org"];
/** Lead images that are not photos of the place. */
const NOT_A_PHOTO = /(flag|map|locator|location|coat[_ ]of[_ ]arms|emblem|seal|logo|icon|diagram|\.svg$|\.gif$|\.tiff?$)/i;

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Wikimedia ${res.status}`);
  return res.json();
}

type SearchResult = { query?: { pages?: { index?: number; pageimage?: string; thumbnail?: { source: string; width: number; height: number } }[] } };

/** The lead photo of the best-matching article, or null. */
async function leadImage(wiki: string, query: string) {
  const qs = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "3",
    gsrnamespace: "0",
    prop: "pageimages",
    piprop: "thumbnail|name",
    pithumbsize: "1600",
    pilicense: "free",
  });
  const data = (await getJson(`${wiki}/w/api.php?${qs}`)) as SearchResult;
  const pages = [...(data.query?.pages ?? [])].sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  for (const p of pages) {
    const th = p.thumbnail;
    // Skip flags, maps and very thin panorama banners, which look poor when cropped.
    if (p.pageimage && th?.source && !NOT_A_PHOTO.test(p.pageimage) && th.width >= 800 && th.height >= 450 && th.width / th.height <= 2.6) {
      return { file: p.pageimage, thumb: th };
    }
  }
  return null;
}

type InfoResult = {
  query?: { pages?: { imageinfo?: { descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] }[] };
};

const plain = (html: string | undefined) =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Author, licence and file page from Wikimedia Commons. */
async function credit(file: string) {
  const qs = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: `File:${file}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiextmetadatafilter: "Artist|LicenseShortName|UsageTerms",
  });
  const data = (await getJson(`https://commons.wikimedia.org/w/api.php?${qs}`)) as InfoResult;
  const info = data.query?.pages?.[0]?.imageinfo?.[0];
  const meta = info?.extmetadata ?? {};
  const license = plain(meta.LicenseShortName?.value) || plain(meta.UsageTerms?.value);
  if (!info?.descriptionurl || !license) return null;
  return { author: plain(meta.Artist?.value).slice(0, 120), license: license.slice(0, 60), pageUrl: info.descriptionurl };
}

/** A photo for a place name such as "Kyoto" or "Lucerne, Switzerland", or null. Never throws. Cached for a day. */
export async function placePhoto(place: string): Promise<Photo | null> {
  "use cache";
  cacheLife("days");
  return findPhoto(place);
}

/** Uncached lookup behind placePhoto. */
export async function findPhoto(place: string): Promise<Photo | null> {
  const query = place.trim().slice(0, 100);
  if (!query) return null;
  for (const wiki of WIKIS) {
    try {
      const lead = await leadImage(wiki, query);
      if (!lead) continue;
      const c = await credit(lead.file);
      if (!c) continue;
      return { src: lead.thumb.source, width: lead.thumb.width, height: lead.thumb.height, ...c };
    } catch (e) {
      console.error("Photo lookup failed", wiki, e instanceof Error ? e.message : e);
    }
  }
  return null;
}

export const PHOTO_SOURCE = { name: "Wikimedia Commons", url: "https://commons.wikimedia.org" };
