import type { Metadata } from "next";
import { PublicHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = { title: "Privacy policy" };

const SECTIONS: [string, string[]][] = [
  ["What we store", [
    "Account: your email address and a securely hashed password. We never store your password in readable form.",
    "Profile: the name, age group, currency and number of travellers you choose to enter.",
    "Consents: when you accepted this policy and when you turned personalisation on or off.",
    "Usage: when your account was last active, so we can see how many people use Jovia.",
  ]],
  ["What we use it for", [
    "To let you log in and keep your trips and preferences private to your account.",
    "To improve travel suggestions, only if you have turned long-term personalisation on.",
    "To understand overall usage of the service.",
  ]],
  ["What the operator can see", [
    "The operator can see account email addresses, registration and sign-in times, and overall usage figures.",
    "Trip contents and AI memory entries of individual users are not shown in the operator's admin area.",
  ]],
  ["Service providers", [
    "Database and sign-in: Supabase, hosted in Zurich, Switzerland.",
    "Website hosting: Vercel.",
    "Further providers (AI, email, maps) will be listed here before those features go live.",
  ]],
  ["Your choices", [
    "See and edit your data under “My data” and “Profile”.",
    "Turn long-term personalisation on or off at any time.",
    "Delete your account and all related data yourself under “My data”.",
  ]],
];

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <span className="pill pill-signal">Draft, not yet legally reviewed</span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Privacy policy</h1>
        <p className="mt-2 text-muted">
          This draft describes how Jovia handles personal data today. The operator&apos;s legal
          name and contact details, and a legal review under the Swiss FADP and the GDPR, are
          still to be added before public launch.
        </p>
        <div className="mt-8 flex flex-col gap-8">
          {SECTIONS.map(([title, items]) => (
            <section key={title}>
              <h2 className="text-xl font-bold">{title}</h2>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                {items.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
