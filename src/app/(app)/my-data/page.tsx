import type { Metadata } from "next";
import Link from "next/link";
import { setPersonalization } from "@/app/(app)/actions";
import { DeleteAccountForm } from "@/components/app-forms";
import { getProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My data" };

const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-CH", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function MyDataPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consents")
    .select("kind, granted, policy_version, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  const on = profile?.personalization_enabled ?? false;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">My data</h1>
        <p className="mt-2 text-muted">
          Everything TAAI stores about you, and the controls to change or remove it.
        </p>
      </div>

      <section className="card">
        <h2 className="text-xl font-bold">Account and profile</h2>
        <dl className="mt-3 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Email</dt><dd className="break-all">{user.email}</dd>
          <dt className="text-muted">Account created</dt><dd>{fmt(user.created_at)}</dd>
          <dt className="text-muted">Profile name</dt><dd>{profile?.display_name ?? "—"}</dd>
          <dt className="text-muted">Age group</dt><dd>{profile?.age_group ?? "Not set"}</dd>
          <dt className="text-muted">Currency</dt><dd>{profile?.currency ?? "—"}</dd>
          <dt className="text-muted">Travellers</dt><dd>{profile?.default_travelers ?? "—"}</dd>
          <dt className="text-muted">Last active</dt><dd>{fmt(profile?.last_seen_at)}</dd>
        </dl>
        <Link href="/profile" className="btn btn-ghost mt-4 sm:w-fit">Edit profile</Link>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Long-term personalisation</h2>
          <span className="pill">{on ? "On" : "Off"}</span>
        </div>
        <p className="mt-2 text-sm text-muted">
          When this is on, TAAI may remember lasting travel preferences from your trips and
          feedback to improve future suggestions. It never stores health, religious or political
          information. When it is off, the AI only uses what you enter for the current trip.
          Trip planning and memory are still being built, so nothing has been learned yet.
        </p>
        <form action={setPersonalization} className="mt-4">
          <input type="hidden" name="enabled" value={on ? "false" : "true"} />
          <button type="submit" className={on ? "btn btn-ghost" : "btn btn-primary"}>
            {on ? "Turn personalisation off" : "I agree, turn personalisation on"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Consent history</h2>
        {consents && consents.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {consents.map((c, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span>
                  {c.kind === "privacy_policy" ? "Privacy policy" : "Personalisation"}:{" "}
                  {c.granted ? "accepted" : "withdrawn"} ({c.policy_version})
                </span>
                <span className="text-muted">{fmt(c.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No entries yet.</p>
        )}
      </section>

      <section className="card border-danger">
        <h2 className="text-xl font-bold">Delete account</h2>
        <p className="mt-2 text-sm text-muted">
          This permanently removes your account, profile, trips, feedback and AI memory. It
          cannot be undone.
        </p>
        <div className="mt-4"><DeleteAccountForm /></div>
      </section>
    </div>
  );
}
