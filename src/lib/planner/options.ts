export const INTERESTS: [string, string][] = [
  ["beach", "Beach and sea"],
  ["adventure", "Adventure and action"],
  ["nature", "Nature and hiking"],
  ["culture", "Culture and history"],
  ["shopping", "Shopping"],
  ["food", "Restaurants and food"],
  ["theme_parks", "Theme parks"],
  ["sport", "Sport"],
  ["relaxation", "Relaxation"],
  ["nightlife", "Nightlife"],
  ["sights", "Sightseeing"],
  ["animals", "Animals and nature parks"],
];

export const PARTY_TYPES: [string, string][] = [
  ["solo", "Solo"],
  ["couple", "Couple"],
  ["friends", "Friends"],
  ["family", "Family"],
];

export const TRAVEL_MODES: [string, string][] = [
  ["any", "No preference"],
  ["flight", "Flight"],
  ["train", "Train"],
  ["car", "Car"],
];

export const LODGING: [string, string][] = [
  ["any", "No preference"],
  ["hotel", "Hotel"],
  ["apartment", "Holiday apartment"],
];

export const LEVELS: [string, string][] = [
  ["budget", "Budget"],
  ["mid", "Mid-range"],
  ["luxury", "Luxury"],
];

export const PACES: [string, string][] = [
  ["relaxed", "Relaxed"],
  ["balanced", "Balanced"],
  ["active", "Active"],
];

export const SLOTS: [string, string][] = [
  ["morning", "Morning"],
  ["afternoon", "Afternoon"],
  ["evening", "Evening"],
  ["restaurant", "Where to eat"],
];

export const BUDGET_PARTS: [string, string][] = [
  ["accommodation", "Accommodation"],
  ["transport", "Transport"],
  ["food", "Food"],
  ["activities", "Activities"],
  ["tickets", "Entrance fees"],
  ["other", "Other"],
];

export const MAX_TRIP_DAYS = 10;
export const MAX_TRAVELLERS = 12;
export const MAX_STOPS = 8;

export type TripInput = {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  days: number;
  travelers: number;
  party: string;
  /** One entry per traveller; null when the age was not given. */
  ages: (number | null)[];
  /** Fixed places along the way, with the dates spent there. */
  stops: { place: string; from: string; to: string }[];
  interests: string[];
  budget: number | null;
  currency: string;
  travelMode: string;
  lodging: string;
  level: string;
  pace: string;
  wishes: string;
  constraints: string;
};
