import Link from "next/link";
import { setPersonalization } from "@/app/(app)/actions";
import { DeleteAccountForm } from "@/components/app-forms";
import { getProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGES } from "@/lib/i18n/config";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("myData");


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
  const { t: all, dateTime: fmt } = await getI18n();
  const t = all.myData;
  const languageName = LANGUAGES.find((l) => l.code === profile?.language)?.name ?? "—";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-muted">{t.lead}</p>
      </div>

      <section className="card">
        <h2 className="text-xl font-bold">{t.account}</h2>
        <dl className="mt-3 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">{t.email}</dt><dd className="break-all">{user.email}</dd>
          <dt className="text-muted">{t.created}</dt><dd>{fmt(user.created_at)}</dd>
          <dt className="text-muted">{t.profileName}</dt><dd>{profile?.display_name ?? "—"}</dd>
          <dt className="text-muted">{t.ageGroup}</dt><dd>{profile?.age_group ?? t.notSet}</dd>
          <dt className="text-muted">{t.currency}</dt><dd>{profile?.currency ?? "—"}</dd>
          <dt className="text-muted">{t.language}</dt><dd>{languageName}</dd>
          <dt className="text-muted">{t.lastActive}</dt><dd>{fmt(profile?.last_seen_at)}</dd>
        </dl>
        <Link href="/profile" className="btn btn-ghost mt-4 sm:w-fit">{t.editProfile}</Link>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t.personalisation}</h2>
          <span className="pill">{on ? t.on : t.off}</span>
        </div>
        <p className="mt-2 text-sm text-muted">{t.personalisationBody}</p>
        <form action={setPersonalization} className="mt-4">
          <input type="hidden" name="enabled" value={on ? "false" : "true"} />
          <button type="submit" className={on ? "btn btn-ghost" : "btn btn-primary"}>
            {on ? t.turnOff : t.turnOn}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">{t.consents}</h2>
        {consents && consents.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {consents.map((c, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span>
                  {c.kind === "privacy_policy" ? t.privacyPolicy : t.personalisationShort}:{" "}
                  {c.granted ? t.accepted : t.withdrawn} ({c.policy_version})
                </span>
                <span className="text-muted">{fmt(c.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">{t.noEntries}</p>
        )}
      </section>

      <section className="card border-danger lg:col-span-2">
        <h2 className="text-xl font-bold">{t.deleteTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.deleteBody}</p>
        <div className="mt-4"><DeleteAccountForm /></div>
      </section>
    </div>
  );
}
