import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/site";

const SAMPLE_DAY = [
  ["Morning", "Lake promenade walk and the old town lanes", "Free"],
  ["Afternoon", "Cable car to the summit, picnic with a view", "est. CHF 96"],
  ["Evening", "Fondue in a family-run cellar restaurant", "est. CHF 140"],
];

const STEPS = [
  ["Tell Jovia who is travelling", "Ages, interests, dates, budget and the kind of holiday you want. Most fields are optional."],
  ["Get a plan made for you", "A full day-by-day itinerary with sensible routes, breaks, restaurants and a budget breakdown."],
  ["Change anything", "Swap an activity, replan a day, make it cheaper or calmer. The rest of your plan stays intact."],
];

const PROMISES = [
  ["You see what Jovia remembers", "Every remembered preference is listed in plain words. Edit or delete each one."],
  ["Personalisation is your choice", "Long-term memory only switches on when you agree, and you can turn it off at any time."],
  ["Estimates are labelled", "Prices and opening hours that are not verified are clearly marked as estimates."],
];

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-12">
          <div>
            <p className="pill">AI travel planner</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              A trip planned around <span className="text-brand">exactly who is going.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Jovia is your personal AI travel agency. It builds a complete itinerary from your
              interests, your budget and the people you travel with, and it gets to know your
              taste over time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">Create your account</Link>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              Early access: all prices in itineraries are estimates. Maps, photos and plan editing are being built next.
            </p>
          </div>

          <aside className="card relative" aria-label="Example itinerary">
            <span className="pill pill-signal absolute -top-3 right-5">Example</span>
            <p className="text-sm font-semibold text-muted">Day 2 of 5 · Lucerne · 2 adults, 2 children</p>
            <h2 className="mt-1 text-2xl font-extrabold">Lake, mountain, melted cheese</h2>
            <ol className="mt-4 flex flex-col">
              {SAMPLE_DAY.map(([slot, what, cost]) => (
                <li key={slot} className="grid grid-cols-[5.5rem_1fr] gap-3 border-t border-line py-3">
                  <span className="font-display text-sm font-bold text-brand">{slot}</span>
                  <span>
                    {what}
                    <span className="mt-1 block text-sm text-muted">{cost}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="border-t border-line pt-3 text-sm text-muted">
              Short walks between stops. A long lunch break is planned for the children.
            </p>
          </aside>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-extrabold sm:text-3xl">How it works</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {STEPS.map(([title, body], i) => (
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
          <h2 className="text-2xl font-extrabold sm:text-3xl">Your data stays yours</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Jovia works better the more it knows about how you travel, so it is built to be open
            about what it keeps.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PROMISES.map(([title, body]) => (
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
