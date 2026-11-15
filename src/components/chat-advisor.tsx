"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { planFromChat, sendChat } from "@/app/(app)/chat/actions";
import { f, intlTag } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import type { Brief, ChatMessage } from "@/lib/planner/advisor";

const STORE = "jovia-chat-v1";
const EMPTY: Brief = {
  destination: null, origin: null, home_canton: null, start_date: null, end_date: null, party: null,
  ages: [], budget: null, currency: "CHF", interests: [], pace: null, level: null, lodging: null,
  travel_mode: null, stops: [], wishes: "", constraints: "",
};

type Saved = { messages: ChatMessage[]; brief: Brief; ready: boolean };

function load(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

/** The travel advisor chat with the trip brief beside it. The conversation stays in this browser tab. */
export function ChatAdvisor({ maxDays }: { maxDays: number }) {
  const { t: all, locale } = useI18n();
  const t = all.chat;
  const o = all.options;
  const greeting: ChatMessage = { role: "assistant", text: t.greeting };

  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [brief, setBrief] = useState<Brief>(EMPTY);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  const [sending, startSend] = useTransition();
  const [planning, startPlan] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  // Restore the conversation after a reload of this tab (sessionStorage is per tab).
  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    if (saved?.messages?.length) { setMessages(saved.messages); setBrief(saved.brief ?? EMPTY); setReady(Boolean(saved.ready)); }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(STORE, JSON.stringify({ messages, brief, ready })); } catch { /* storage unavailable */ }
  }, [messages, brief, ready, restored]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [messages.length, sending]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || sending || planning) return;
    const next = [...messages, { role: "user" as const, text: clean }];
    setMessages(next);
    setDraft("");
    setError("");
    startSend(async () => {
      const res = await sendChat(next, brief);
      if (res.ok) {
        setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
        setBrief(res.brief);
        setReady(res.ready);
      } else {
        setError(res.error);
      }
    });
  }

  function createPlan() {
    setError("");
    startPlan(async () => {
      const res = await planFromChat(brief);
      if (res?.error) setError(res.error);
      else try { sessionStorage.removeItem(STORE); } catch { /* ignore */ }
    });
  }

  function restart() {
    setMessages([greeting]);
    setBrief(EMPTY);
    setReady(false);
    setError("");
    try { sessionStorage.removeItem(STORE); } catch { /* ignore */ }
  }

  const tag = intlTag(locale);
  const day = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const named = (dict: Record<string, string>, k: string | null) => (k ? dict[k] ?? k : null);
  const travellers =
    brief.party === "solo" ? 1 : brief.party === "couple" ? 2 : brief.ages.length || null;
  const rows: [string, string | null][] = [
    [t.brief.destination, brief.destination],
    [t.brief.from, [brief.origin, brief.home_canton].filter(Boolean).join(", ") || null],
    [t.brief.dates, brief.start_date && brief.end_date ? `${day(brief.start_date)} – ${day(brief.end_date)}` : null],
    [t.brief.travellers, brief.party
      ? `${named(o.party, brief.party)}${travellers ? ` · ${travellers}` : ""}${brief.ages.some((a) => a !== null) ? ` (${brief.ages.map((a) => a ?? "?").join(", ")})` : ""}`
      : null],
    [t.brief.budget, brief.budget ? `${brief.currency} ${brief.budget.toLocaleString(tag)}` : null],
    [t.brief.style, [named(o.pace, brief.pace), named(o.level, brief.level), named(o.lodging, brief.lodging), named(o.travelMode, brief.travel_mode)]
      .filter((x) => x && x !== o.lodging.any && x !== o.travelMode.any).join(" · ") || null],
    [t.brief.interests, brief.interests.map((i) => named(o.interests, i)).join(", ") || null],
    [t.brief.stops, brief.stops.map((s) => `${s.place} (${day(s.from)} – ${day(s.to)})`).join(", ") || null],
    [t.brief.wishes, [brief.wishes, brief.constraints].filter(Boolean).join(" · ") || null],
  ];
  const busy = sending || planning;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
      <section className="card flex min-h-[60vh] flex-col p-0" aria-label={t.title}>
        <div className="flex-1 overflow-y-auto px-4 pt-5 sm:px-6" style={{ maxHeight: "70vh" }}>
          <ol className="flex flex-col gap-4" aria-live="polite">
            {messages.map((m, i) => (
              <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p className={`max-w-[85%] whitespace-pre-wrap rounded-[20px] px-4 py-3 leading-relaxed ${
                  m.role === "user" ? "bg-brand text-brand-ink" : "border border-line bg-surface"}`}>
                  <span className="sr-only">{m.role === "user" ? t.you : "Jovia"}: </span>
                  {m.text}
                </p>
              </li>
            ))}
            {sending ? (
              <li className="flex justify-start">
                <p className="rounded-[20px] border border-line bg-surface px-4 py-3 text-muted">{t.thinking}</p>
              </li>
            ) : null}
          </ol>
          {messages.length === 1 && !sending ? (
            <div className="mt-5 flex flex-col gap-2">
              <p className="text-sm font-semibold text-muted">{t.tryOne}</p>
              <div className="flex flex-wrap gap-2">
                {t.examples.map((ex) => (
                  <button key={ex} type="button" className="chip-btn h-auto whitespace-normal py-2 text-left" onClick={() => send(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div ref={end} className="h-5" />
        </div>
        <form className="flex flex-col gap-2 border-t border-line p-3 sm:p-4"
          onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          {error ? <p className="notice notice-error text-sm" role="alert">{error}</p> : null}
          {ready ? (
            <button type="button" className="btn btn-primary lg:hidden" disabled={busy} onClick={createPlan}>
              {planning ? t.planning : t.create}
            </button>
          ) : null}
          <label htmlFor="chat-input" className="sr-only">{t.inputLabel}</label>
          <div className="flex items-end gap-2">
            <textarea id="chat-input" rows={2} maxLength={2000} value={draft} disabled={planning}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); } }}
              className="input flex-1 resize-none py-3" placeholder={t.placeholder} />
            <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim()}>{t.send}</button>
          </div>
          <p className="hint">{t.hint}</p>
        </form>
      </section>

      <aside className="card flex flex-col gap-4 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t.brief.title}</h2>
          {messages.length > 1 ? (
            <button type="button" className="text-sm font-semibold text-brand underline" onClick={restart} disabled={busy}>
              {t.restart}
            </button>
          ) : null}
        </div>
        {rows.some(([, v]) => v) ? (
          <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-sm">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted">{t.brief.empty}</p>
        )}
        {ready ? (
          <p className="notice notice-ok text-sm">{f(t.readyNote, { n: maxDays })}</p>
        ) : (
          <p className="text-sm text-muted">{t.brief.needed}</p>
        )}
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={createPlan}>
          {planning ? t.planning : t.create}
        </button>
        {planning ? <p className="text-sm text-muted" aria-live="polite">{t.planningNote}</p> : null}
      </aside>
    </div>
  );
}
