"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import {
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signUp,
  updatePassword,
  type FormState,
} from "@/app/(auth)/actions";
import { useI18n } from "@/lib/i18n/client";

const empty: FormState = {};

function Messages({ state }: { state: FormState }) {
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      {state.notice ? <p className="notice notice-ok">{state.notice}</p> : null}
    </div>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? t.common.oneMoment : children}
    </button>
  );
}

export function LoginForm() {
  const { t } = useI18n();
  const urlNotices: Record<string, string> = {
    confirmed: t.auth.urlConfirmed,
    "link-expired": t.auth.urlExpired,
    deleted: t.auth.urlDeleted,
  };
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, empty);
  const [resend, resendAction, resending] = useActionState(resendConfirmation, empty);
  const urlNotice = urlNotices[params.get("notice") ?? ""];
  const needsConfirm = Boolean(state.needsConfirm);

  return (
    <div className="flex flex-col gap-4">
      {urlNotice && !state.error ? <p className="notice">{urlNotice}</p> : null}
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={params.get("next") ?? ""} />
        <div className="field">
          <label htmlFor="login-email">{t.common.email}</label>
          <input id="login-email" name="email" type="email" autoComplete="email" inputMode="email"
            required className="input" defaultValue={state.email} />
        </div>
        <div className="field">
          <label htmlFor="login-password">{t.common.password}</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password"
            required className="input" />
        </div>
        <Messages state={state} />
        <Submit pending={pending}>{t.auth.logIn}</Submit>
      </form>
      {needsConfirm ? (
        <form action={resendAction} className="flex flex-col gap-2">
          <input type="hidden" name="email" value={state.email ?? ""} />
          <button type="submit" className="btn btn-ghost w-full" disabled={resending}>
            {t.auth.resend}
          </button>
          <Messages state={resend} />
        </form>
      ) : null}
      <p className="text-sm text-muted">
        <Link href="/forgot-password" className="underline">{t.auth.forgot}</Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signUp, empty);
  if (state.notice) {
    return (
      <div className="flex flex-col gap-4">
        <Messages state={state} />
        <p className="text-sm text-muted">
          {t.auth.nothingArrived}
          <Link href="/login" className="underline">{t.auth.logInLower}</Link>{t.auth.toRequestNew}
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="reg-name">{t.auth.nameLabel}</label>
        <input id="reg-name" name="name" type="text" autoComplete="given-name" maxLength={60}
          className="input" />
        <span className="hint">{t.auth.nameHint}</span>
      </div>
      <div className="field">
        <label htmlFor="reg-email">{t.common.email}</label>
        <input id="reg-email" name="email" type="email" autoComplete="email" inputMode="email"
          required className="input" defaultValue={state.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
      <div className="field">
        <label htmlFor="reg-password">{t.common.password}</label>
        <input id="reg-password" name="password" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
      </div>
      <div className="field">
        <label htmlFor="reg-confirm">{t.auth.confirmPassword}</label>
        <input id="reg-confirm" name="confirm" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
      </div>
      <span className="hint sm:col-span-2">{t.auth.passwordHint}</span>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input id="reg-age" name="age" type="checkbox" required className="mt-0.5 size-5 shrink-0" />
        <span>{t.auth.age16}</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input id="reg-privacy" name="privacy" type="checkbox" required className="mt-0.5 size-5 shrink-0" />
        <span>
          {t.auth.acceptBefore}<Link href="/terms" className="underline">{t.auth.termsLink}</Link>
          {t.auth.acceptMiddle}<Link href="/privacy" className="underline">{t.auth.privacyLink}</Link>
          {t.auth.acceptAfter}
        </span>
      </label>
      <Messages state={state} />
      <Submit pending={pending}>{t.auth.createAccount}</Submit>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordReset, empty);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="forgot-email">{t.common.email}</label>
        <input id="forgot-email" name="email" type="email" autoComplete="email" inputMode="email"
          required className="input" />
      </div>
      <Messages state={state} />
      <Submit pending={pending}>{t.auth.sendReset}</Submit>
    </form>
  );
}

export function ResetForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(updatePassword, empty);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="reset-password">{t.auth.newPassword}</label>
        <input id="reset-password" name="password" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
        <span className="hint">{t.auth.newPasswordHint}</span>
      </div>
      <div className="field">
        <label htmlFor="reset-confirm">{t.auth.confirmNewPassword}</label>
        <input id="reset-confirm" name="confirm" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
      </div>
      <Messages state={state} />
      <Submit pending={pending}>{t.auth.saveNewPassword}</Submit>
    </form>
  );
}
