import Link from "next/link";
import { LanguageMenu } from "@/components/language-menu";
import { Wordmark } from "@/components/wordmark";
import { getI18n } from "@/lib/i18n/server";

export function Logo({ href = "/" }: { href?: string }) {
  return <Wordmark href={href} />;
}

export async function PublicHeader() {
  const { t } = await getI18n();
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Logo />
      <nav className="flex items-center gap-2" aria-label={t.site.accountNav}>
        <LanguageMenu />
        <Link href="/login" className="btn btn-ghost">{t.site.logIn}</Link>
        <Link href="/register" className="btn btn-primary hidden sm:inline-flex">{t.site.createAccount}</Link>
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
        <p>{t.site.tagline}</p>
        <nav className="flex flex-wrap gap-4" aria-label={t.site.legalNav}>
          <Link href="/pricing" className="underline">{t.site.pricing}</Link>
          <Link href="/terms" className="underline">{t.site.terms}</Link>
          <Link href="/privacy" className="underline">{t.site.privacy}</Link>
          <Link href="/imprint" className="underline">{t.site.imprint}</Link>
        </nav>
      </div>
    </footer>
  );
}

export async function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = await getI18n();
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Logo />
        <LanguageMenu />
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-10">
        <section className="order-2 hidden rounded-[28px] bg-brand p-10 text-brand-ink lg:order-1 lg:block">
          <p className="font-display text-sm font-bold uppercase tracking-widest opacity-80">
            {t.site.authKicker}
          </p>
          <p className="mt-4 font-display text-4xl font-extrabold leading-tight">{t.site.authHeadline}</p>
          <ul className="mt-8 flex flex-col gap-4 text-lg">
            {t.site.authPoints.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="order-1 mx-auto w-full max-w-md lg:order-2 lg:mx-0 lg:max-w-none">
          <h1 className="text-3xl font-extrabold lg:text-4xl">{title}</h1>
          <p className="mt-2 text-muted">{lead}</p>
          <div className="card mt-6">{children}</div>
          {footer ? <div className="mt-4 text-sm text-muted">{footer}</div> : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
