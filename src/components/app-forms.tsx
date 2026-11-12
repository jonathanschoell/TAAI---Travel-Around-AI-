"use client";

import { useActionState } from "react";
import { deleteAccount, setUserTier, updateProfile, type AppFormState } from "@/app/(app)/actions";
import { AGE_GROUPS, CURRENCIES } from "@/lib/options";
import { CANTONS } from "@/lib/swiss";

const empty: AppFormState = {};

function Messages({ state }: { state: AppFormState }) {
  return (
    <div aria-live="polite">
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      {state.notice ? <p className="notice notice-ok">{state.notice}</p> : null}
    </div>
  );
}

export function ProfileForm({
  profile,
}: {
  profile: {
    display_name: string;
    age_group: string | null;
    currency: string;
    default_travelers: number;
    home_canton?: string | null;
    home_place?: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateProfile, empty);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="field sm:col-span-2">
        <label htmlFor="pf-name">Profile name</label>
        <input id="pf-name" name="display_name" className="input" maxLength={60} required
          defaultValue={profile.display_name} autoComplete="given-name" />
      </div>
      <div className="field">
        <label htmlFor="pf-age">Age group</label>
        <select id="pf-age" name="age_group" className="input" defaultValue={profile.age_group ?? ""}>
          <option value="">Prefer not to say</option>
          {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="hint">Optional. Helps suggest activities that fit.</span>
      </div>
      <div className="field">
        <label htmlFor="pf-currency">Currency</label>
        <select id="pf-currency" name="currency" className="input" defaultValue={profile.currency}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pf-travelers">Usual number of travellers</label>
        <input id="pf-travelers" name="default_travelers" type="number" min={1} max={20}
          inputMode="numeric" className="input" defaultValue={profile.default_travelers} />
      </div>
      <div className="field">
        <label htmlFor="pf-place">Home town</label>
        <input id="pf-place" name="home_place" className="input" maxLength={80} autoComplete="address-level2"
          placeholder="e.g. Bern" defaultValue={profile.home_place ?? ""} />
        <span className="hint">Optional. Used to suggest your departure airport.</span>
      </div>
      <div className="field">
        <label htmlFor="pf-canton">Home canton</label>
        <select id="pf-canton" name="home_canton" className="input" defaultValue={profile.home_canton ?? ""}>
          <option value="">Not set</option>
          {CANTONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <span className="hint">Optional. Used for school holidays and nearby airports.</span>
      </div>
      <div className="field">
        <label htmlFor="pf-language">Language</label>
        <input id="pf-language" className="input" value="English" disabled readOnly />
        <span className="hint">More languages will follow.</span>
      </div>
      <div className="sm:col-span-2 flex flex-col gap-3">
        <Messages state={state} />
        <button type="submit" className="btn btn-primary sm:w-fit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, empty);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="field">
        <label htmlFor="del-password">Enter your password to confirm</label>
        <input id="del-password" name="password" type="password" autoComplete="current-password"
          required className="input sm:max-w-sm" />
      </div>
      <Messages state={state} />
      <button type="submit" className="btn btn-danger sm:w-fit" disabled={pending}>
        {pending ? "Deleting…" : "Delete my account and all data"}
      </button>
    </form>
  );
}

export function TierForm() {
  const [state, action, pending] = useActionState(setUserTier, empty);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
      <div className="field">
        <label htmlFor="tier-email">Account email</label>
        <input id="tier-email" name="email" type="email" required className="input" />
      </div>
      <div className="field">
        <label htmlFor="tier-tier">Plan</label>
        <select id="tier-tier" name="tier" className="input" defaultValue="premium">
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Set plan"}
      </button>
      <div className="sm:col-span-3"><Messages state={state} /></div>
    </form>
  );
}
