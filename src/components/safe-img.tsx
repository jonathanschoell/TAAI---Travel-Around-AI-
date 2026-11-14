"use client";

import { useState } from "react";

/** Image that removes its whole figure when it fails to load, so no broken-image icon appears. */
export function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" decoding="async" className={className}
      onError={(e) => {
        e.currentTarget.closest("figure")?.setAttribute("hidden", "");
        setFailed(true);
      }} />
  );
}
