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
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "One moment…" : children}
    </button>
  );
}

const URL_NOTICES: Record<string, string> = {
  confirmed: "Your email is confirmed. Log in to continue.",
  "link-expired": "That link has expired or was already used. Log in, or request a new link.",
  deleted: "Your account and all of its data have been deleted.",
};

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, empty);
  const [resend, resendAction, resending] = useActionState(resendConfirmation, empty);
  const urlNotice = URL_NOTICES[params.get("notice") ?? ""];
  const needsConfirm = state.error?.startsWith("Please confirm");

  return (
    <div className="flex flex-col gap-4">
      {urlNotice && !state.error ? <p className="notice">{urlNotice}</p> : null}
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={params.get("next") ?? ""} />
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" inputMode="email"
            required className="input" defaultValue={state.email} />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password"
            required className="input" />
        </div>
        <Messages state={state} />
        <Submit pending={pending}>Log in</Submit>
      </form>
      {needsConfirm ? (
        <form action={resendAction} className="flex flex-col gap-2">
          <input type="hidden" name="email" value={state.email ?? ""} />
          <button type="submit" className="btn btn-ghost w-full" disabled={resending}>
            Send a new confirmation link
          </button>
          <Messages state={resend} />
        </form>
      ) : null}
      <p className="text-sm text-muted">
        <Link href="/forgot-password" className="underline">Forgot your password?</Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, empty);
  if (state.notice) {
    return (
      <div className="flex flex-col gap-4">
        <Messages state={state} />
        <p className="text-sm text-muted">
          Nothing arrived after a few minutes? Check your spam folder, then{" "}
          <Link href="/login" className="underline">log in</Link> to request a new link.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="reg-name">What should we call you?</label>
        <input id="reg-name" name="name" type="text" autoComplete="given-name" maxLength={60}
          className="input" />
        <span className="hint">Optional. Shown in your dashboard greeting.</span>
      </div>
      <div className="field">
        <label htmlFor="reg-email">Email</label>
        <input id="reg-email" name="email" type="email" autoComplete="email" inputMode="email"
          required className="input" defaultValue={state.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
      <div className="field">
        <label htmlFor="reg-password">Password</label>
        <input id="reg-password" name="password" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
      </div>
      <div className="field">
        <label htmlFor="reg-confirm">Confirm password</label>
        <input id="reg-confirm" name="confirm" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
      </div>
      <span className="hint sm:col-span-2">At least 10 characters. A short sentence works well.</span>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input id="reg-age" name="age" type="checkbox" required className="mt-0.5 size-5 shrink-0" />
        <span>I am 16 or older.</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input id="reg-privacy" name="privacy" type="checkbox" required className="mt-0.5 size-5 shrink-0" />
        <span>
          I have read the <Link href="/privacy" className="underline">privacy policy</Link> and
          agree to Jovia storing my account data.
        </span>
      </label>
      <Messages state={state} />
      <Submit pending={pending}>Create account</Submit>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, empty);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="forgot-email">Email</label>
        <input id="forgot-email" name="email" type="email" autoComplete="email" inputMode="email"
          required className="input" />
      </div>
      <Messages state={state} />
      <Submit pending={pending}>Send reset link</Submit>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, empty);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor="reset-password">New password</label>
        <input id="reset-password" name="password" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
        <span className="hint">At least 10 characters.</span>
      </div>
      <div className="field">
        <label htmlFor="reset-confirm">Confirm new password</label>
        <input id="reset-confirm" name="confirm" type="password" autoComplete="new-password"
          required minLength={10} className="input" />
      </div>
      <Messages state={state} />
      <Submit pending={pending}>Save new password</Submit>
    </form>
  );
}
