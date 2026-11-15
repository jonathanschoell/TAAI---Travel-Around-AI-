import { de } from "./de";
import { en, type Dict } from "./en";
import { fr } from "./fr";
import { it } from "./it";
import { rm } from "./rm";
import type { Locale } from "./config";

export const DICTS: Record<Locale, Dict> = { en, de, fr, it, rm };
export type { Dict };
export type ClientDict = Dict["client"];
