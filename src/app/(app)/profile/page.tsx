import { ProfileForm } from "@/components/app-forms";
import { PlanCards } from "@/components/plan-cards";
import { getProfile, requireUser } from "@/lib/auth";
import { getQuota, isUnlimited, TIERS } from "@/lib/billing";
import { f } from "@/lib/i18n/config";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("profile");

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, quota, { t }] = await Promise.all([getProfile(user.id), getQuota(user), getI18n()]);
  const limits = TIERS[quota.tier];
  const planName = t.plans[quota.tier];
  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.profile.title}</h1>
          <p className="mt-2 text-muted">{f(t.profile.signedInAs, { email: user.email ?? "" })}</p>
        </div>
        <div className="card">
          {profile ? (
            <ProfileForm profile={profile} />
          ) : (
            <p className="notice notice-error">{t.profile.loadFailed}</p>
          )}
        </div>
        <aside className="card">
          <h2 className="text-lg font-bold">{t.profile.whyTitle}</h2>
          <p className="mt-2 text-sm text-muted">{t.profile.whyBody}</p>
        </aside>
      </div>

      <section id="plans" className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t.plans.profileTitle}</h2>
          <p className="mt-2 text-muted">
            {f(t.plans.profileLead, { plan: planName })}{" "}
            {isUnlimited(limits.plansPerMonth)
              ? t.plans.profileUnlimited
              : f(t.plans.profileUsage, { left: quota.leftThisMonth, total: limits.plansPerMonth })}
          </p>
        </div>
        <PlanCards current={quota.tier} />
        <p className="text-sm text-muted">{t.plans.paymentNote}</p>
      </section>
    </div>
  );
}
