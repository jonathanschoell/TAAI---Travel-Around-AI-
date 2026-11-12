import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site";
import { PREMIUM_PRICE } from "@/lib/operator";

export const metadata: Metadata = { title: "Pricing" };

const FREE = [
  "2 AI itineraries per month",
  "Trips of up to 5 days",
  "Day-by-day plan with budget overview",
  "Saved trips in your dashboard",
];
const PREMIUM = [
  "30 AI itineraries per month",
  "Trips of up to 10 days",
  "Our most capable AI model for richer, better-reasoned plans",
  "New features first as they launch",
];

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Simple pricing</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Start free. Upgrade when you want more trips and longer itineraries.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="card flex flex-col">
            <h2 className="text-2xl font-extrabold">Free</h2>
            <p className="mt-1 font-display text-4xl font-extrabold">CHF 0</p>
            <List items={FREE} />
            <Link href="/register" className="btn btn-ghost mt-6 sm:w-fit">Create a free account</Link>
          </section>
          <section className="card flex flex-col border-brand">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold">Premium</h2>
              <span className="pill pill-signal">Coming soon</span>
            </div>
            <p className="mt-1 font-display text-4xl font-extrabold">
              {PREMIUM_PRICE} <span className="text-base font-semibold text-muted">per month</span>
            </p>
            <List items={PREMIUM} />
            <button type="button" className="btn btn-primary mt-6 sm:w-fit" disabled>
              Not available yet
            </button>
            <p className="mt-3 text-sm text-muted">
              Online payment is not connected yet. Premium cannot be bought at the moment.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
