import Link from "next/link";
import { ChatAdvisor } from "@/components/chat-advisor";
import { requireUser } from "@/lib/auth";
import { getQuota, isUnlimited, TIERS } from "@/lib/billing";
import { f } from "@/lib/i18n/config";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("chat");

// Creating the itinerary from the chat can take a couple of minutes.
export const maxDuration = 300;

export default async function ChatPage() {
  const user = await requireUser();
  const [{ t }, quota] = await Promise.all([getI18n(), getQuota(user)]);
  const limits = TIERS[quota.tier];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t.chatPage.title}</h1>
        <p className="mt-2 max-w-3xl text-muted">{t.chatPage.lead}</p>
        <p className="mt-2 text-sm text-muted">
          <span className="pill pill-signal mr-2">{t.plans[quota.tier]}</span>
          {isUnlimited(limits.plansPerMonth)
            ? t.plan.unlimited
            : f(t.plan.left, { left: quota.leftThisMonth, total: limits.plansPerMonth })}{" "}
          <Link href="/plan" className="underline">{t.chatPage.form}</Link>
        </p>
      </div>
      <ChatAdvisor maxDays={limits.maxDays} />
    </div>
  );
}
