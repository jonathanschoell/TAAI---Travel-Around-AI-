import Link from "next/link";

/** The Jovia mark: a lowercase "j" whose dot is the destination at the end of a route. */
export function Mark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="jovia-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82ff" />
          <stop offset="1" stopColor="#1a3fc4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#jovia-mark)" />
      <path d="M13 37C15 22 25 13 38 13.5" fill="none" stroke="#fff" strokeOpacity=".55"
        strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 6.2" />
      <path d="M39 26V39.5A11.5 11.5 0 0 1 27.5 51H24" fill="none" stroke="#fff"
        strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="39" cy="14" r="5" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Jovia home">
      <Mark />
      <span className="font-display text-2xl font-extrabold tracking-tight">Jovia</span>
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
        <p>Jovia · AI travel planner</p>
        <nav className="flex gap-4" aria-label="Legal">
          <Link href="/pricing" className="underline">Pricing</Link>
          <Link href="/privacy" className="underline">Privacy</Link>
          <Link href="/imprint" className="underline">Imprint</Link>
        </nav>
      </div>
    </footer>
  );
}

const AUTH_POINTS = [
  "Day-by-day itineraries built around the people travelling.",
  "Only you can see your trips and preferences.",
  "You decide what Jovia remembers, and can delete it at any time.",
];

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
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-10">
        <section className="order-2 hidden rounded-[28px] bg-brand p-10 text-brand-ink lg:order-1 lg:block">
          <p className="font-display text-sm font-bold uppercase tracking-widest opacity-80">
            AI travel planner
          </p>
          <p className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Your trips, your taste, one private place.
          </p>
          <ul className="mt-8 flex flex-col gap-4 text-lg">
            {AUTH_POINTS.map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                <span>{t}</span>
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
