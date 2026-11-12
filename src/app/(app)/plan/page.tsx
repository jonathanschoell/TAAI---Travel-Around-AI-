import { PlanForm } from "@/components/plan-form";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { getQuota, isUnlimited, TIERS } from "@/lib/billing";
import { getUpcomingSchoolHolidays, HOLIDAY_SOURCE } from "@/lib/holidays";
import { cantonByCode, cantonName } from "@/lib/swiss";
import { f } from "@/lib/i18n/config";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("plan");

// Creating an itinerary can take a couple of minutes.
export const maxDuration = 300;

export default async function PlanPage({ searchParams }: PageProps<"/plan">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const q = await searchParams;
  const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const quota = await getQuota(user);
  const limits = TIERS[quota.tier];
  const canton = cantonByCode(profile?.home_canton);
  const { t: all, locale, date: day } = await getI18n();
  const t = all.plan;
  const school = canton ? await getUpcomingSchoolHolidays(canton.code, locale) : null;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.lead}</p>
      </div>
      <p className="notice flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className="pill pill-signal mr-2">{all.plans[quota.tier]}</span>
          {isUnlimited(limits.plansPerMonth)
            ? t.unlimited
            : f(t.left, { left: quota.leftThisMonth, total: limits.plansPerMonth })}{" "}
          {f(t.maxDays, { n: limits.maxDays })}
        </span>
        {quota.tier !== "unlimited" ? <Link href="/profile#plans" className="underline">{t.seePlans}</Link> : null}
      </p>
      {canton && school?.length ? (
        <details className="card">
          <summary className="cursor-pointer font-semibold">
            {f(t.schoolHolidays, { canton: cantonName(canton.code, locale) })}
          </summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {school.map((h) => (
              <li key={h.name + h.start} className="text-sm">
                <span className="font-semibold">{h.name}</span>
                <span className="block text-muted">
                  {day(h.start)} {t.to} {day(h.end)}{h.varies ? ` · ${t.varies}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="hint mt-3">
            {t.fromThe}{" "}
            <a href={HOLIDAY_SOURCE.url} className="underline" target="_blank" rel="noreferrer">{HOLIDAY_SOURCE.name}</a>.
            {t.holidayNote}
          </p>
        </details>
      ) : null}
      <PlanForm
        maxDays={limits.maxDays}
        defaults={{
          currency: profile?.currency ?? "CHF",
          homePlace: profile?.home_place ?? "",
          homeCanton: profile?.home_canton ?? "",
          startDate: isDate(q.start) ? q.start : "",
          endDate: isDate(q.end) ? q.end : "",
        }}
      />
    </div>
  );
}
