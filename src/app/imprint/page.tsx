import type { Metadata } from "next";
import { PublicHeader, SiteFooter } from "@/components/site";
import { OPERATOR, operatorComplete } from "@/lib/operator";

export const metadata: Metadata = { title: "Imprint" };

const missing = <span className="text-danger">[to be completed]</span>;

export default function ImprintPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {operatorComplete ? null : <span className="pill pill-signal">Incomplete: operator details missing</span>}
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Imprint</h1>

        <section className="mt-6">
          <h2 className="text-xl font-bold">Operator of this website</h2>
          <address className="mt-2 not-italic leading-relaxed">
            {OPERATOR.name || missing}<br />
            {OPERATOR.street || missing}<br />
            {OPERATOR.postalCodeAndCity || missing}<br />
            {OPERATOR.country}
          </address>
          {OPERATOR.uid ? <p className="mt-2">Company number (UID): {OPERATOR.uid}</p> : null}
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-bold">Contact</h2>
          <p className="mt-2">Email: {OPERATOR.email || missing}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-bold">About the content</h2>
          <p className="mt-2 text-muted">
            Itineraries on Jovia are created by artificial intelligence. Prices, opening hours
            and availability are estimates and are not checked by a person. Please verify
            important details with the provider before you book or travel.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-bold">Links to other websites</h2>
          <p className="mt-2 text-muted">
            Jovia links to websites of third parties, for example maps. Their operators are
            responsible for the content of those sites.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
