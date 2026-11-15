import "server-only";
import { LANGUAGES } from "@/lib/i18n/config";
import { CURRENCIES } from "@/lib/options";
import { callTool, pickModel, type Usage } from "@/lib/planner/ai";
import {
  INTERESTS, LEVELS, LODGING, MAX_STOPS, MAX_TRAVELLERS, PACES, PARTY_TYPES, TRAVEL_MODES,
} from "@/lib/planner/options";
import { CANTONS } from "@/lib/swiss";

/**
 * The chat travel advisor. Each turn the model answers the traveller AND returns the
 * "trip brief": everything known so far, as structured data. The brief is what the
 * itinerary is later built from, so the advisor never has to ask for a fact twice.
 */

export type Brief = {
  destination: string | null;
  origin: string | null;
  home_canton: string | null;
  start_date: string | null;
  end_date: string | null;
  party: string | null;
  ages: (number | null)[];
  budget: number | null;
  currency: string;
  interests: string[];
  pace: string | null;
  level: string | null;
  lodging: string | null;
  travel_mode: string | null;
  stops: { place: string; from: string; to: string }[];
  wishes: string;
  constraints: string;
};

export type ChatMessage = { role: "user" | "assistant"; text: string };

export const EMPTY_BRIEF: Brief = {
  destination: null, origin: null, home_canton: null, start_date: null, end_date: null, party: null,
  ages: [], budget: null, currency: "CHF", interests: [], pace: null, level: null, lodging: null,
  travel_mode: null, stops: [], wishes: "", constraints: "",
};

const keys = (pairs: [string, string][]) => pairs.map(([k]) => k);
const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });
const DATE = { type: "string", description: "YYYY-MM-DD" };

const TOOL = {
  name: "advisor_reply",
  description: "Answer the traveller and save everything known about the trip so far.",
  input_schema: {
    type: "object",
    properties: {
      reply: { type: "string", description: "Your message to the traveller, plain text, no markdown. At most about 120 words." },
      ready: { type: "boolean", description: "True when destination, exact dates and the travellers (with all ages for groups and families) are known." },
      brief: {
        type: "object",
        properties: {
          destination: nullable({ type: "string" }),
          origin: nullable({ type: "string", description: "Home town" }),
          home_canton: nullable({ type: "string", enum: CANTONS.map((c) => c.code) }),
          start_date: nullable(DATE),
          end_date: nullable(DATE),
          party: nullable({ type: "string", enum: keys(PARTY_TYPES) }),
          ages: { type: "array", items: nullable({ type: "integer" }), description: "One entry per traveller; null when that person's age is unknown" },
          budget: nullable({ type: "number", description: "Total for the whole group" }),
          currency: { type: "string", enum: CURRENCIES },
          interests: { type: "array", items: { type: "string", enum: keys(INTERESTS) } },
          pace: nullable({ type: "string", enum: keys(PACES) }),
          level: nullable({ type: "string", enum: keys(LEVELS) }),
          lodging: nullable({ type: "string", enum: keys(LODGING) }),
          travel_mode: nullable({ type: "string", enum: keys(TRAVEL_MODES) }),
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: { place: { type: "string" }, from: DATE, to: DATE },
              required: ["place", "from", "to"],
              additionalProperties: false,
            },
          },
          wishes: { type: "string" },
          constraints: { type: "string", description: "Restrictions such as diet, mobility, no long drives" },
        },
        required: [
          "destination", "origin", "home_canton", "start_date", "end_date", "party", "ages", "budget", "currency",
          "interests", "pace", "level", "lodging", "travel_mode", "stops", "wishes", "constraints",
        ],
        additionalProperties: false,
      },
    },
    required: ["reply", "ready", "brief"],
    additionalProperties: false,
  },
};

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const oneOf = (v: unknown, allowed: string[]) => (typeof v === "string" && allowed.includes(v) ? v : null);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Makes a brief from the model (or from the browser) safe to use. */
export function cleanBrief(raw: unknown): Brief {
  const b = (raw ?? {}) as Record<string, unknown>;
  const ages = (Array.isArray(b.ages) ? b.ages : [])
    .slice(0, MAX_TRAVELLERS)
    .map((a) => (typeof a === "number" && Number.isInteger(a) && a >= 0 && a <= 120 ? a : null));
  const budget = typeof b.budget === "number" && Number.isFinite(b.budget) && b.budget > 0 ? Math.round(b.budget) : null;
  return {
    destination: text(b.destination, 120) || null,
    origin: text(b.origin, 120) || null,
    home_canton: oneOf(b.home_canton, CANTONS.map((c) => c.code)),
    start_date: isDate(b.start_date) ? b.start_date : null,
    end_date: isDate(b.end_date) ? b.end_date : null,
    party: oneOf(b.party, keys(PARTY_TYPES)),
    ages,
    budget,
    currency: oneOf(b.currency, CURRENCIES) ?? "CHF",
    interests: (Array.isArray(b.interests) ? b.interests : []).filter((i): i is string => oneOf(i, keys(INTERESTS)) !== null).slice(0, 12),
    pace: oneOf(b.pace, keys(PACES)),
    level: oneOf(b.level, keys(LEVELS)),
    lodging: oneOf(b.lodging, keys(LODGING)),
    travel_mode: oneOf(b.travel_mode, keys(TRAVEL_MODES)),
    stops: (Array.isArray(b.stops) ? b.stops : [])
      .map((s) => (s ?? {}) as Record<string, unknown>)
      .filter((s) => text(s.place, 80) && isDate(s.from) && isDate(s.to))
      .map((s) => ({ place: text(s.place, 80), from: s.from as string, to: s.to as string }))
      .slice(0, MAX_STOPS),
    wishes: text(b.wishes, 600),
    constraints: text(b.constraints, 600),
  };
}

