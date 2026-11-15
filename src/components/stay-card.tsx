import { Suspense } from "react";
import { PlacePhoto } from "@/components/place-photo";
import { SafeImg } from "@/components/safe-img";
import { bookingSearch } from "@/lib/booking-links";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { Stay } from "@/lib/planner/ai";
import { stayDetails } from "@/lib/stay-details";

type TripForLinks = Parameters<typeof bookingSearch>[3];
const DAY = 86_400_000;

/** Photos of the accommodation (Google), or of its area when Google is not set up or finds nothing. */
async function StayPhotos({ stay, label }: { stay: Stay; label: string }) {
  const details = await stayDetails(stay.name, stay.area, stay.place);
  if (details?.photos.length) {
    const [first, ...rest] = details.photos;
    return (
      <figure>
        <div className="grid h-56 grid-cols-3 grid-rows-2 gap-1.5 overflow-hidden rounded-[22px] sm:h-64">
          <div className={`relative ${rest.length ? "col-span-2 row-span-2" : "col-span-3 row-span-2"}`}>
            <SafeImg src={first.src} alt={details.name} className="absolute inset-0 size-full object-cover" />
          </div>
          {rest.map((p, i) => (
            <div key={i} className="relative">
              <SafeImg src={p.src} alt={details.name} className="absolute inset-0 size-full object-cover" />
            </div>
          ))}
        </div>
        <figcaption className="mt-1.5 text-xs text-muted">
          Google{details.photos.flatMap((p) => p.credit).slice(0, 3).map((c) => (
            <span key={c.name}> · {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="underline">{c.name}</a> : c.name}</span>
          ))}
        </figcaption>
      </figure>
    );
  }
  if (!stay.area && !stay.place) return null;
  return <PlacePhoto place={[stay.area, stay.place].filter(Boolean).join(", ")} label={label} imgClassName="h-56 sm:h-64" />;
}

/** Details from Google when available: checked address, rating, map link. */
async function StayFacts({ stay, t }: { stay: Stay; t: Awaited<ReturnType<typeof getI18n>>["t"]["trip"]["stays"] }) {
  const d = await stayDetails(stay.name, stay.area, stay.place);
  const address = d?.address || stay.address;
  const mapUrl = d?.mapsUrl
    ?? (stay.latitude !== null && stay.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${stay.latitude}&mlon=${stay.longitude}#map=16/${stay.latitude}/${stay.longitude}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent([stay.name, stay.place].join(", "))}`);
  return (
    <>
      <p className="mt-1 flex flex-wrap gap-1.5">
        {d?.verified ? <span className="pill pill-signal">{t.verified}</span> : <span className="pill">{t.notVerified}</span>}
        {d?.rating ? <span className="pill">★ {d.rating.toFixed(1)}{d.ratings ? ` (${d.ratings})` : ""} · Google</span> : null}
      </p>
      {address ? <p className="mt-2 text-sm">{address}</p> : null}
      <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-brand underline">{t.map}</a>
    </>
  );
}

export async function StayCard({ stay, trip, money }: { stay: Stay; trip: TripForLinks; money: (n: number) => string }) {
  const { t: all, date, locale } = await getI18n();
  const t = all.trip.stays;
  const nights = Math.max(1, Math.round((Date.parse(stay.check_out) - Date.parse(stay.check_in)) / DAY));
  const booking = bookingSearch(`${stay.name} ${stay.place}`, stay.check_in, stay.check_out, trip, locale);
  const kind = (t.kinds as Record<string, string>)[stay.kind] ?? stay.kind;
  const areaLabel = f(t.area, { area: stay.area || stay.place });
  return (
    <article className="card grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <Suspense fallback={<div className="h-56 animate-pulse rounded-[22px] bg-surface sm:h-64" />}>
        <StayPhotos stay={stay} label={areaLabel} />
      </Suspense>
      <div>
        <p className="text-sm font-semibold text-muted">
          {stay.place} · {date(stay.check_in, { day: "numeric", month: "short" })} – {date(stay.check_out, { day: "numeric", month: "short" })} · {f(nights === 1 ? t.nightOne : t.nightOther, { n: nights })}
        </p>
        <h3 className="mt-1 font-display text-2xl font-extrabold">{stay.name}</h3>
        <p className="text-sm text-muted">{kind}{stay.area ? ` · ${stay.area}` : ""}</p>
        <Suspense fallback={null}>
          <StayFacts stay={stay} t={t} />
        </Suspense>
        {stay.reason ? <p className="mt-3">{stay.reason}</p> : null}
        {stay.price_per_night ? (
          <p className="mt-3 text-sm">
            <span className="font-semibold">{f(t.perNight, { amount: money(stay.price_per_night) })}</span>
            <span className="text-muted"> · {f(t.total, { amount: money(stay.price_per_night * nights) })}</span>
          </p>
        ) : null}
        <a href={booking.url} target="_blank" rel={booking.partner ? "noreferrer sponsored" : "noreferrer"}
          className="btn btn-primary mt-4 sm:w-fit">
          {t.check}
        </a>
      </div>
    </article>
  );
}
