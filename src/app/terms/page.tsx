import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site";
import { f } from "@/lib/i18n/config";
import { LEGAL } from "@/lib/i18n/legal";
import { getI18n, titleFor } from "@/lib/i18n/server";
import { TERMS_VERSION } from "@/lib/operator";

export const generateMetadata = titleFor("terms");

export default async function TermsPage() {
  const { locale } = await getI18n();
  const L = LEGAL[locale];
  const [before, privacy, middle, imprint] = L.terms.seeAlso;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <span className="pill pill-signal">{L.draft}</span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{L.terms.title}</h1>
        <p className="mt-2 text-muted">
          {f(L.terms.version, { v: TERMS_VERSION })} {before}
          <Link href="/privacy" className="underline">{privacy}</Link>
          {middle}
          <Link href="/imprint" className="underline">{imprint}</Link>.
        </p>
        {L.binding ? <p className="notice mt-4 text-sm">{L.binding}</p> : null}
        <div className="mt-8 flex flex-col gap-8">
          {L.terms.sections.map(([title, paragraphs]) => (
            <section key={title}>
              <h2 className="text-xl font-bold">{title}</h2>
              <div className="mt-2 flex flex-col gap-2">
                {paragraphs.map((p) => <p key={p}>{p}</p>)}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
