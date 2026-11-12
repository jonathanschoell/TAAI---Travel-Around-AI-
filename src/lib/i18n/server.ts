import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { fromAcceptLanguage, intlTag, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { DICTS } from "./dictionaries";

/** The visitor's language: their choice (cookie), otherwise the browser language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return fromAcceptLanguage((await headers()).get("accept-language"));
});

/** Texts and formatting helpers for the visitor's language. */
export async function getI18n() {
  const locale = await getLocale();
  const tag = intlTag(locale);
  return {
    locale,
    t: DICTS[locale],
    /** Formats a YYYY-MM-DD date. */
    date: (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
      iso ? new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso).toLocaleDateString(tag, { timeZone: "UTC", ...opts }) : "",
    dateTime: (iso: string | null | undefined) =>
      iso ? new Date(iso).toLocaleString(tag, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Zurich" }) : "—",
    number: (n: number) => Math.round(n).toLocaleString(tag),
  };
}

/** generateMetadata for a page whose title is one of the meta texts. */
export function titleFor(key: Exclude<keyof (typeof DICTS)["en"]["meta"], "description">) {
  return async (): Promise<Metadata> => ({ title: DICTS[await getLocale()].meta[key] });
}
