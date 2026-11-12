"use client";

import { useActionState, useState } from "react";
import { createTrip, type PlanFormState } from "@/app/(app)/plan/actions";
import { CURRENCIES } from "@/lib/options";
import { CANTONS, cantonByCode, nearestAirports } from "@/lib/swiss";
import {
  INTERESTS, LEVELS, LODGING, MAX_STOPS, MAX_TRAVELLERS, PACES, PARTY_TYPES, TRAVEL_MODES,
} from "@/lib/planner/options";

const empty: PlanFormState = {};
type Values = NonNullable<PlanFormState["values"]>;

const text = (values: Values | undefined, key: string, fallback = "") => {
  const x = values?.[key];
  return typeof x === "string" ? x : fallback;
};
const list = (values: Values | undefined, key: string) => {
  const x = values?.[key];
  return Array.isArray(x) ? x : [];
};

function Choice({
  name, options, value, legend,
}: { name: string; options: [string, string][]; value: string; legend: string }) {
  return (
    <fieldset className="field">
      <legend className="label mb-1.5">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([key, label]) => (
          <label key={key} className="chip">
            <input type="radio" name={name} value={key} defaultChecked={value === key} className="sr-only" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** How many travellers a party type allows: [minimum, maximum]. */
const PARTY_SIZE: Record<string, [number, number]> = {
  solo: [1, 1],
  couple: [2, 2],
  friends: [2, MAX_TRAVELLERS],
  family: [2, MAX_TRAVELLERS],
};

type Stop = { place: string; from: string; to: string };
type Defaults = { currency: string; homePlace: string; homeCanton: string; startDate?: string; endDate?: string };

/** Home town, canton and optional device location; shows the nearest airports as you type. */
function HomeFields({ values, defaults }: { values: Values | undefined; defaults: Defaults }) {
  const [canton, setCanton] = useState(text(values, "home_canton", defaults.homeCanton));
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = Number(text(values, "home_lat"));
    const lng = Number(text(values, "home_lng"));
    return text(values, "home_lat") && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const point = coords ?? (cantonByCode(canton) ? { lat: cantonByCode(canton)!.lat, lng: cantonByCode(canton)!.lng } : null);
  const airports = point ? nearestAirports(point.lat, point.lng, 4) : [];

  function locate() {
    setLocError("");
    if (!("geolocation" in navigator)) {
      setLocError("Your browser does not offer location sharing.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        // Rounded to about one kilometre; used for this trip only and never stored.
        setCoords({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lng: Math.round(pos.coords.longitude * 100) / 100,
        });
      },
      () => {
        setLocating(false);
        setLocError("Location was not shared. Choose your canton instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <section className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="md:col-span-2 lg:col-span-4">
        <h2 className="text-xl font-bold">Where you start</h2>
        <p className="mt-1 text-sm text-muted">
          Optional. Jovia uses it to suggest the best departure airport and to check your
          canton&apos;s school holidays.
        </p>
      </div>
      <div className="field md:col-span-2">
        <label htmlFor="pl-origin">Home town</label>
        <input id="pl-origin" name="origin" className="input" maxLength={120} autoComplete="address-level2"
          placeholder="e.g. Bern" defaultValue={text(values, "origin", defaults.homePlace)} />
      </div>
      <div className="field">
        <label htmlFor="pl-canton">Canton</label>
        <select id="pl-canton" name="home_canton" className="input" value={canton}
          onChange={(e) => setCanton(e.target.value)}>
          <option value="">Not in Switzerland / not set</option>
          {CANTONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="label">Exact location</span>
        {coords ? (
          <button type="button" className="btn btn-ghost" onClick={() => setCoords(null)}>
            Stop using my location
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={locate} disabled={locating}>
            {locating ? "Locating…" : "Use my location"}
          </button>
        )}
        <span className="hint">{locError || "Optional. Used for this trip only, never saved."}</span>
      </div>
      {coords ? (
        <>
          <input type="hidden" name="home_lat" value={coords.lat} />
          <input type="hidden" name="home_lng" value={coords.lng} />
        </>
      ) : null}
      {airports.length ? (
        <div className="md:col-span-2 lg:col-span-4">
          <p className="label">Nearest airports {coords ? "to your location" : `to ${cantonByCode(canton)?.capital}`}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {airports.map((a) => (
              <li key={a.code} className="pill">
                <span className="font-bold">{a.code}</span> {a.name} · {a.km} km
              </li>
            ))}
          </ul>
          <p className="hint mt-1.5">
            Straight-line distance. Jovia weighs travel to the airport when it suggests where to fly from.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Fields({
  values, defaults, maxDays, pending, error,
}: {
  values: Values | undefined;
  defaults: Defaults;
  maxDays: number;
  pending: boolean;
  error?: string;
}) {
  const v = (key: string, fallback = "") => text(values, key, fallback);
  const interests = list(values, "interests");

  const [party, setParty] = useState(v("party", "couple"));
  const [ages, setAges] = useState<string[]>(() => {
    const kept = list(values, "ages");
    return kept.length ? kept : ["", ""];
  });
  const [stops, setStops] = useState<Stop[]>(() => {
    const places = list(values, "stop_place");
    const from = list(values, "stop_from");
    const to = list(values, "stop_to");
    return places.map((place, i) => ({ place, from: from[i] ?? "", to: to[i] ?? "" }));
  });

  const [min, max] = PARTY_SIZE[party] ?? [1, MAX_TRAVELLERS];
  const isGroup = party === "friends" || party === "family";

  function chooseParty(next: string) {
    const [lo, hi] = PARTY_SIZE[next] ?? [1, MAX_TRAVELLERS];
    setParty(next);
    setAges((current) => {
      const resized = current.slice(0, hi);
      while (resized.length < lo) resized.push("");
      return resized;
    });
  }
  const setAge = (i: number, value: string) =>
    setAges((current) => current.map((a, j) => (j === i ? value : a)));
  const setStop = (i: number, patch: Partial<Stop>) =>
    setStops((current) => current.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <>
      <section className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <h2 className="text-xl font-bold md:col-span-2 lg:col-span-4">Where and when</h2>
        <div className="field md:col-span-2 lg:col-span-4">
          <label htmlFor="pl-destination">Destination</label>
          <input id="pl-destination" name="destination" className="input" required maxLength={120}
            placeholder="City, region or country" defaultValue={v("destination")} />
        </div>
        <div className="field">
          <label htmlFor="pl-start">Start date</label>
          <input id="pl-start" name="start_date" type="date" className="input" required defaultValue={v("start_date", defaults.startDate ?? "")} />
        </div>
        <div className="field">
          <label htmlFor="pl-end">End date</label>
          <input id="pl-end" name="end_date" type="date" className="input" required defaultValue={v("end_date", defaults.endDate ?? "")} />
          <span className="hint">Up to {maxDays} days on your plan.</span>
        </div>
        <div className="field">
          <label htmlFor="pl-budget">Total budget</label>
          <input id="pl-budget" name="budget" type="number" min={0} step={50} inputMode="numeric"
            className="input" placeholder="Optional" defaultValue={v("budget")} />
        </div>
        <div className="field">
          <label htmlFor="pl-currency">Currency</label>
          <select id="pl-currency" name="currency" className="input" defaultValue={v("currency", defaults.currency)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      <HomeFields values={values} defaults={defaults} />

      <section className="card flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">Stops along the way</h2>
          <p className="mt-1 text-sm text-muted">
            Optional. Visiting several places, for example Tokyo, Kyoto and Osaka? Add each
            place with the dates you will be there, and Jovia plans every day in the right city.
          </p>
        </div>
        {stops.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {stops.map((s, i) => (
              <li key={i} className="grid gap-3 rounded-2xl border border-line p-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
                <div className="field">
                  <label htmlFor={`pl-stop-place-${i}`}>Stop {i + 1}</label>
                  <input id={`pl-stop-place-${i}`} name="stop_place" className="input" required maxLength={80}
                    placeholder="City or place" value={s.place} onChange={(e) => setStop(i, { place: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`pl-stop-from-${i}`}>From</label>
                  <input id={`pl-stop-from-${i}`} name="stop_from" type="date" className="input" required
                    value={s.from} onChange={(e) => setStop(i, { from: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`pl-stop-to-${i}`}>Until</label>
                  <input id={`pl-stop-to-${i}`} name="stop_to" type="date" className="input" required
                    value={s.to} onChange={(e) => setStop(i, { to: e.target.value })} />
                </div>
                <button type="button" className="btn btn-ghost"
                  onClick={() => setStops((current) => current.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {stops.length < MAX_STOPS ? (
          <button type="button" className="btn btn-ghost sm:w-fit"
            onClick={() => setStops((current) => [...current, { place: "", from: "", to: "" }])}>
            Add a stop
          </button>
        ) : (
          <p className="hint">You can add up to {MAX_STOPS} stops.</p>
        )}
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold">Who is travelling</h2>
        <fieldset className="field">
          <legend className="label mb-1.5">Travelling as</legend>
          <div className="flex flex-wrap gap-2">
            {PARTY_TYPES.map(([key, label]) => (
              <label key={key} className="chip">
                <input type="radio" name="party" value={key} checked={party === key}
                  onChange={() => chooseParty(key)} className="sr-only" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="label">
            {ages.length} {ages.length === 1 ? "traveller" : "travellers"}
          </p>
          <p className="hint mt-0.5">
            {isGroup
              ? "Enter the age of every person, children included, so activities fit everyone."
              : "Age is optional, and helps Jovia choose fitting activities."}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ages.map((age, i) => (
              <li key={i} className="flex items-end gap-2">
                <div className="field flex-1">
                  <label htmlFor={`pl-age-${i}`}>Person {i + 1}: age</label>
                  <input id={`pl-age-${i}`} name="ages" type="number" min={0} max={120} inputMode="numeric"
                    className="input" required={isGroup} placeholder={isGroup ? "Age" : "Optional"}
                    value={age} onChange={(e) => setAge(i, e.target.value)} />
                </div>
                {isGroup && ages.length > min ? (
                  <button type="button" className="btn btn-ghost px-3" aria-label={`Remove person ${i + 1}`}
                    onClick={() => setAges((current) => current.filter((_, j) => j !== i))}>
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {isGroup && ages.length < max ? (
            <button type="button" className="btn btn-ghost mt-3 sm:w-fit"
              onClick={() => setAges((current) => [...current, ""])}>
              Add a person
            </button>
          ) : null}
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold">What you enjoy</h2>
        <fieldset>
          <legend className="label mb-1.5">Interests (choose any)</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(([key, label]) => (
              <label key={key} className="chip">
                <input type="checkbox" name="interests" value={key} defaultChecked={interests.includes(key)} className="sr-only" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 lg:grid-cols-2">
          <Choice name="pace" legend="Pace" options={PACES} value={v("pace", "balanced")} />
          <Choice name="level" legend="Comfort level" options={LEVELS} value={v("level", "mid")} />
          <Choice name="lodging" legend="Accommodation" options={LODGING} value={v("lodging", "any")} />
          <Choice name="travel_mode" legend="Preferred way to travel" options={TRAVEL_MODES} value={v("travel_mode", "any")} />
        </div>
      </section>

      <section className="card grid gap-4 lg:grid-cols-2">
        <h2 className="text-xl font-bold lg:col-span-2">Anything else</h2>
        <div className="field">
          <label htmlFor="pl-wishes">Special wishes</label>
          <textarea id="pl-wishes" name="wishes" rows={3} maxLength={600} className="input py-3"
            placeholder="Optional. A birthday dinner, a must-see place, a surprise…" defaultValue={v("wishes")} />
        </div>
        <div className="field">
          <label htmlFor="pl-constraints">Restrictions or requirements</label>
          <textarea id="pl-constraints" name="constraints" rows={3} maxLength={600} className="input py-3"
            placeholder="Optional. Step-free access, vegetarian, no long drives…" defaultValue={v("constraints")} />
          <span className="hint">Used for this trip only. Never added to long-term memory.</span>
        </div>
      </section>

      <div className="flex flex-col gap-3" aria-live="polite">
        {error ? <p className="notice notice-error">{error}</p> : null}
        {pending ? (
          <p className="notice">
            Jovia is planning your trip. This usually takes one to two minutes. Please keep this page open.
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary sm:w-fit" disabled={pending}>
          {pending ? "Planning your trip…" : "Create my itinerary"}
        </button>
      </div>
    </>
  );
}

export function PlanForm({
  defaults,
  maxDays,
}: {
  defaults: Defaults;
  maxDays: number;
}) {
  const [state, action, pending] = useActionState(createTrip, empty);
  // After a failed attempt the fields are rebuilt from what was entered.
  const attempt = state.values ? JSON.stringify(state.values) : "new";
  return (
    <form action={action} className="flex flex-col gap-6">
      <Fields key={attempt} values={state.values} defaults={defaults} maxDays={maxDays}
        pending={pending} error={state.error} />
    </form>
  );
}
