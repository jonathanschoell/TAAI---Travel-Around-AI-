import { PublicHeader, SiteFooter } from "@/components/site";
import { f } from "@/lib/i18n/config";
import { LEGAL } from "@/lib/i18n/legal";
import { getI18n, titleFor } from "@/lib/i18n/server";
import { OPERATOR, operatorComplete } from "@/lib/operator";

export const generateMetadata = titleFor("imprint");

const COUNTRY: Record<string, string> = { en: "Switzerland", de: "Schweiz", fr: "Suisse", it: "Svizzera" };

export default async function ImprintPage() {
  const { locale } = await getI18n();
  const L = LEGAL[locale].imprint;
  const missing = <span className="text-danger">{L.missing}</span>;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {operatorComplete ? null : <span className="pill pill-signal">{L.incomplete}</span>}
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{L.title}</h1>

        <section className="mt-6">
          <h2 className="text-xl font-bold">{L.operator}</h2>
          <address className="mt-2 not-italic leading-relaxed">
            {OPERATOR.name || missing}<br />
            {OPERATOR.street || missing}<br />
            {OPERATOR.postalCodeAndCity || missing}<br />
            {COUNTRY[locale] ?? OPERATOR.country}
          </address>
          {OPERATOR.uid ? <p className="mt-2">{f(L.uid, { uid: OPERATOR.uid })}</p> : null}
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-bold">{L.contact}</h2>
          <p className="mt-2">
            {L.email}{" "}
            {OPERATOR.email ? <a href={`mailto:${OPERATOR.email}`} className="underline">{OPERATOR.email}</a> : missing}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-bold">{L.contentTitle}</h2>
          <p className="mt-2 text-muted">{L.content}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-bold">{L.linksTitle}</h2>
          <p className="mt-2 text-muted">{L.links}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
