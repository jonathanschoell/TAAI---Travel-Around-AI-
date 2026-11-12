import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site";
import { PREMIUM_PRICE, UNLIMITED_PRICE } from "@/lib/operator";

export const metadata: Metadata = { title: "Pricing" };

const FREE = [
  "2 AI itineraries per month",
  "Trips of up to 21 days",
  "Day-by-day plan with budget overview",
  "Saved trips in your dashboard",
];
const PREMIUM = [
  "30 AI itineraries per month",
  "Trips of up to 21 days",
  "New features first as they launch",
];
const UNLIMITED = [
  "Unlimited AI itineraries",
  "Trips of up to 21 days",
  "Planned by Claude Opus, our most capable AI model",
  "Every feature, now and as it launches",
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

function PaidPlan({
  name, price, items, highlight = false,
}: { name: string; price: string; items: string[]; highlight?: boolean }) {
  return (
    <section className={`card flex flex-col ${highlight ? "border-brand" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">{name}</h2>
        <span className="pill pill-signal">Coming soon</span>
      </div>
      <p className="mt-1 font-display text-4xl font-extrabold">
        {price} <span className="text-base font-semibold text-muted">per month</span>
      </p>
      <List items={items} />
      <div className="flex-1" />
      <button type="button" className="btn btn-primary mt-6 sm:w-fit" disabled>
        Not available yet
      </button>
    </section>
  );
}

export default function PricingPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">Simple pricing</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Start free. Upgrade when you want more trips and longer itineraries.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <section className="card flex flex-col">
            <h2 className="text-2xl font-extrabold">Free</h2>
            <p className="mt-1 font-display text-4xl font-extrabold">CHF 0</p>
            <List items={FREE} />
            <div className="flex-1" />
            <Link href="/register" className="btn btn-ghost mt-6 sm:w-fit">Create a free account</Link>
          </section>
          <PaidPlan name="Premium" price={PREMIUM_PRICE} items={PREMIUM} highlight />
          <PaidPlan name="Unlimited" price={UNLIMITED_PRICE} items={UNLIMITED} />
        </div>
        <p className="mt-6 text-sm text-muted">
          Online payment is not connected yet, so the paid plans cannot be bought at the moment.
          Prices include any applicable VAT.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
