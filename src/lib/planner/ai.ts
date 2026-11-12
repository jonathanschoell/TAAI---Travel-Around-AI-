import "server-only";
import { BUDGET_PARTS, INTERESTS, type TripInput } from "@/lib/planner/options";

const CATEGORY_KEYS = INTERESTS.map(([k]) => k);
const SLOT_KEYS = ["morning", "afternoon", "evening", "restaurant"];

export type PlanActivity = {
  slot: string;
  name: string;
  category: string | null;
  description: string;
  duration_minutes: number | null;
  cost: number | null;
  latitude: number | null;
  longitude: number | null;
};
export type PlanDay = {
  day_number: number;
  theme: string;
  transit_notes: string;
  activities: PlanActivity[];
};
/** Facts about the start of the trip that come from data, not from the AI. */
export type SwissContext = {
  homeLabel: string;
  airports: { code: string; name: string; country: string; km: number }[];
  holidays: { name: string; start: string; end: string; varies: boolean; kind: "school" | "public" }[] | null;
};

export type Plan = {
  departure: { code: string; reason: string } | null;
  title: string;
  summary: string;
  days: PlanDay[];
  budget: Record<string, number>;
  tips: string[];
};

export class PlannerError extends Error {
  constructor(
    public kind: "not_configured" | "busy" | "failed" | "incomplete",
    message: string,
  ) {
    super(message);
  }
}

const activitySchema = {
  type: "object",
  properties: {
    slot: { type: "string", enum: SLOT_KEYS },
    name: { type: "string", description: "Real, specific place or activity name" },
    category: { type: "string", enum: CATEGORY_KEYS },
    description: { type: "string", description: "At most 30 words, why it fits these travellers" },
    duration_minutes: { type: "integer" },
    cost: { type: "number", description: "Estimated total for the whole group in the trip currency, 0 if free" },
    latitude: { type: "number", description: "0 if you are not reasonably sure" },
    longitude: { type: "number", description: "0 if you are not reasonably sure" },
  },
  required: ["slot", "name", "category", "description", "duration_minutes", "cost", "latitude", "longitude"],
  additionalProperties: false,
};

const TOOL = {
  name: "save_itinerary",
  description: "Save the finished day-by-day travel itinerary.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short, appealing trip title" },
      departure_airport_code: {
        type: "string",
        description: "IATA code of the recommended departure airport from the candidate list, or an empty string if none was given",
      },
      departure_airport_reason: {
        type: "string",
        description: "One or two sentences on why, based on getting to the airport and the destination. No prices or flight times. Empty if no candidates were given.",
      },
      summary: { type: "string", description: "2 to 3 sentences describing the trip" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day_number: { type: "integer" },
            theme: { type: "string", description: "Short headline for the day" },
            transit_notes: { type: "string", description: "How to get between the day's stops, at most 30 words" },
            activities: { type: "array", items: activitySchema },
          },
          required: ["day_number", "theme", "transit_notes", "activities"],
          additionalProperties: false,
        },
      },
      budget: {
        type: "object",
        description: "Estimated totals for the whole trip and group, in the trip currency",
        properties: Object.fromEntries(BUDGET_PARTS.map(([k]) => [k, { type: "number" }])),
        required: BUDGET_PARTS.map(([k]) => k),
        additionalProperties: false,
      },
      tips: { type: "array", items: { type: "string" }, description: "Up to 4 practical tips or hidden gems" },
    },
    required: ["title", "departure_airport_code", "departure_airport_reason", "summary", "days", "budget", "tips"],
    additionalProperties: false,
  },
};

const daySchema = TOOL.input_schema.properties.days;

const OUTLINE_TOOL = {
  name: "save_outline",
  description: "Save the outline of a long trip: one entry per day plus the parts that cover the whole trip.",
  input_schema: {
    type: "object",
    properties: {
      title: TOOL.input_schema.properties.title,
      departure_airport_code: TOOL.input_schema.properties.departure_airport_code,
      departure_airport_reason: TOOL.input_schema.properties.departure_airport_reason,
      summary: TOOL.input_schema.properties.summary,
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day_number: { type: "integer" },
            date: { type: "string", description: "YYYY-MM-DD" },
            place: { type: "string", description: "Where the travellers spend this day" },
            theme: { type: "string", description: "Short headline for the day" },
          },
          required: ["day_number", "date", "place", "theme"],
          additionalProperties: false,
        },
      },
      budget: TOOL.input_schema.properties.budget,
      tips: TOOL.input_schema.properties.tips,
    },
    required: ["title", "departure_airport_code", "departure_airport_reason", "summary", "days", "budget", "tips"],
    additionalProperties: false,
  },
};

