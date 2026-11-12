import { PublicHeader, SiteFooter } from "@/components/site";
import { LEGAL } from "@/lib/i18n/legal";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("privacy");

export default async function PrivacyPage() {
  const { locale } = await getI18n();
  const L = LEGAL[locale];
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <span className="pill pill-signal">{L.draft}</span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{L.privacy.title}</h1>
        <p className="mt-2 text-muted">{L.privacy.lead}</p>
        {L.binding ? <p className="notice mt-4 text-sm">{L.binding}</p> : null}
        <div className="mt-8 flex flex-col gap-8">
          {L.privacy.sections.map(([title, items]) => (
            <section key={title}>
              <h2 className="text-xl font-bold">{title}</h2>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
