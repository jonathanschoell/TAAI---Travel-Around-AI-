import type { Metadata } from "next";
import { TierForm } from "@/components/app-forms";
import { requireAdmin } from "@/lib/auth";
import { loadAdminOverview } from "@/lib/admin-stats";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin" };

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-CH", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function AdminPage() {
  const me = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) {
    return (
      <p className="notice notice-error">
        The admin area needs SUPABASE_SECRET_KEY in the hosting environment. See SETUP.md.
      </p>
    );
  }

  const { users, tiles } = await loadAdminOverview(admin, me.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Admin overview</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Usage figures for Jovia. Trip contents and AI memory of individual users are not shown
          here. Every visit to this page is recorded in the audit log.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="card">
            <p className="font-display text-3xl font-extrabold tabular-nums">{value ?? "—"}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Accounts</h2>
        <p className="mt-1 text-sm text-muted">
          Latest 200 accounts, most recently signed in first.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Registered</th>
                <th className="py-2 pr-4 font-semibold">Last sign-in</th>
                <th className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2 pr-4 break-all">{u.email}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{fmt(u.created_at)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{fmt(u.last_sign_in_at)}</td>
                  <td className="py-2">
                    <span className="pill">{u.email_confirmed_at ? "Confirmed" : "Pending"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Give or remove Premium</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Sets an account&apos;s plan by hand. Use this until online payment is connected.
        </p>
        <TierForm />
      </section>

      <p className="text-sm text-muted">
        Still to come in the admin area: AI usage and cost, error rates, most requested
        destinations, account suspension, and a second sign-in factor for admin accounts.
      </p>
    </div>
  );
}
