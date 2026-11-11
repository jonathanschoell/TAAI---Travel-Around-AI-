"use client";

import { useActionState } from "react";
import { createTrip, type PlanFormState } from "@/app/(app)/plan/actions";
import { AGE_GROUPS, CURRENCIES } from "@/lib/options";
import {
  INTERESTS, LEVELS, LODGING, MAX_TRIP_DAYS, PACES, PARTY_TYPES, TRAVEL_MODES,
} from "@/lib/planner/options";

const empty: PlanFormState = {};

function Choice({
  name, options, value, legend,
}: { name: string; options: [string, string][]; value: string; legend: string }) {
  return (
    <fieldset className="field">
      <legend className="label mb-1.5">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([key, text]) => (
          <label key={key} className="chip">
            <input type="radio" name={name} value={key} defaultChecked={value === key} className="sr-only" />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PlanForm({
  defaults,
}: {
  defaults: { currency: string; travelers: number; ageGroup: string };
}) {
  const [state, action, pending] = useActionState(createTrip, empty);
  const v = (key: string, fallback = "") => {
    const x = state.values?.[key];
    return typeof x === "string" ? x : fallback;
  };
  const chosen = state.values?.interests;
  const interests = Array.isArray(chosen) ? chosen : [];
  // Re-mount the form after a failed attempt so the entered values are restored.
  const formKey = state.values ? JSON.stringify(state.values).length + (state.error ?? "") : "new";

  return (
    <form action={action} key={formKey} className="flex flex-col gap-6">
      <section className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <h2 className="text-xl font-bold md:col-span-2 lg:col-span-4">Where and when</h2>
        <div className="field md:col-span-2">
          <label htmlFor="pl-destination">Destination</label>
          <input id="pl-destination" name="destination" className="input" required maxLength={120}
            placeholder="City, region or country" defaultValue={v("destination")} />
        </div>
        <div className="field md:col-span-2">
          <label htmlFor="pl-origin">Departing from</label>
          <input id="pl-origin" name="origin" className="input" maxLength={120}
            placeholder="Optional" defaultValue={v("origin")} />
        </div>
        <div className="field">
          <label htmlFor="pl-start">Start date</label>
          <input id="pl-start" name="start_date" type="date" className="input" required defaultValue={v("start_date")} />
        </div>
        <div className="field">
          <label htmlFor="pl-end">End date</label>
          <input id="pl-end" name="end_date" type="date" className="input" required defaultValue={v("end_date")} />
          <span className="hint">Up to {MAX_TRIP_DAYS} days for now.</span>
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

      <section className="card grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <h2 className="text-xl font-bold md:col-span-2 lg:col-span-4">Who is travelling</h2>
        <div className="md:col-span-2 lg:col-span-4">
          <Choice name="party" legend="Travelling as" options={PARTY_TYPES} value={v("party", "couple")} />
        </div>
        <div className="field">
          <label htmlFor="pl-travelers">People in total</label>
          <input id="pl-travelers" name="travelers" type="number" min={1} max={20} inputMode="numeric"
            className="input" defaultValue={v("travelers", String(defaults.travelers))} />
        </div>
        <div className="field">
          <label htmlFor="pl-age">Age group of the adults</label>
          <select id="pl-age" name="adult_age_group" className="input" defaultValue={v("adult_age_group", defaults.ageGroup)}>
            <option value="">Prefer not to say</option>
            {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pl-children">Of which children</label>
          <input id="pl-children" name="children" type="number" min={0} max={19} inputMode="numeric"
            className="input" defaultValue={v("children", "0")} />
        </div>
        <div className="field">
          <label htmlFor="pl-children-ages">Ages of the children</label>
          <input id="pl-children-ages" name="children_ages" className="input" maxLength={60}
            placeholder="e.g. 4 and 9" defaultValue={v("children_ages")} />
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="text-xl font-bold">What you enjoy</h2>
        <fieldset>
          <legend className="label mb-1.5">Interests (choose any)</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(([key, text]) => (
              <label key={key} className="chip">
                <input type="checkbox" name="interests" value={key} defaultChecked={interests.includes(key)} className="sr-only" />
                <span>{text}</span>
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
        {state.error ? <p className="notice notice-error">{state.error}</p> : null}
        {pending ? (
          <p className="notice">
            Jovia is planning your trip. This usually takes one to two minutes. Please keep this page open.
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary sm:w-fit" disabled={pending}>
          {pending ? "Planning your trip…" : "Create my itinerary"}
        </button>
      </div>
    </form>
  );
}
