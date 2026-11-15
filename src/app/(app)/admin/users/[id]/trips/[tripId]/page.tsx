import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadUserTrip } from "@/lib/admin-user";
import { cleanStays } from "@/lib/planner/ai";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin · Trip", robots: { index: false } };
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

/** Read-only view of one user's trip. Admins only; every visit is logged. */
export default async function AdminTripPage({ params }: PageProps<"/admin/users/[id]/trips/[tripId]">) {
  const me = await requireAdmin();
  const { id, tripId } = await params;
  if (!isUuid(id) || !isUuid(tripId)) notFound();
  const admin = createAdminClient();
  if (!admin) return <p className="notice notice-error">The admin area needs SUPABASE_SECRET_KEY.</p>;
  const data = await loadUserTrip(admin, me.id, id, tripId);
  if (!data) notFound();
  const { trip, days, activities } = data;
  const input = (trip.input ?? {}) as Record<string, unknown>;
  const stays = cleanStays(input.stays);
  const request: [string, unknown][] = [
    ["origin", input.origin], ["address", input.address], ["canton", input.homeCanton], ["party", input.party],
    ["ages", input.ages], ["interests", input.interests], ["budget", trip.budget_total], ["currency", trip.currency],
    ["pace", input.pace], ["level", input.level], ["lodging", input.lodging], ["travel mode", input.travelMode],
    ["stops", Array.isArray(input.stops) ? (input.stops as { place: string; from: string; to: string }[]).map((s) => `${s.place} ${s.from}–${s.to}`) : null],
    ["wishes", input.wishes], ["constraints", input.constraints],
    ["departure", (input.departure as { code?: string } | null)?.code],
  ];
  const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : Array.isArray(v) ? (v.length ? v.join(", ") : "—") : String(v));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/users/${id}`} className="text-sm font-semibold text-brand underline">← Account</Link>
        <h1 className="mt-2 text-3xl font-extrabold">{String(trip.title)}</h1>
        <p className="mt-1 text-muted">{String(trip.destination)} · {String(trip.start_date)} – {String(trip.end_date)} · {String(trip.travelers)} travellers</p>
        {trip.summary ? <p className="mt-2 max-w-3xl">{String(trip.summary)}</p> : null}
      </div>
      <section className="card">
        <h2 className="text-xl font-bold">Request</h2>
        <dl className="mt-3 grid grid-cols-[9rem_1fr] gap-x-4 gap-y-1.5 text-sm">
          {request.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="break-words">{show(v)}</dd></div>
          ))}
        </dl>
      </section>
      {stays.length ? (
        <section className="card">
          <h2 className="text-xl font-bold">Stays</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {stays.map((s) => <li key={s.name + s.check_in}><span className="font-semibold">{s.name}</span> · {s.place} · {s.check_in} – {s.check_out}{s.price_per_night ? ` · est. ${trip.currency} ${s.price_per_night}/night` : ""}</li>)}
          </ul>
        </section>
      ) : null}
      {days.map((d) => (
        <section key={d.id} className="card">
          <h2 className="text-lg font-bold">Day {d.day_number}{d.theme ? ` · ${d.theme}` : ""} <span className="text-sm font-normal text-muted">{d.day_date}</span></h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {activities.filter((a) => a.trip_day_id === d.id).map((a, i) => (
              <li key={i}><span className="pill mr-2">{a.slot}</span><span className="font-semibold">{a.name}</span>{a.cost ? ` · est. ${trip.currency} ${a.cost}` : ""}</li>
            ))}
          </ul>
          {d.transit_notes ? <p className="mt-2 text-sm text-muted">{d.transit_notes}</p> : null}
        </section>
      ))}
    </div>
  );
}
