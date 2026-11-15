import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadUserDetails } from "@/lib/admin-user";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin · Account", robots: { index: false } };

const fmt = (iso: unknown) =>
  typeof iso === "string" && iso ? new Date(iso).toLocaleString("de-CH", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Zurich" }) : "—";
const show = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function Facts({ rows }: { rows: [string, unknown][] }) {
  return (
    <dl className="mt-3 grid grid-cols-[11rem_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="break-words">{/_at$/.test(k) ? fmt(v) : show(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Everything stored for one account. Admins only; every visit is logged. */
export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const admin = createAdminClient();
  if (!admin) return <p className="notice notice-error">The admin area needs SUPABASE_SECRET_KEY.</p>;
  const d = await loadUserDetails(admin, me.id, id);
  if (!d.auth) notFound();

  const profileRows = Object.entries(d.profile ?? {}).filter(([k]) => k !== "user_id");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand underline">← Admin overview</Link>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl break-all">{d.auth.email}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Everything stored for this account. Use it for support and to keep the service safe. This visit is recorded in
          the audit log.
        </p>
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-bold">Account</h2>
          <Facts rows={[
            ["user id", d.auth.id],
            ["email", d.auth.email],
            ["email confirmed_at", d.auth.email_confirmed_at],
            ["created_at", d.auth.created_at],
            ["last_sign_in_at", d.auth.last_sign_in_at],
            ["language (account)", (d.auth.user_metadata as Record<string, unknown> | undefined)?.language],
          ]} />
        </article>
        <article className="card">
          <h2 className="text-xl font-bold">Plan and usage</h2>
          <Facts rows={[
            ["plan", d.subscription?.tier ?? "free"],
            ["status", d.subscription?.status],
            ["source", d.subscription?.source],
            ["current_period_end", d.subscription?.current_period_end],
          ]} />
          <h3 className="mt-4 font-semibold">AI use this month</h3>
          {d.usageThisMonth.length ? (
            <table className="mt-2 w-full text-left text-sm">
              <thead className="text-muted"><tr><th className="py-1 pr-3 font-semibold">Kind</th><th className="py-1 pr-3 font-semibold">Calls</th><th className="py-1 font-semibold">Tokens in / out</th></tr></thead>
              <tbody>
                {d.usageThisMonth.map((u) => (
                  <tr key={u.kind} className="border-t border-line">
                    <td className="py-1 pr-3">{u.kind}</td>
                    <td className="py-1 pr-3 tabular-nums">{u.count}</td>
                    <td className="py-1 tabular-nums">{u.input.toLocaleString("de-CH")} / {u.output.toLocaleString("de-CH")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="mt-1 text-sm text-muted">None.</p>}
        </article>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Profile</h2>
        {profileRows.length ? <Facts rows={profileRows} /> : <p className="mt-2 text-sm text-muted">No profile row.</p>}
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Trips ({d.trips.length})</h2>
        {d.trips.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Title</th>
                  <th className="py-2 pr-4 font-semibold">Destination</th>
                  <th className="py-2 pr-4 font-semibold">Dates</th>
                  <th className="py-2 pr-4 font-semibold">Travellers</th>
                  <th className="py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {d.trips.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="py-2 pr-4"><Link href={`/admin/users/${id}/trips/${t.id}`} className="font-semibold text-brand underline">{t.title}</Link></td>
                    <td className="py-2 pr-4">{t.destination}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{t.start_date} – {t.end_date}</td>
                    <td className="py-2 pr-4">{t.travelers}</td>
                    <td className="py-2 whitespace-nowrap">{fmt(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-sm text-muted">No trips.</p>}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-bold">AI memory ({d.memory.length})</h2>
          {d.memory.length ? (
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {d.memory.map((m, i) => (
                <li key={i} className="border-t border-line pt-2">
                  {m.statement}
                  <span className="block text-muted">{m.category ?? "—"} · {m.source} · {m.active ? "active" : "inactive"} · {fmt(m.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">Nothing stored.</p>}
        </article>
        <article className="card">
          <h2 className="text-xl font-bold">Consents</h2>
          {d.consents.length ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {d.consents.map((c, i) => (
                <li key={i}>{c.kind}: {c.granted ? "granted" : "withdrawn"} ({c.policy_version}) · <span className="text-muted">{fmt(c.created_at)}</span></li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">None.</p>}
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="card">
          <h2 className="text-xl font-bold">Travel preferences and family</h2>
          {d.preferences ? <Facts rows={Object.entries(d.preferences).filter(([k]) => k !== "user_id")} /> : <p className="mt-2 text-sm text-muted">None.</p>}
          {d.family.length ? (
            <ul className="mt-3 text-sm">{d.family.map((m, i) => <li key={i}>{m.age_group}: {show(m.interests)}</li>)}</ul>
          ) : null}
        </article>
        <article className="card">
          <h2 className="text-xl font-bold">Visited places and reports</h2>
          <p className="mt-2 text-sm">{d.visited.length ? d.visited.map((v) => v.destination ? `${v.name} (${v.destination})` : v.name).join(", ") : "No visited places."}</p>
          {d.reports.length ? (
            <ul className="mt-3 text-sm">{d.reports.map((r, i) => <li key={i}>{r.reason} · {fmt(r.created_at)}</li>)}</ul>
          ) : <p className="mt-2 text-sm text-muted">No reports.</p>}
        </article>
      </section>
    </div>
  );
}