const DAYS_TOOL = {
  name: "save_days",
  description: "Save some days of the itinerary in full detail.",
  input_schema: {
    type: "object",
    properties: { days: daySchema },
    required: ["days"],
    additionalProperties: false,
  },
};

function label(pairs: [string, string][], key: string) {
  return pairs.find(([k]) => k === key)?.[1] ?? key;
}

const INTRO = "You are Jovia, an expert personal travel agent. Plan a complete, individual itinerary for the travellers below.";

/** Everything known about the trip and the travellers. */
function buildContext(input: TripInput, personalContext: string, swiss: SwissContext | null) {
  const known = input.ages.filter((x): x is number => x !== null);
  const children = known.filter((x) => x < 18);
  const lines = [
    `Destination: ${input.destination}`,
    swiss?.homeLabel ? `Travellers start from: ${swiss.homeLabel}` : input.origin ? `Travellers start from: ${input.origin}` : "",
    `Dates: ${input.startDate} to ${input.endDate} (${input.days} days)`,
    `Travellers: ${input.travelers} in total, travelling as: ${input.party}`,
    known.length
      ? `Ages of the travellers: ${known.join(", ")}${known.length < input.travelers ? " (others not given)" : ""}`
      : "Ages not given",
    children.length
      ? `Of these, ${children.length} ${children.length === 1 ? "is a child" : "are children"} (ages ${children.join(", ")})`
      : known.length === input.travelers ? "No children" : "",
    input.stops.length
      ? "Fixed stops (the travellers are in these places on these dates):\n" +
        input.stops.map((st) => `  - ${st.place}: ${st.from} to ${st.to}`).join("\n")
      : "",
    input.interests.length
      ? `Interests: ${input.interests.map((i) => label(INTERESTS, i)).join(", ")}`
      : "Interests: not specified, choose a balanced mix",
    input.budget
      ? `Total budget for the whole group: ${input.budget} ${input.currency}`
      : `No fixed budget. Currency: ${input.currency}`,
    `Preferred way to travel: ${input.travelMode}`,
    `Accommodation: ${input.lodging}, comfort level: ${input.level}`,
    `Pace: ${input.pace}`,
    input.wishes ? `Special wishes: ${input.wishes}` : "",
    input.constraints ? `Restrictions or requirements (must be respected): ${input.constraints}` : "",
  ].filter(Boolean);
  return [
    lines.join("\n"),
    swissBlock(swiss),
    personalContext ? `\nWhat we know about these travellers from earlier trips (the request above wins if they conflict):\n${personalContext}` : "",
  ].join("\n");
}

/** How the days themselves must be planned. */
function dayRules(input: TripInput) {
  return [
    "- Every day has activities for the morning, afternoon and evening, plus at least one restaurant suggestion (slot \"restaurant\").",
    "- Match activities to the exact ages of everyone travelling: consider what a toddler, a school child, a teenager or an older adult can do and enjoy. With children, mix things for adults and children and plan real breaks.",
    ...(input.stops.length
      ? [
          "- Follow the fixed stops exactly: plan each day in the place where the travellers are on that date, and start that day's theme with the place name.",
          "- On a day when they move from one stop to the next, plan the journey itself (how, roughly how long) and lighter activities around it.",
          "- Days not covered by a stop are spent at the main destination or sensibly on the way.",
        ]
      : []),
    "- Keep stops of one day close together and order them so the route makes sense. The first and last day leave time for arrival and departure.",
    "- Respect the pace and the budget. Include one or two lesser-known places, not only the famous sights.",
    "- Only suggest places you are confident exist. Never invent opening hours or exact prices: all costs are your best estimates for the whole group.",
    "- Give latitude and longitude when you know them reasonably well; use 0 for both otherwise.",
    "- Write everything in English. Use Swiss francs (CHF) unless the travellers chose another currency.",
  ];
}

/** Rules for the parts of the plan that cover the whole trip. */
function tripRules(swiss: SwissContext | null) {
  return [
    ...(swiss?.airports.length
      ? [
          "- Recommend one departure airport from the candidate list. Weigh how easy it is to get there from home (Swiss travellers often take the train), the destination, and that smaller airports have fewer connections. Do not state flight prices, schedules or airlines as facts. On day 1, describe getting to that airport in the transit notes.",
        ]
      : ["- Leave departure_airport_code and departure_airport_reason empty."]),
    ...(swiss?.holidays?.length
      ? [
          "- The trip overlaps the holidays listed above. Mention it where it matters (busier places, closures on public holidays). Never claim specific price differences or savings.",
        ]
      : []),
  ];
}

