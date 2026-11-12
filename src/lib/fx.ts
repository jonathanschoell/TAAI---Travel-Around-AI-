import "server-only";

/**
 * Exchange rates to Swiss francs from Frankfurter (frankfurter.dev), which republishes the
 * daily reference rates of the European Central Bank. Reference rates are not the rates a
 * bank or card provider charges; card fees and margins come on top.
 */

export const FX_SOURCE = { name: "European Central Bank via Frankfurter", url: "https://frankfurter.dev" };

const TTL_MS = 6 * 60 * 60 * 1000;
let memo: { at: number; date: string; perChf: Record<string, number> } | null = null;

export type FxQuote = {
  /** Swiss francs for one unit of the foreign currency. */
  chfPerUnit: number;
  /** Date the reference rate was published. */
  date: string;
};

/** CHF value of one unit of `currency`. Null when the rate is unavailable. */
export async function chfRate(currency: string): Promise<FxQuote | null> {
  if (currency === "CHF") return { chfPerUnit: 1, date: "" };
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  try {
    if (!memo || Date.now() - memo.at > TTL_MS) {
      const res = await fetch("https://api.frankfurter.dev/v1/latest?base=CHF", {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
      const data = (await res.json()) as { date?: string; rates?: Record<string, number> };
      if (!data.rates || typeof data.date !== "string") throw new Error("Unexpected rate data");
      memo = { at: Date.now(), date: data.date, perChf: data.rates };
    }
    const perChf = memo.perChf[currency];
    if (typeof perChf !== "number" || perChf <= 0) return null;
    return { chfPerUnit: 1 / perChf, date: memo.date };
  } catch (e) {
    console.error("Exchange rate lookup failed", e);
    return null;
  }
}
