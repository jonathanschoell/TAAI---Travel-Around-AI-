import { placePhoto } from "@/lib/images";
import { getI18n } from "@/lib/i18n/server";
import { f } from "@/lib/i18n/config";
import { SafeImg } from "@/components/safe-img";

/**
 * Freely licensed photo of a place with its credit line. Renders nothing when no
 * suitable photo is found, so the page never shows a broken image.
 */
export async function PlacePhoto({
  place,
  className = "",
  imgClassName = "h-56 sm:h-72 lg:h-80",
  label,
}: {
  place: string;
  className?: string;
  imgClassName?: string;
  /** Text shown over the photo, e.g. the place name. */
  label?: string;
}) {
  const [photo, { t }] = await Promise.all([placePhoto(place), getI18n()]);
  if (!photo) return null;
  const credit = photo.author
    ? f(t.trip.photoBy, { author: photo.author, license: photo.license })
    : f(t.trip.photoLicense, { license: photo.license });
  return (
    <figure className={className}>
      <div className={`relative w-full overflow-hidden rounded-[22px] bg-surface ${imgClassName}`}>
        {/* Wikimedia serves sized thumbnails itself, so a plain image element is enough here. */}
        <SafeImg src={photo.src} alt={label ?? place} className="absolute inset-0 size-full object-cover" />
        {label ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white">
            {label}
          </span>
        ) : null}
      </div>
      <figcaption className="mt-1.5 text-xs text-muted">
        <a href={photo.pageUrl} target="_blank" rel="noreferrer" className="underline">{credit}</a>
      </figcaption>
    </figure>
  );
}