/** The prompt for a trip planned in one go. */
export function buildPrompt(input: TripInput, personalContext: string, swiss: SwissContext | null = null) {
  return [
    INTRO,
    "",
    buildContext(input, personalContext, swiss),
    "",
    "Rules:",
    `- Plan exactly ${input.days} days, numbered from 1.`,
    ...dayRules(input),
    ...tripRules(swiss),
    "Do not answer in text. Call the save_itinerary tool exactly once with the finished plan.",
  ].join("\n");
}

/** Step 1 of a long trip: where the travellers are each day, plus everything that covers the whole trip. */
export function buildOutlinePrompt(input: TripInput, personalContext: string, swiss: SwissContext | null = null) {
  return [
    INTRO,
    "This is a long trip, so you plan it in two steps. Now do step 1 only: the outline.",
    "",
    buildContext(input, personalContext, swiss),
    "",
    "Rules:",
    `- Outline exactly ${input.days} days, numbered from 1, with the date of each day.`,
    "- For each day give the place where the travellers spend it and a short theme. Plan a sensible route: few changes of base, realistic travel days, rest days on long trips.",
    ...(input.stops.length ? ["- Follow the fixed stops exactly."] : []),
    "- Estimate the budget for the whole trip and the whole group, and give up to 4 tips.",
    ...tripRules(swiss),
    "Do not answer in text. Call the save_outline tool exactly once.",
  ].join("\n");
}

export type OutlineDay = { day_number: number; date: string; place: string; theme: string };

