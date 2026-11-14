"use server";

import { getProfile, requireUser } from "@/lib/auth";
import { chatLeftToday, getTier, TIERS } from "@/lib/billing";
import { f } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { advisorTurn, briefToForm, cleanBrief, type Brief, type ChatMessage } from "@/lib/planner/advisor";
import { PlannerError } from "@/lib/planner/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { planTrip } from "@/app/(app)/plan/actions";

export type TurnResult =
  | { ok: true; reply: string; brief: Brief; ready: boolean }
  | { ok: false; error: string };

const MAX_MESSAGES = 40;
const MAX_TEXT = 2000;

/** Long-term preferences, only when the person has switched personalisation on. */
async function personalNotes(userId: string, enabled: boolean) {
  if (!enabled) return "";
  const supabase = await createClient();
  const { data } = await supabase.from("memory_items").select("statement")
    .eq("user_id", userId).eq("active", true).order("weight", { ascending: false }).limit(12);
  return (data ?? []).map((m) => `- ${m.statement}`).join("\n");
}

/** One message to the travel advisor. The conversation itself lives in the browser. */
export async function sendChat(messages: ChatMessage[], rawBrief: unknown): Promise<TurnResult> {
  const user = await requireUser();
  const { t, locale } = await getI18n();
  const T = t.client.chat;

  const history = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, MAX_TEXT) }))
    .filter((m) => m.text)
    .slice(-MAX_MESSAGES);
  if (!history.length || history[history.length - 1].role !== "user") return { ok: false, error: T.failed };

  const tier = await getTier(user);
  if ((await chatLeftToday(user, tier)) <= 0) return { ok: false, error: f(T.limit, { n: TIERS[tier].chatPerDay }) };

  const profile = await getProfile(user.id);
  try {
    const result = await advisorTurn(history, cleanBrief(rawBrief), {
      today: new Date().toISOString().slice(0, 10),
      locale,
      maxDays: TIERS[tier].maxDays,
      profile: { homePlace: profile?.home_place ?? null, homeCanton: profile?.home_canton ?? null, currency: profile?.currency ?? "CHF" },
      personal: await personalNotes(user.id, profile?.personalization_enabled ?? false),
    }, tier);
    const admin = createAdminClient();
    if (admin) {
      await admin.from("ai_usage").insert({
        user_id: user.id, kind: "chat", input_tokens: result.usage.input_tokens, output_tokens: result.usage.output_tokens,
      });
    }
    if (!result.reply) return { ok: false, error: T.failed };
    return { ok: true, reply: result.reply, brief: result.brief, ready: result.ready };
  } catch (e) {
    const kind = e instanceof PlannerError ? e.kind : "failed";
    if (kind === "busy") return { ok: false, error: t.plan.errors.busy };
    if (kind === "not_configured") return { ok: false, error: t.plan.errors.not_configured };
    return { ok: false, error: T.failed };
  }
}

/** Builds the itinerary from the chat's trip brief, through the same checks as the planner form. */
export async function planFromChat(rawBrief: unknown): Promise<{ error?: string }> {
  const result = await planTrip(briefToForm(cleanBrief(rawBrief)));
  // planTrip redirects to the new itinerary on success; anything returned here is an error.
  return { error: result.error };
}
