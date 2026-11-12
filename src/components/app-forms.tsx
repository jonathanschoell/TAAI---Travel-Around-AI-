"use client";

import { useActionState } from "react";
import { deleteAccount, setUserTier, updateProfile, type AppFormState } from "@/app/(app)/actions";
import { AGE_GROUPS, CURRENCIES } from "@/lib/options";
import { cantonsFor } from "@/lib/swiss";
import { LANGUAGES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

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
    home_canton?: string | null;
    home_place?: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateProfile, empty);
  const { t: all, locale } = useI18n();
  const t = all.profileForm;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="field sm:col-span-2">
        <label htmlFor="pf-name">{t.name}</label>
        <input id="pf-name" name="display_name" className="input" maxLength={60} required
          defaultValue={profile.display_name} autoComplete="given-name" />
      </div>
      <div className="field">
        <label htmlFor="pf-age">{t.ageGroup}</label>
        <select id="pf-age" name="age_group" className="input" defaultValue={profile.age_group ?? ""}>
          <option value="">{t.preferNot}</option>
          {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="hint">{t.ageHint}</span>
      </div>
      <div className="field">
        <label htmlFor="pf-currency">{t.currency}</label>
        <select id="pf-currency" name="currency" className="input" defaultValue={profile.currency}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pf-place">{t.homeTown}</label>
        <input id="pf-place" name="home_place" className="input" maxLength={80} autoComplete="address-level2"
          placeholder={t.homeTownPlaceholder} defaultValue={profile.home_place ?? ""} />
        <span className="hint">{t.homeTownHint}</span>
      </div>
      <div className="field">
        <label htmlFor="pf-canton">{t.canton}</label>
        <select id="pf-canton" name="home_canton" className="input" defaultValue={profile.home_canton ?? ""}>
          <option value="">{t.notSet}</option>
          {cantonsFor(locale).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <span className="hint">{t.cantonHint}</span>
      </div>
      <div className="field">
        <label htmlFor="pf-language">{t.language}</label>
        <select id="pf-language" name="language" className="input" defaultValue={locale}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.name}</option>)}
        </select>
        <span className="hint">{t.languageHint}</span>
      </div>
      <div className="sm:col-span-2 flex flex-col gap-3">
        <Messages state={state} />
        <button type="submit" className="btn btn-primary sm:w-fit" disabled={pending}>
          {pending ? all.common.saving : t.save}
        </button>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, empty);
  const { t: all } = useI18n();
  const t = all.profileForm;
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="field">
        <label htmlFor="del-password">{t.deleteConfirm}</label>
        <input id="del-password" name="password" type="password" autoComplete="current-password"
          required className="input sm:max-w-sm" />
      </div>
      <Messages state={state} />
      <button type="submit" className="btn btn-danger sm:w-fit" disabled={pending}>
        {pending ? t.deleting : t.deleteButton}
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
          <option value="unlimited">Unlimited</option>
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