/** Step 2 of a long trip: a block of days in full detail, following the outline. */
export function buildDaysPrompt(
  input: TripInput,
  personalContext: string,
  swiss: SwissContext | null,
  outline: OutlineDay[],
  from: number,
  to: number,
  departure: string | null,
) {
  return [
    INTRO,
    "This is a long trip planned in two steps. The outline below is already decided. Now plan some of the days in full detail.",
    "",
    buildContext(input, personalContext, swiss),
    "",
    "Outline of the whole trip (follow it, do not change places or dates):",
    outline.map((d) => `  - Day ${d.day_number} (${d.date}): ${d.place}, ${d.theme}`).join("\n"),
    departure && from === 1 ? `Departure airport: ${departure}. On day 1, describe getting to it in the transit notes.` : "",
    "",
    "Rules:",
    `- Plan days ${from} to ${to} only, numbered ${from} to ${to}. Return exactly ${to - from + 1} days.`,
    "- Keep each day in the place given by the outline and use the outline's theme as a starting point.",
    "- Do not repeat activities or restaurants that obviously belong to other days of the outline.",
    ...dayRules(input),
    "Do not answer in text. Call the save_days tool exactly once.",
  ].filter((x) => x !== "").join("\n");
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Turns whatever the model returned into a safe, well-formed plan, or throws. */
function swissBlock(swiss: SwissContext | null) {
  if (!swiss) return "";
  const lines: string[] = [];
  if (swiss.airports.length)
    lines.push(
      "Candidate departure airports (straight-line distance from home, not travel time):\n" +
        swiss.airports.map((a) => `  - ${a.code} ${a.name}, ${a.country}: about ${a.km} km`).join("\n"),
    );
  if (swiss.holidays?.length)
    lines.push(
      "Holidays in the travellers' home canton during the trip (open calendar data):\n" +
        swiss.holidays
          .map((h) => `  - ${h.kind === "school" ? "School holidays" : "Public holiday"}: ${h.name}, ${h.start} to ${h.end}${h.varies ? " (dates vary by municipality)" : ""}`)
          .join("\n"),
    );
  return lines.length ? "\n" + lines.join("\n") : "";
}

export function normalizePlan(raw: unknown, days: number, allowedAirports: string[] = []): Plan {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawDays = Array.isArray(r.days) ? r.days : [];
  const outDays: PlanDay[] = rawDays.slice(0, days).map((d, i) => {
    const day = (d ?? {}) as Record<string, unknown>;
    const acts = Array.isArray(day.activities) ? day.activities : [];
    return {
      day_number: i + 1,
      theme: str(day.theme, 120),
      transit_notes: str(day.transit_notes, 400),
      activities: acts
        .map((a) => {
          const x = (a ?? {}) as Record<string, unknown>;
          const lat = num(x.latitude);
          const lng = num(x.longitude);
          const okCoords =
            lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
          const cost = num(x.cost);
          const mins = num(x.duration_minutes);
          return {
            slot: SLOT_KEYS.includes(String(x.slot)) ? String(x.slot) : "afternoon",
            name: str(x.name, 160),
            category: CATEGORY_KEYS.includes(String(x.category)) ? String(x.category) : null,
            description: str(x.description, 500),
            duration_minutes: mins !== null && mins > 0 ? Math.round(mins) : null,
            cost: cost !== null && cost >= 0 ? Math.round(cost * 100) / 100 : null,
            latitude: okCoords ? lat : null,
            longitude: okCoords ? lng : null,
          };
        })
        .filter((a) => a.name)
        .slice(0, 12),
    };
  });

  if (outDays.length < days || outDays.some((d) => d.activities.length === 0)) {
    throw new PlannerError("incomplete", "The plan came back incomplete.");
  }

  const rb = (r.budget ?? {}) as Record<string, unknown>;
  const budget = Object.fromEntries(
    BUDGET_PARTS.map(([k]) => [k, Math.max(0, Math.round(num(rb[k]) ?? 0))]),
  );
  return {
    departure: allowedAirports.includes(str(r.departure_airport_code, 3).toUpperCase())
      ? { code: str(r.departure_airport_code, 3).toUpperCase(), reason: str(r.departure_airport_reason, 400) }
      : null,
    title: str(r.title, 120) || "Your trip",
    summary: str(r.summary, 800),
    days: outDays,
    budget,
    tips: (Array.isArray(r.tips) ? r.tips : []).map((t) => str(t, 300)).filter(Boolean).slice(0, 4),
  };
}

export type Usage = { input_tokens: number | null; output_tokens: number | null };

/** Trips longer than this are planned in steps: an outline, then blocks of days in parallel. */
export const SINGLE_CALL_MAX_DAYS = 7;
const BLOCK_DAYS = 7;

type Tool = { name: string; description: string; input_schema: object };

/** One request to Claude that must end in a call of `tool`. The API key never leaves the server. */
async function callTool(model: string, prompt: string, tool: Tool, maxTokens: number) {
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (!apiKey) throw new PlannerError("not_configured", "ANTHROPIC_API_KEY is missing.");
  const base = (process.env["ANTHROPIC_BASE_URL"]?.trim() || "https://api.anthropic.com").replace(/\/+$/, "");

  // Current Claude models do not accept a forced tool call, so the tool is offered with
  // "auto" and a strict schema. If a model rejects one of the newer options, the request
  // is repeated with fewer of them.
  const baseBody = {
    model,
    max_tokens: maxTokens,
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: prompt }],
  };
  const variants = [
    { ...baseBody, tools: [{ ...tool, strict: true }], thinking: { type: "between_tools" }, output_config: { effort: "medium" } },
    { ...baseBody, tools: [{ ...tool, strict: true }] },
    { ...baseBody, tools: [tool] },
  ];

  let res: Response | null = null;
  for (const body of variants) {
    try {
      res = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(240_000),
      });
    } catch {
      throw new PlannerError("failed", "The AI service did not answer in time.");
    }
    if (res.status !== 400) break;
    console.error("Anthropic API rejected the request", (await res.clone().text().catch(() => "")).slice(0, 300));
  }
  if (!res) throw new PlannerError("failed", "No request was sent.");

  if (res.status === 429 || res.status === 529) {
    throw new PlannerError("busy", `AI service busy (${res.status}).`);
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error("Anthropic API error", res.status, detail);
    throw new PlannerError(
      res.status === 401 || res.status === 403 ? "not_configured" : "failed",
      `AI service error ${res.status}.`,
    );
  }

  const data = (await res.json()) as {
    content?: { type: string; name?: string; input?: unknown }[];
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const block = data.content?.find((b) => b.type === "tool_use" && b.name === tool.name);
  if (!block || data.stop_reason === "max_tokens") {
    throw new PlannerError("incomplete", "The plan came back incomplete.");
  }
  return {
    input: block.input as Record<string, unknown>,
    usage: { input_tokens: data.usage?.input_tokens ?? 0, output_tokens: data.usage?.output_tokens ?? 0 },
  };
}

function pickModel(tier: "free" | "premium") {
  // Every account uses the small, inexpensive model by default. Each tier can be
  // switched to another model in the hosting settings without changing code.
  return tier === "premium"
    ? process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-5-5"
    : process.env["ANTHROPIC_MODEL_FREE"]?.trim() || "claude-haiku-5-5";
}

