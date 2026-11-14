import type { BookingLink } from "@/lib/booking-links";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

/** "Book your trip": pre-filled searches on booking sites, with an honest note about commissions. */
export async function BookingLinks({ links, date }: { links: BookingLink[]; date: (iso: string) => string }) {
  const { t: all } = await getI18n();
  const t = all.trip;
  const anyPartner = links.some((l) => l.partner);
  const title = (l: BookingLink) =>
    l.kind === "flights" ? t.book.flights : l.kind === "hotels" ? t.book.hotels : t.book.activities;
  return (
    <section className="card">
      <h2 className="text-xl font-bold">{t.book.title}</h2>
      <p className="mt-1 text-sm text-muted">{t.book.lead}</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <li key={l.kind + l.place + l.from}>
            <a href={l.url} target="_blank" rel={l.partner ? "noreferrer sponsored" : "noreferrer"}
              className="flex h-full flex-col gap-1 rounded-2xl border border-line p-4 hover:border-brand">
              <span className="text-sm font-semibold text-brand">{title(l)}</span>
              <span className="font-display text-lg font-bold">{l.place}</span>
              <span className="text-sm text-muted">
                {l.kind === "activities"
                  ? f(t.book.on, { provider: l.provider })
                  : `${date(l.from)} ${t.to} ${date(l.to)} · ${f(t.book.on, { provider: l.provider })}`}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{anyPartner ? t.book.partnerNote : t.book.note}</p>
    </section>
  );
}
