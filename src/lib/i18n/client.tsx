"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { ClientDict } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; t: ClientDict } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: ClientDict; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

/** Texts for interactive (client) components. */
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
