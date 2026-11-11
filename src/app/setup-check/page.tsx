import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PublicHeader, SiteFooter } from "@/components/site";
import { SETTING_NAMES, supabaseEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Setup check", robots: { index: false } };

type Row = { label: string; ok: boolean; detail: string };

async function probe(url: string, path: string, key: string) {
  try {
    const res = await fetch(url + path, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return { status: res.status, body: (await res.text()).slice(0, 300) };
  } catch {
    return { status: 0, body: "" };
  }
}

/** Shows which settings the running server can see. Names and yes/no only, never the values. */
async function Checks() {
  await connection();
  const { url, key, secret } = supabaseEnv();
  const rows: Row[] = [];

  const urlLooksRight = Boolean(url && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url.value));
  rows.push({
    label: "Supabase project URL",
    ok: urlLooksRight,
    detail: !url
      ? `Not found. Add ${SETTING_NAMES.URL_NAMES[0]} in Vercel.`
      : urlLooksRight
        ? `Found as ${url.name}.`
        : `Found as ${url.name}, but it does not look like https://xxxx.supabase.co. Copy the "Project URL" from Supabase again, with nothing after ".co".`,
  });

  const keyIsSecret = Boolean(key && key.value.startsWith("sb_secret_"));
  const keyLooksRight = Boolean(
    key && !keyIsSecret && (key.value.startsWith("sb_publishable_") || key.value.startsWith("eyJ")),
  );
  rows.push({
    label: "Supabase publishable key",
    ok: keyLooksRight,
    detail: !key
      ? `Not found. Add ${SETTING_NAMES.KEY_NAMES[0]} in Vercel.`
      : keyIsSecret
        ? `Found as ${key.name}, but this is the secret key. Put the publishable key here and the secret key in ${SETTING_NAMES.SECRET_NAMES[0]}.`
        : keyLooksRight
          ? `Found as ${key.name}.`
          : `Found as ${key.name}, but it does not start with "sb_publishable_" or "eyJ". Copy the publishable key from Supabase again.`,
  });

  rows.push({
    label: "Supabase secret key",
    ok: Boolean(secret),
    detail: secret
      ? `Found as ${secret.name}.`
      : `Not found. Add ${SETTING_NAMES.SECRET_NAMES[0]} in Vercel. Needed for account deletion and the admin area, not for sign-up.`,
  });

  if (url && key && urlLooksRight) {
    const auth = await probe(url.value, "/auth/v1/settings", key.value);
    rows.push({
      label: "Connection to Supabase sign-in",
      ok: auth.status === 200,
      detail:
        auth.status === 200
          ? "Supabase answered and accepted the key."
          : auth.status === 0
            ? "No answer from that address. Check the project URL, and that the Supabase project is not paused."
            : `Supabase answered with status ${auth.status}. The key does not belong to this project or was copied incompletely.`,
    });

    if (auth.status === 200) {
      const table = await probe(url.value, "/rest/v1/profiles?select=user_id&limit=1", key.value);
      const missingTable = table.status === 404 || /PGRST205|does not exist|schema cache/.test(table.body);
      rows.push({
        label: "Database tables",
        ok: !missingTable && table.status !== 0,
        detail: missingTable
          ? "The table \"profiles\" was not found. Run supabase/migrations/0001_init.sql in the Supabase SQL editor."
          : "The tables are in place.",
      });
    }
  }

  const admins = (process.env["ADMIN_EMAILS"] ?? "").split(",").filter((s) => s.trim()).length;
  rows.push({
    label: "Admin addresses",
    ok: admins > 0,
    detail: admins > 0 ? `${admins} address(es) set.` : "ADMIN_EMAILS is not set. Only needed for the admin area.",
  });

  const allCore = rows.slice(0, 2).every((r) => r.ok);
  return (
    <>
      <p className={allCore ? "notice notice-ok" : "notice notice-error"}>
        {allCore
          ? "The server can see the Supabase settings."
          : "The server cannot see all Supabase settings yet. After changing a value in Vercel, start a new deployment, otherwise the running site keeps the old values."}
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.label} className="card flex items-start gap-3">
            <span className="pill shrink-0" style={{ borderColor: r.ok ? "var(--ok)" : "var(--danger)", color: r.ok ? "var(--ok)" : "var(--danger)" }}>
              {r.ok ? "OK" : "Missing"}
            </span>
            <span>
              <span className="font-semibold">{r.label}</span>
              <span className="block text-sm text-muted">{r.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function SetupCheckPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Setup check</h1>
        <p className="mt-2 text-muted">
          What the running website can see of its settings. Values are never shown here.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-muted">Checking…</p>}>
            <Checks />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
