"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const LETTERS = ["J", "O", "V", "I", "A"];
/** How long the plane takes to cross the screen. Keep in sync with the CSS animation. */
const FLIGHT_MS = 2600;
const START_X = -90;

/**
 * The JOVIA wordmark. Every time the site is opened or reloaded, a plane crosses the
 * top of the screen and drops the letters into place. The intro is switched on by a
 * small script in the root layout (html.jovia-intro) and skipped for people who prefer
 * reduced motion.
 */
export function Wordmark({ href = "/" }: { href?: string }) {
  const word = useRef<HTMLSpanElement>(null);
  const plane = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!document.documentElement.classList.contains("jovia-intro")) return;
    if (!word.current || !plane.current) return;

    // Time each letter to fall exactly when the plane passes over it.
    const box = word.current.getBoundingClientRect();
    const end = window.innerWidth + 90;
    const top = Math.max(4, box.top - 34);
    plane.current.style.setProperty("--jw-top", `${Math.round(top)}px`);
    plane.current.style.setProperty("--jw-from", `${START_X}px`);
    plane.current.style.setProperty("--jw-to", `${Math.round(end)}px`);
    word.current.querySelectorAll<HTMLElement>("[data-letter]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const centre = r.left + r.width / 2;
      const delay = (FLIGHT_MS * (centre - START_X)) / (end - START_X);
      el.style.setProperty("--jw-delay", `${Math.round(delay)}ms`);
      el.style.setProperty("--jw-drop", `${Math.max(16, Math.round(r.top - top - 8))}px`);
    });
  }, []);

  return (
    <>
      <Link href={href} className="inline-flex shrink-0 items-center whitespace-nowrap" aria-label="Jovia home">
        <span ref={word} aria-hidden="true"
          className="font-display text-[1.45rem] leading-none font-extrabold tracking-[0.12em] whitespace-nowrap text-brand sm:text-[1.7rem]">
          {LETTERS.map((letter, i) => (
            <span key={letter + i} data-letter className="jw-letter inline-block"
              style={{ ["--jw-delay" as string]: `${300 + i * 140}ms` }}>
              {letter}
            </span>
          ))}
        </span>
      </Link>
      <span ref={plane} className="jw-plane" aria-hidden="true">
        <span className="jw-trail" />
        <svg viewBox="0 0 48 24" className="jw-plane-svg">
          <path d="M3 12.6 36 10.4c6-.4 10 .4 10 1.6s-4 2-10 1.6Z" />
          <path d="M21 11.3 13.5 2h4.2l12.2 9.1Z" />
          <path d="M21 13.2 14.5 22h4.2l11-8.6Z" />
          <path d="M5 12.1 2 5h3.4l5.6 6.6Z" />
        </svg>
      </span>
    </>
  );
}
