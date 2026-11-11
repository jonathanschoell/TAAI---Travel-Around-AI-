import type { Metadata } from "next";
import { PublicHeader, SiteFooter } from "@/components/site";

export const metadata: Metadata = { title: "Imprint" };

export default function ImprintPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <span className="pill pill-signal">To be completed</span>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Imprint</h1>
        <p className="mt-2 text-muted">
          The operator&apos;s name, postal address and contact email will be published here
          before public launch.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
