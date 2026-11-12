"use client";

import { useActionState, useState } from "react";
import { createTrip, type PlanFormState } from "@/app/(app)/plan/actions";
import { CURRENCIES } from "@/lib/options";
import { cantonByCode, cantonsFor, nearestAirports } from "@/lib/swiss";
import { f } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
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
  const { t: all, locale } = useI18n();
  const t = all.plan;
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
      setLocError(t.geoUnsupported);
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
        setLocError(t.geoDenied);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <section className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="md:col-span-2 lg:col-span-4">
        <h2 className="text-xl font-bold">{t.whereStart}</h2>
        <p className="mt-1 text-sm text-muted">{t.whereStartLead}</p>
      </div>
      <div className="field md:col-span-2">
        <label htmlFor="pl-origin">{t.homeTown}</label>
        <input id="pl-origin" name="origin" className="input" maxLength={120} autoComplete="address-level2"
          placeholder={t.homeTownPlaceholder} defaultValue={text(values, "origin", defaults.homePlace)} />
      </div>
      <div className="field">
        <label htmlFor="pl-canton">{t.canton}</label>
        <select id="pl-canton" name="home_canton" className="input" value={canton}
          onChange={(e) => setCanton(e.target.value)}>
          <option value="">{t.cantonNone}</option>
          {cantonsFor(locale).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <span className="label">{t.exactLocation}</span>
        {coords ? (
          <button type="button" className="btn btn-ghost" onClick={() => setCoords(null)}>
            {t.stopLocation}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={locate} disabled={locating}>
            {locating ? t.locating : t.useLocation}
          </button>
        )}
        <span className="hint">{locError || t.locationHint}</span>
      </div>
      {coords ? (
        <>
          <input type="hidden" name="home_lat" value={coords.lat} />
          <input type="hidden" name="home_lng" value={coords.lng} />
        </>
      ) : null}
      {airports.length ? (
        <div className="md:col-span-2 lg:col-span-4">
          <p className="label">{coords ? t.nearestToLocation : f(t.nearestTo, { place: cantonByCode(canton)?.capital ?? "" })}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {airports.map((a) => (
              <li key={a.code} className="pill">
                <span className="font-bold">{a.code}</span> {a.name} · {a.km} km
              </li>
            ))}
          </ul>
          <p className="hint mt-1.5">
            {t.airportsHint}
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
  const { t: all } = useI18n();
  const t = all.plan;
  const o = all.options;
  const named = (pairs: [string, string][], names: Record<string, string>): [string, string][] =>
    pairs.map(([k, fallback]) => [k, names[k] ?? fallback]);
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
        <h2 className="text-xl font-bold md:col-span-2 lg:col-span-4">{t.whereWhen}</h2>
        <div className="field md:col-span-2 lg:col-span-4">
          <label htmlFor="pl-destination">{t.destination}</label>
          <input id="pl-destination" name="destination" className="input" required maxLength={120}
            placeholder={t.destinationPlaceholder} defaultValue={v("destination")} />
        </div>
        <div className="field">
          <label htmlFor="pl-start">{t.startDate}</label>
          <input id="pl-start" name="start_date" type="date" className="input" required defaultValue={v("start_date", defaults.startDate ?? "")} />
        </div>
        <div className="field">
          <label htmlFor="pl-end">{t.endDate}</label>
          <input id="pl-end" name="end_date" type="date" className="input" required defaultValue={v("end_date", defaults.endDate ?? "")} />
          <span className="hint">{f(t.upToDays, { n: maxDays })}</span>
        </div>
        <div className="field">
          <label htmlFor="pl-budget">{t.budget}</label>
          <input id="pl-budget" name="budget" type="number" min={0} step={50} inputMode="numeric"
            className="input" placeholder={all.common.optional} defaultValue={v("budget")} />
        </div>
        <div className="field">
          <label htmlFor="pl-currency">{t.currency}</label>
          <select id="pl-currency" name="currency" className="input" defaultValue={v("currency", defaults.currency)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      <HomeFields values={values} defaults={defaults} />

      <section className="card flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">{t.stops}</h2>
          <p className="mt-1 text-sm text-muted">{t.stopsLead}</p>
        </div>
        {stops.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {stops.map((s, i) => (
              <li key={i} className="grid gap-3 rounded-2xl border border-line p-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
                <div className="field">
                  <label htmlFor={`pl-stop-place-${i}`}>{f(t.stopN, { n: i + 1 })}</label>
                  <input id={`pl-stop-place-${i}`} name="stop_place" className="input" required maxLength={80}
                    placeholder={t.stopPlaceholder} value={s.place} onChange={(e) => setStop(i, { place: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`pl-stop-from-${i}`}>{t.from}</label>
                  <input id={`pl-stop-from-${i}`} name="stop_from" type="date" className="input" required
                    value={s.from} onChange={(e) => setStop(i, { from: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`pl-stop-to-${i}`}>{t.until}</label>
                  <input id={`pl-stop-to-${i}`} name="stop_to" type="date" className="input" required
                    value={s.to} onChange={(e) => setStop(i, { to: e.target.value })} />
                </div>
                <button type="button" className="btn btn-ghost"
                  onClick={() => setStops((current) => current.filter((_, j) => j !== i))}>
                  {all.common.remove}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {stops.length < MAX_STOPS ? (
          <button type="button" className="btn btn-ghost sm:w-fit"
            onClick={() => setStops((current) => [...current, { place: "", from: "", to: "" }])}>
            {t.addStop}
          </button>
        ) : (
          <p className="hint">{f(t.maxStops, { n: MAX_STOPS })}</p>
        )}
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t.who}</h2>
        <fieldset className="field">
          <legend className="label mb-1.5">{t.travellingAs}</legend>
          <div className="flex flex-wrap gap-2">
            {named(PARTY_TYPES, o.party).map(([key, name]) => (
              <label key={key} className="chip">
                <input type="radio" name="party" value={key} checked={party === key}
                  onChange={() => chooseParty(key)} className="sr-only" />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="label">
            {f(ages.length === 1 ? t.travellerOne : t.travellerOther, { n: ages.length })}
          </p>
          <p className="hint mt-0.5">
            {isGroup
              ? t.agesGroup
              : t.agesOptional}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ages.map((age, i) => (
              <li key={i} className="flex items-end gap-2">
                <div className="field flex-1">
                  <label htmlFor={`pl-age-${i}`}>{f(t.personAge, { n: i + 1 })}</label>
                  <input id={`pl-age-${i}`} name="ages" type="number" min={0} max={120} inputMode="numeric"
                    className="input" required={isGroup} placeholder={isGroup ? t.age : all.common.optional}
                    value={age} onChange={(e) => setAge(i, e.target.value)} />
                </div>
                {isGroup && ages.length > min ? (
                  <button type="button" className="btn btn-ghost px-3" aria-label={f(t.removePerson, { n: i + 1 })}
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
              {t.addPerson}
            </button>
          ) : null}
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t.enjoy}</h2>
        <fieldset>
          <legend className="label mb-1.5">{t.interests}</legend>
          <div className="flex flex-wrap gap-2">
            {named(INTERESTS, o.interests).map(([key, name]) => (
              <label key={key} className="chip">
                <input type="checkbox" name="interests" value={key} defaultChecked={interests.includes(key)} className="sr-only" />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 lg:grid-cols-2">
          <Choice name="pace" legend={t.pace} options={named(PACES, o.pace)} value={v("pace", "balanced")} />
          <Choice name="level" legend={t.comfort} options={named(LEVELS, o.level)} value={v("level", "mid")} />
          <Choice name="lodging" legend={t.lodging} options={named(LODGING, o.lodging)} value={v("lodging", "any")} />
          <Choice name="travel_mode" legend={t.travelMode} options={named(TRAVEL_MODES, o.travelMode)} value={v("travel_mode", "any")} />
        </div>
      </section>

      <section className="card grid gap-4 lg:grid-cols-2">
        <h2 className="text-xl font-bold lg:col-span-2">{t.anythingElse}</h2>
        <div className="field">
          <label htmlFor="pl-wishes">{t.wishes}</label>
          <textarea id="pl-wishes" name="wishes" rows={3} maxLength={600} className="input py-3"
            placeholder={t.wishesPlaceholder} defaultValue={v("wishes")} />
        </div>
        <div className="field">
          <label htmlFor="pl-constraints">{t.constraints}</label>
          <textarea id="pl-constraints" name="constraints" rows={3} maxLength={600} className="input py-3"
            placeholder={t.constraintsPlaceholder} defaultValue={v("constraints")} />
          <span className="hint">{t.constraintsHint}</span>
        </div>
      </section>

      <div className="flex flex-col gap-3" aria-live="polite">
        {error ? <p className="notice notice-error">{error}</p> : null}
        {pending ? (
          <p className="notice">
            {t.planning}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary sm:w-fit" disabled={pending}>
          {pending ? t.planningButton : t.submit}
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