/** Whether the brief has enough for an itinerary; mirrors the planner form's own checks. */
export function briefReady(b: Brief, maxDays: number) {
  if (!b.destination || !b.start_date || !b.end_date || !b.party) return false;
  const days = Math.round((Date.parse(b.end_date) - Date.parse(b.start_date)) / 86_400_000) + 1;
  if (days < 1 || days > maxDays) return false;
  if (b.party === "friends" || b.party === "family") {
    return b.ages.length >= 2 && b.ages.every((a) => a !== null) && b.ages.some((a) => (a ?? 0) >= 18);
  }
  return true;
}

export type AdvisorContext = {
  today: string;
  locale: string;
  maxDays: number;
  profile: { homePlace: string | null; homeCanton: string | null; currency: string };
  /** Long-term preferences, only when personalisation is switched on. */
  personal: string;
};

function buildPrompt(history: ChatMessage[], brief: Brief, ctx: AdvisorContext) {
  const language = LANGUAGES.find((l) => l.code === ctx.locale)?.english ?? "English";
  const transcript = history
    .map((m) => `${m.role === "user" ? "Traveller" : "Jovia"}: ${m.text}`)
    .join("\n\n");
  return [
    "You are Jovia, a warm and competent travel advisor at a Swiss travel agency, chatting with a traveller who lives in Switzerland.",
    `Today is ${ctx.today}. Trips can be at most ${ctx.maxDays} days long.`,
    `Reply in the language the traveller writes in. If unclear, use ${language}. Use Swiss conventions (CHF, "ss" instead of "ß" in German).`,
    "",
    "What we already know from their profile (use it, do not ask again unless it seems wrong):",
    `- Home town: ${ctx.profile.homePlace ?? "unknown"}; home canton: ${ctx.profile.homeCanton ?? "unknown"}; currency: ${ctx.profile.currency}`,
    ctx.personal ? `Lasting preferences from earlier trips:\n${ctx.personal}` : "",
    "",
    "Trip brief so far (JSON, from earlier in this chat):",
    JSON.stringify(brief),
    "",
    "Conversation:",
    transcript,
    "",
    "How to advise:",
    "- Talk like a good travel agent, not a form. Ask at most two short questions per message, the most useful first. Never ask for something already known.",
    "- Find out step by step: where (or what kind of trip, if they have no destination), when and how flexible, who travels (ages of everyone in groups and families), budget, then style (beach or city, adventure or rest, pace, comfort level, accommodation, flight or train) and special wishes.",
    "- If they have no destination yet, suggest two or three fitting ones with one sentence each, then let them choose.",
    "- If they only give a month or a season, suggest concrete dates and ask them to confirm. Never invent exact dates without saying so.",
    "- Budget: you may give a rough, clearly labelled split (flights, accommodation, food, activities, reserve) and say honestly if it looks tight, with alternatives (other dates, destination, comfort level, shorter trip). Never state real prices, flight times, airlines, hotel availability or ratings as facts.",
    "- Update the whole brief every turn: keep everything known, add new facts, correct what the traveller changes. Put the home town and canton in the brief when known. Interests use only the allowed keys.",
    "- Set ready to true once destination, exact start and end dates and the travellers are known (all ages for friends and family, at least one adult). Then tell them in one sentence that they can create the itinerary now with the button, or keep refining.",
    "- Stay on travel. Do not collect sensitive personal data such as health details beyond what the trip needs.",
    "Do not answer in text. Call the advisor_reply tool exactly once.",
  ].filter((x) => x !== "").join("\n");
}

/** One advisor turn: the reply to show and the updated brief. */
export async function advisorTurn(
  history: ChatMessage[],
  brief: Brief,
  ctx: AdvisorContext,
  tier: "free" | "premium" | "unlimited",
): Promise<{ reply: string; brief: Brief; ready: boolean; usage: Usage }> {
  const { input, usage } = await callTool(pickModel(tier), buildPrompt(history, brief, ctx), TOOL, 3000);
  const next = cleanBrief(input.brief);
  if (!next.origin && ctx.profile.homePlace) next.origin = ctx.profile.homePlace;
  if (!next.home_canton && ctx.profile.homeCanton) next.home_canton = ctx.profile.homeCanton;
  const reply = text(input.reply, 2000);
  return { reply, brief: next, ready: briefReady(next, ctx.maxDays), usage };
}

/** The brief as planner form fields, so it goes through the same checks as the form. */
export function briefToForm(b: Brief): FormData {
  const fd = new FormData();
  fd.set("destination", b.destination ?? "");
  fd.set("origin", b.origin ?? "");
  fd.set("home_canton", b.home_canton ?? "");
  fd.set("start_date", b.start_date ?? "");
  fd.set("end_date", b.end_date ?? "");
  fd.set("party", b.party ?? "couple");
  const count = b.party === "solo" ? 1 : b.party === "couple" ? 2 : Math.max(2, b.ages.length);
  for (let i = 0; i < count; i++) fd.append("ages", b.ages[i] === null || b.ages[i] === undefined ? "" : String(b.ages[i]));
  if (b.budget) fd.set("budget", String(b.budget));
  fd.set("currency", b.currency);
  for (const i of b.interests) fd.append("interests", i);
  if (b.pace) fd.set("pace", b.pace);
  if (b.level) fd.set("level", b.level);
  if (b.lodging) fd.set("lodging", b.lodging);
  if (b.travel_mode) fd.set("travel_mode", b.travel_mode);
  for (const s of b.stops) {
    fd.append("stop_place", s.place);
    fd.append("stop_from", s.from);
    fd.append("stop_to", s.to);
  }
  fd.set("wishes", b.wishes);
  fd.set("constraints", b.constraints);
  return fd;
}
