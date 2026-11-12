"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/languages";

/** Shows the available languages. Languages that are not translated yet are marked and cannot be chosen. */
export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={box} className="relative">
      <button type="button" className="btn btn-ghost px-3" aria-haspopup="true" aria-expanded={open}
        aria-label="Language: English" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        <span>EN</span>
      </button>
      {open ? (
        <ul className="card absolute right-0 top-full z-50 mt-2 w-64 p-2 shadow-lg" aria-label="Languages">
          {LANGUAGES.map((l) => (
            <li key={l.code}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${l.ready ? "font-semibold" : "text-muted"}`}
              aria-current={l.ready ? "true" : undefined}>
              <span lang={l.code}>{l.name}</span>
              {l.ready ? (
                <span className="text-brand" aria-label="Selected">✓</span>
              ) : (
                <span className="pill whitespace-nowrap">Coming soon</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
