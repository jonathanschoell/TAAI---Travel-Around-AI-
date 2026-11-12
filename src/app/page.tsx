import Link from "next/link";
import { LANGUAGES } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { PublicHeader, SiteFooter } from "@/components/site";

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const h = t.home;
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20 lg:pt-12">
          <div>
            <p className="pill">{h.kicker}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              {h.titleStart} <span className="text-brand">{h.titleHighlight}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{h.lead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">{h.createAccount}</Link>
              <Link href="/login" className="btn btn-ghost">{h.logIn}</Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{h.languages}</span>
              {LANGUAGES.map((l) => (
                <span key={l.code} lang={l.code} className={l.code === locale ? "pill pill-signal" : "pill"}>
                  {l.name}
                </span>
              ))}
            </p>
            <p className="mt-4 text-sm text-muted">{h.earlyAccess}</p>
          </div>

          <aside className="card relative" aria-label={h.example.label}>
            <span className="pill pill-signal absolute -top-3 right-5">{h.example.badge}</span>
            <p className="text-sm font-semibold text-muted">{h.example.meta}</p>
            <h2 className="mt-1 text-2xl font-extrabold">{h.example.title}</h2>
            <p className="mt-2 text-sm text-muted">{h.example.route}</p>
            <ol className="mt-4 flex flex-col">
              {h.example.slots.map(([slot, what, cost]) => (
                <li key={slot} className="grid grid-cols-[6.5rem_1fr] gap-3 border-t border-line py-3">
                  <span className="font-display text-sm font-bold text-brand">{slot}</span>
                  <span>
                    {what}
                    <span className="mt-1 block text-sm text-muted">{cost}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="border-t border-line pt-3 text-sm text-muted">{h.example.footer}</p>
          </aside>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{h.howTitle}</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {h.steps.map(([title, body], i) => (
                <li key={title}>
                  <p className="font-display text-5xl font-extrabold text-signal">{i + 1}</p>
                  <h3 className="mt-2 text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{h.dataTitle}</h2>
          <p className="mt-2 max-w-2xl text-muted">{h.dataLead}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {h.promises.map(([title, body]) => (
              <article key={title} className="card">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
