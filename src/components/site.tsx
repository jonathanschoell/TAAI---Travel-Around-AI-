import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="TAAI home">
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-ink font-display text-lg font-extrabold">
        T
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        TAAI
        <span className="ml-1 inline-block size-2 rounded-full bg-signal align-baseline" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Logo />
      <nav className="flex items-center gap-2" aria-label="Account">
        <Link href="/login" className="btn btn-ghost">Log in</Link>
        <Link href="/register" className="btn btn-primary hidden sm:inline-flex">Create account</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
        <p>TAAI — Travel Around AI</p>
        <nav className="flex gap-4" aria-label="Legal">
          <Link href="/privacy" className="underline">Privacy</Link>
          <Link href="/imprint" className="underline">Imprint</Link>
        </nav>
      </div>
    </footer>
  );
}

export function AuthShell({
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
  return (
    <>
      <header className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-muted">{lead}</p>
        <div className="card mt-6">{children}</div>
        {footer ? <div className="mt-4 text-sm text-muted">{footer}</div> : null}
      </main>
      <SiteFooter />
    </>
  );
}

export function SetupNotice() {
  return (
    <p className="notice">
      Sign-in is not connected yet. Add the Supabase keys to the hosting environment as
      described in SETUP.md, then redeploy.
    </p>
  );
}
