import { PlanCards } from "@/components/plan-cards";
import { PublicHeader, SiteFooter } from "@/components/site";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("pricing");

export default async function PricingPage() {
  const { t } = await getI18n();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t.plans.pricingTitle}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{t.plans.pricingLead}</p>
        <div className="mt-8"><PlanCards /></div>
        <p className="mt-6 text-sm text-muted">{t.plans.paymentNote}</p>
      </main>
      <SiteFooter />
    </>
  );
}
