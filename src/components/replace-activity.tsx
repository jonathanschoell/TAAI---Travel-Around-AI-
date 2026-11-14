"use client";

import { useActionState, useState } from "react";
import { replaceActivity, type ReplaceState } from "@/app/(app)/trips/[id]/actions";
import { useI18n } from "@/lib/i18n/client";

const empty: ReplaceState = {};

/** "Replace" link under an activity: optional wish, then the AI suggests something else for the same slot. */
export function ReplaceActivity({ activityId, name }: { activityId: string; name: string }) {
  const { t } = useI18n();
  const T = t.replace;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(replaceActivity, empty);
  const [seen, setSeen] = useState<ReplaceState>(empty);
  // Close the form once a new result arrives (state adjusted during render, no effect needed).
  if (state !== seen) {
    setSeen(state);
    if (state.notice) setOpen(false);
  }

  if (!open) {
    return (
      <div className="mt-1.5 flex flex-col gap-1.5">
        <button type="button" className="w-fit text-sm font-semibold text-brand underline" onClick={() => setOpen(true)}>
          {T.button}
        </button>
        {state.notice ? <p className="notice notice-ok text-sm" aria-live="polite">{state.notice}</p> : null}
      </div>
    );
  }
  return (
    <form action={action} className="mt-2 flex flex-col gap-2 rounded-2xl border border-line p-3">
      <input type="hidden" name="activity_id" value={activityId} />
      <label htmlFor={`rw-${activityId}`} className="text-sm font-semibold">{T.wishLabel.replace("{name}", name)}</label>
      <input id={`rw-${activityId}`} name="wish" maxLength={300} className="input" placeholder={T.wishPlaceholder} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? T.pending : T.submit}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{T.cancel}</button>
      </div>
      {state.error ? <p className="notice notice-error text-sm" aria-live="polite">{state.error}</p> : null}
    </form>
  );
}
