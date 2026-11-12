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

function label(pairs: [string, string][], key: string) {
  return pairs.find(([k]) => k === key)?.[1] ?? key;
}

export function buildPrompt(input: TripInput, personalContext: string, swiss: SwissContext | null = null) {
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
    "You are Jovia, an expert personal travel agent. Plan a complete, individual itinerary for the travellers below.",
    "",
    lines.join("\n"),
    swissBlock(swiss),
    personalContext ? `\nWhat we know about these travellers from earlier trips (the request above wins if they conflict):\n${personalContext}` : "",
    "",
    "Rules:",
    `- Plan exactly ${input.days} days, numbered from 1.`,
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
    "Do not answer in text. Call the save_itinerary tool exactly once with the finished plan.",
  ].join("\n");
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

/** Asks Claude for an itinerary. The API key never leaves the server. */
export async function generatePlan(
  input: TripInput,
  personalContext: string,
  tier: "free" | "premium" = "premium",
  swiss: SwissContext | null = null,
): Promise<{ plan: Plan; usage: Usage; model: string }> {
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (!apiKey) throw new PlannerError("not_configured", "ANTHROPIC_API_KEY is missing.");
  const base = (process.env["ANTHROPIC_BASE_URL"]?.trim() || "https://api.anthropic.com").replace(/\/+$/, "");
  // Every account uses the small, inexpensive model by default. Each tier can be
  // switched to another model in the hosting settings without changing code.
  const model =
    tier === "premium"
      ? process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-5-5"
      : process.env["ANTHROPIC_MODEL_FREE"]?.trim() || "claude-haiku-5-5";

  // Current Claude models do not accept a forced tool call, so the tool is offered with
  // "auto" and a strict schema. If a model rejects one of the newer options, the request
  // is repeated once with fewer of them.
  const base_body = {
    model,
    max_tokens: 16000,
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: buildPrompt(input, personalContext, swiss) }],
  };
  const variants = [
    { ...base_body, tools: [{ ...TOOL, strict: true }], thinking: { type: "between_tools" }, output_config: { effort: "medium" } },
    { ...base_body, tools: [{ ...TOOL, strict: true }] },
    { ...base_body, tools: [TOOL] },
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
        signal: AbortSignal.timeout(280_000),
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
  const block = data.content?.find((b) => b.type === "tool_use" && b.name === TOOL.name);
  if (!block || data.stop_reason === "max_tokens") {
    throw new PlannerError("incomplete", "The plan came back incomplete.");
  }
  return {
    model,
    plan: normalizePlan(block.input, input.days, swiss?.airports.map((a) => a.code) ?? []),
    usage: {
      input_tokens: data.usage?.input_tokens ?? null,
      output_tokens: data.usage?.output_tokens ?? null,
    },
  };
}