/** Reads the outline the model returned; it must name every day of the trip in order. */
export function normalizeOutline(raw: unknown, input: TripInput): OutlineDay[] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const days = (Array.isArray(r.days) ? r.days : []).slice(0, input.days);
  if (days.length < input.days) throw new PlannerError("incomplete", "The outline came back incomplete.");
  const start = Date.parse(input.startDate + "T00:00:00Z");
  return days.map((d, i) => {
    const x = (d ?? {}) as Record<string, unknown>;
    return {
      day_number: i + 1,
      // The date always comes from the trip dates, never from the model.
      date: new Date(start + i * 86400000).toISOString().slice(0, 10),
      place: str(x.place, 80) || input.destination,
      theme: str(x.theme, 120),
    };
  });
}

/** Days of one block, in order; throws if any day is missing. */
function takeBlock(raw: Record<string, unknown>, from: number, to: number): unknown[] {
  const list = Array.isArray(raw.days) ? (raw.days as Record<string, unknown>[]) : [];
  const want = to - from + 1;
  const numbered = list.filter((d) => Number(d?.day_number) >= from && Number(d?.day_number) <= to);
  const chosen = (numbered.length === want ? numbered : list.slice(0, want)).sort(
    (a, b) => Number(a?.day_number) - Number(b?.day_number),
  );
  if (chosen.length < want) throw new PlannerError("incomplete", "Some days came back incomplete.");
  return chosen;
}

/** Asks Claude for an itinerary: in one go for short trips, in steps for long ones. */
export async function generatePlan(
  input: TripInput,
  personalContext: string,
  tier: "free" | "premium" = "premium",
  swiss: SwissContext | null = null,
): Promise<{ plan: Plan; usage: Usage; model: string }> {
  const model = pickModel(tier);
  const airports = swiss?.airports.map((a) => a.code) ?? [];

  if (input.days <= SINGLE_CALL_MAX_DAYS) {
    const { input: raw, usage } = await callTool(model, buildPrompt(input, personalContext, swiss), TOOL, 16000);
    return { model, plan: normalizePlan(raw, input.days, airports), usage };
  }

  // Step 1: the outline.
  const outlineCall = await callTool(model, buildOutlinePrompt(input, personalContext, swiss), OUTLINE_TOOL, 8000);
  const outline = normalizeOutline(outlineCall.input, input);
  const code = str(outlineCall.input.departure_airport_code, 3).toUpperCase();
  const departure = airports.includes(code) ? code : null;

  // Step 2: blocks of days, all at the same time. A block that fails is tried once more.
  // Blocks of equal size, at most BLOCK_DAYS each: 21 days = 7+7+7, 15 days = 5+5+5.
  const size = Math.ceil(input.days / Math.ceil(input.days / BLOCK_DAYS));
  const blocks: [number, number][] = [];
  for (let from = 1; from <= input.days; from += size) {
    blocks.push([from, Math.min(input.days, from + size - 1)]);
  }
  const runBlock = async ([from, to]: [number, number]) => {
    const prompt = buildDaysPrompt(input, personalContext, swiss, outline, from, to, departure);
    for (let attempt = 1; ; attempt++) {
      try {
        const call = await callTool(model, prompt, DAYS_TOOL, 16000);
        return { days: takeBlock(call.input, from, to), usage: call.usage };
      } catch (e) {
        const retry = e instanceof PlannerError && (e.kind === "incomplete" || e.kind === "failed");
        if (!retry || attempt >= 2) throw e;
      }
    }
  };
  const results = await Promise.all(blocks.map(runBlock));

  const raw = { ...outlineCall.input, days: results.flatMap((r) => r.days) };
  const plan = normalizePlan(raw, input.days, airports);
  // Keep the outline's places in the day headlines when the detailed day lost them.
  plan.days.forEach((d, i) => {
    if (!d.theme) d.theme = `${outline[i].place}: ${outline[i].theme}`;
  });
  const usage = [outlineCall.usage, ...results.map((r) => r.usage)].reduce(
    (sum, u) => ({
      input_tokens: (sum.input_tokens ?? 0) + (u.input_tokens ?? 0),
      output_tokens: (sum.output_tokens ?? 0) + (u.output_tokens ?? 0),
    }),
    { input_tokens: 0, output_tokens: 0 } as Usage,
  );
  return { model, plan, usage };
}
