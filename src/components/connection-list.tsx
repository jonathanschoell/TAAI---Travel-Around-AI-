import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import type { ConnectionResult } from "@/lib/timetable";

/** Real train/bus connections with departure times, platforms and every change. */
export async function ConnectionList({ title, result, note }: { title: string; result: ConnectionResult; note?: string }) {
  const { t: all, date } = await getI18n();
  const t = all.trip.travel;
  const time = (iso: string) => iso.slice(11, 16);
  const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted">
          {result.from} → {result.to} · {date(result.date, { weekday: "long", day: "numeric", month: "long" })}
        </p>
        {result.example ? <p className="notice mt-2 text-sm">{f(t.example, { date: date(result.date, { weekday: "long", day: "numeric", month: "long" }) })}</p> : null}
        {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
      </div>
      <ol className="flex flex-col gap-3">
        {result.connections.map((c, i) => (
          <li key={i}>
            <details className="group rounded-2xl border border-line" open={i === 0}>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
                <span className="font-display text-lg font-bold tabular-nums">
                  {time(c.departure)} → {time(c.arrival)}
                </span>
                <span className="flex flex-wrap gap-1.5 text-sm">
                  <span className="pill">{dur(c.durationMinutes)}</span>
                  <span className="pill">{c.transfers === 0 ? t.direct : f(c.transfers === 1 ? t.changeOne : t.changeOther, { n: c.transfers })}</span>
                  {(() => {
                    // Platform of the first train or bus (the journey may start with a walk from the door).
                    const first = c.legs.find((l) => l.line);
                    return first?.fromPlatform ? <span className="pill pill-signal">{f(t.platform, { p: first.fromPlatform })}</span> : null;
                  })()}
                </span>
              </summary>
              <ol className="flex flex-col gap-0 border-t border-line px-4 py-3">
                {c.legs.map((l, j) =>
                  l.line ? (
                    <li key={j} className="grid grid-cols-[3.5rem_1fr] gap-x-3 py-2">
                      <span className="text-sm font-bold tabular-nums">{l.fromTime}</span>
                      <span className="text-sm">
                        <span className="font-semibold">{l.from}</span>
                        {l.fromPlatform ? <span className="text-muted"> · {f(t.platform, { p: l.fromPlatform })}</span> : null}
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-brand px-1.5 py-0.5 text-xs font-bold text-brand-ink">{l.line}</span>
                          {l.direction ? <span className="text-muted">{f(t.direction, { to: l.direction })}</span> : null}
                        </span>
                      </span>
                      <span className="text-sm font-bold tabular-nums">{l.toTime}</span>
                      <span className="text-sm">
                        <span className="font-semibold">{l.to}</span>
                        {l.toPlatform ? <span className="text-muted"> · {f(t.platform, { p: l.toPlatform })}</span> : null}
                      </span>
                    </li>
                  ) : (
                    <li key={j} className="grid grid-cols-[3.5rem_1fr] gap-x-3 py-1 text-sm text-muted">
                      <span className="tabular-nums">{j === 0 ? l.fromTime : ""}</span>
                      <span>{f(t.walk, { n: l.walkMinutes ?? 1, to: l.to })}</span>
                    </li>
                  ),
                )}
              </ol>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
