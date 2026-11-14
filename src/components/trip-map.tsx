"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = { lat: number; lng: number; name: string; day: number; slot: string };

/** One colour per day, repeated after seven days; numbers in the markers carry the day too. */
const COLORS = ["#1d4fd8", "#d9480f", "#0b8457", "#a61e4d", "#5f3dc4", "#c08a00", "#0c7a8a"];
const color = (day: number) => COLORS[(day - 1) % COLORS.length];

const TILES = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Map of the itinerary: every activity with known coordinates, connected in visiting
 * order for each day. Buttons above the map show one day at a time.
 */
export function TripMap({
  points,
  labels,
}: {
  points: MapPoint[];
  labels: { all: string; day: string; title: string };
}) {
  const box = useRef<HTMLDivElement>(null);
  const [day, setDay] = useState(0);
  const days = [...new Set(points.map((p) => p.day))].sort((a, b) => a - b);

  useEffect(() => {
    const el = box.current;
    if (!el || !points.length) return;
    let disposed = false;
    let cleanup = () => {};
    import("leaflet").then((L) => {
      if (disposed) return;
      const map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer(TILES, { maxZoom: 18, attribution: ATTRIBUTION }).addTo(map);
      const shown = points.filter((p) => day === 0 || p.day === day);
      const group = L.featureGroup();
      for (const d of [...new Set(shown.map((p) => p.day))]) {
        const route = shown.filter((p) => p.day === d);
        if (route.length > 1) {
          L.polyline(route.map((p) => [p.lat, p.lng] as [number, number]), {
            color: color(d), weight: 3, opacity: 0.6, dashArray: "6 6",
          }).addTo(group);
        }
        route.forEach((p) => {
          const icon = L.divIcon({
            className: "",
            html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:${color(d)};color:#fff;font:700 12px/1 system-ui,sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${d}</span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const tip = document.createElement("span");
          tip.textContent = `${labels.day.replace("{n}", String(d))} · ${p.slot}: ${p.name}`;
          L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name }).bindTooltip(tip).addTo(group);
        });
      }
      group.addTo(map);
      const bounds = group.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      else map.setView([46.8, 8.2], 7);
      cleanup = () => map.remove();
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [points, day, labels.day]);

  if (!points.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {days.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.title}>
          <button type="button" className={`chip-btn ${day === 0 ? "chip-btn-on" : ""}`} aria-pressed={day === 0} onClick={() => setDay(0)}>
            {labels.all}
          </button>
          {days.map((d) => (
            <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)}
              className={`chip-btn ${day === d ? "chip-btn-on" : ""}`}>
              <span className="inline-block size-2.5 rounded-full" style={{ background: color(d) }} aria-hidden="true" />
              {labels.day.replace("{n}", String(d))}
            </button>
          ))}
        </div>
      ) : null}
      <div ref={box} className="relative isolate z-0 h-[420px] w-full overflow-hidden rounded-2xl border border-line" role="region" aria-label={labels.title} />
    </div>
  );
}
