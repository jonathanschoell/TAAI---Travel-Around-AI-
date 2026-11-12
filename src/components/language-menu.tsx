"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/lib/i18n/config";
import { setLanguage } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/client";

/** Lets visitors switch the site language. The choice is kept in a cookie (and in the profile when signed in). */
export function LanguageMenu() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function choose(code: string) {
    setOpen(false);
    if (code === locale) return;
    start(async () => {
      await setLanguage(code);
      router.refresh();
    });
  }

  return (
    <div ref={box} className="relative">
      <button type="button" className="btn btn-ghost px-3" aria-haspopup="true" aria-expanded={open}
        aria-label={`${t.language.label}: ${current.name}`} disabled={pending} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        <span>{current.short}</span>
      </button>
      {open ? (
        <ul className="card absolute right-0 top-full z-50 mt-2 w-56 p-2 shadow-lg" aria-label={t.language.menu}>
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button type="button" lang={l.code} onClick={() => choose(l.code)}
                aria-current={l.code === locale ? "true" : undefined}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-surface ${l.code === locale ? "font-semibold" : ""}`}>
                <span>{l.name}</span>
                {l.code === locale ? <span className="text-brand" aria-label={t.language.selected}>✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
