import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site";
import { OPERATOR, PREMIUM_PRICE, TERMS_VERSION } from "@/lib/operator";

export const metadata: Metadata = { title: "Terms of use" };

const operator = OPERATOR.name || "the operator named in the imprint";

const SECTIONS: [string, string[]][] = [
  ["1. Who these terms apply to", [
    `These terms govern the use of Jovia, an online service run by ${operator} ("we"). By creating an account you accept them.`,
    "If you do not agree, please do not use Jovia.",
  ]],
  ["2. What Jovia does", [
    "Jovia creates travel itineraries with the help of artificial intelligence, based on what you tell it.",
    "Jovia is a planning tool. We are not a travel agency, tour operator or booking agent. We do not sell or arrange flights, accommodation or activities, and no travel contract is concluded with us.",
  ]],
  ["3. AI-generated content", [
    "Itineraries are generated automatically and are not checked by a person. They can contain mistakes: places may be closed, may have moved or may not exist, and routes may be impractical.",
    "All prices and budgets are estimates, not offers. Opening hours, availability, entry requirements and safety conditions are not verified.",
    "You are responsible for checking important details with the provider before you book or travel, including visa, health and safety requirements.",
    "You can report a problem with a plan using the button on every itinerary.",
  ]],
  ["4. Your account", [
    "You must be at least 16 years old and give a valid email address.",
    "Keep your password secret. You are responsible for activity in your account. Tell us if you believe someone else is using it.",
    "You can delete your account and all related data at any time under \"My data\".",
  ]],
  ["5. Free and Premium", [
    "The Free plan includes a limited number of itineraries per month at no charge. The current limits are shown on the pricing page.",
    `Premium costs ${PREMIUM_PRICE} per month and includes more itineraries and longer trips. Prices include any applicable value added tax.`,
    "Premium is not yet available for purchase. Before it is, these terms will be updated with the payment method, the billing period, how to cancel and any right of withdrawal.",
    "We may change limits and features of the Free plan. Changes to a paid plan apply from the next billing period and are announced in advance.",
  ]],
  ["6. Acceptable use", [
    "Use Jovia only for planning your own or your group's travel.",
    "Do not try to disrupt the service, get around usage limits, access other people's data, or use automated tools to create itineraries in bulk.",
    "Do not enter unlawful content or sensitive information about other people.",
    "We may suspend or close accounts that break these rules.",
  ]],
  ["7. Your content and ours", [
    "What you enter remains yours. You allow us to process it to provide the service, as described in the privacy policy.",
    "You may use the itineraries created for you for your personal travel. The Jovia name, logo, design and software belong to us.",
  ]],
  ["8. Availability", [
    "We aim to keep Jovia available but do not guarantee uninterrupted service. Features may change, and the service may be paused for maintenance.",
  ]],
  ["9. Liability", [
    "We are liable without limit for damage caused intentionally or through gross negligence, and where the law does not allow liability to be limited.",
    "Otherwise our liability is excluded to the extent the law permits. In particular, we are not liable for costs or losses that arise because an itinerary was inaccurate, because a place, price or opening time differed from the plan, or because of services of third parties.",
  ]],
  ["10. Ending the agreement", [
    "You can stop using Jovia and delete your account at any time.",
    "We may end the agreement with reasonable notice, or immediately for a serious breach of these terms.",
  ]],
  ["11. Changes to these terms", [
    "We may update these terms. We will tell you about important changes by email or when you next log in. If you continue to use Jovia afterwards, the new terms apply.",
  ]],
  ["12. Law and place of jurisdiction", [
    "Swiss law applies. The courts at the operator's place of residence or registered office have jurisdiction. Mandatory consumer protection rules of your country of residence, including mandatory places of jurisdiction, remain unaffected.",
  ]],
];

export default function TermsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <span className="pill pill-signal">Draft, not yet legally reviewed</span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Terms of use</h1>
        <p className="mt-2 text-muted">
          Version {TERMS_VERSION}. See also the{" "}
          <Link href="/privacy" className="underline">privacy policy</Link> and the{" "}
          <Link href="/imprint" className="underline">imprint</Link>.
        </p>
        <div className="mt-8 flex flex-col gap-8">
          {SECTIONS.map(([title, paragraphs]) => (
            <section key={title}>
              <h2 className="text-xl font-bold">{title}</h2>
              <div className="mt-2 flex flex-col gap-2">
                {paragraphs.map((t) => <p key={t}>{t}</p>)}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
