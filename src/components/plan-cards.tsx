import Link from "next/link";
import type { Tier } from "@/lib/billing";
import { getI18n } from "@/lib/i18n/server";
import { PREMIUM_PRICE, UNLIMITED_PRICE } from "@/lib/operator";

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The three plans side by side. On the pricing page `current` is unset; in the
 * profile it marks the plan the person is on.
 */
export async function PlanCards({ current }: { current?: Tier }) {
  const { t } = await getI18n();
  const p = t.plans;
  const plans: { tier: Tier; name: string; price: string; items: string[]; paid: boolean }[] = [
    { tier: "free", name: p.free, price: "CHF 0", items: p.freeItems, paid: false },
    { tier: "premium", name: p.premium, price: PREMIUM_PRICE, items: p.premiumItems, paid: true },
    { tier: "unlimited", name: p.unlimited, price: UNLIMITED_PRICE, items: p.unlimitedItems, paid: true },
  ];
  const highlight = current ?? "premium";

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const mine = plan.tier === current;
        return (
          <section key={plan.tier}
            className={`card flex flex-col ${plan.tier === highlight ? "border-brand" : ""}`}
            aria-current={mine ? "true" : undefined}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold">{plan.name}</h2>
              {mine ? (
                <span className="pill pill-signal">{p.currentPlan}</span>
              ) : plan.paid ? (
                <span className="pill">{p.comingSoon}</span>
              ) : null}
            </div>
            <p className="mt-1 font-display text-4xl font-extrabold">
              {plan.price}{" "}
              {plan.paid ? <span className="text-base font-semibold text-muted">{p.perMonth}</span> : null}
            </p>
            <List items={plan.items} />
            <div className="flex-1" />
            {mine ? null : plan.paid ? (
              <button type="button" className="btn btn-primary mt-6 sm:w-fit" disabled>{p.notAvailable}</button>
            ) : current ? null : (
              <Link href="/register" className="btn btn-ghost mt-6 sm:w-fit">{p.createFree}</Link>
            )}
          </section>
        );
      })}
    </div>
  );
}
