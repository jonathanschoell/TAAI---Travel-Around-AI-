import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { LanguageMenu } from "@/components/language-menu";
import { Logo, SiteFooter } from "@/components/site";
import { getI18n } from "@/lib/i18n/server";
import { getProfile, isAdminUser, requireUser, touchLastSeen } from "@/lib/auth";

async function AppNav() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  await touchLastSeen(profile);
  const { t } = await getI18n();

  const links = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/plan", label: t.nav.plan },
    { href: "/holidays", label: t.nav.holidays },
    { href: "/profile", label: t.nav.profile },
    { href: "/my-data", label: t.nav.myData },
    ...(isAdminUser(user) ? [{ href: "/admin", label: t.nav.admin }] : []),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <Logo href="/dashboard" />
      <div className="order-2 flex items-center gap-2 sm:order-3">
        <LanguageMenu />
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost">{t.nav.logOut}</button>
        </form>
      </div>
      <nav aria-label={t.nav.main} className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className="whitespace-nowrap rounded-full px-3 py-3 text-sm font-semibold hover:bg-surface">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
          <Suspense fallback={<Logo href="/dashboard" />}>
            <AppNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<p className="text-muted">…</p>}>{children}</Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
