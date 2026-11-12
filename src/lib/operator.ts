/**
 * Who runs Jovia. Shown in the imprint, the terms and the privacy policy.
 * Replace every empty value before the public launch.
 */
export const OPERATOR = {
  name: "Jovia, Jonathan Schoell",
  street: "Spitalackerstrasse 26",
  postalCodeAndCity: "3013 Bern",
  country: "Switzerland",
  email: "JoviaSwitzerland@gmail.com",
  /** Company number (UID), only if a company is registered. */
  uid: "",
};

export const PREMIUM_PRICE = "CHF 5.95";
export const UNLIMITED_PRICE = "CHF 99.90";
export const TERMS_VERSION = "draft-2026-11";

export const operatorComplete = Boolean(
  OPERATOR.name && OPERATOR.street && OPERATOR.postalCodeAndCity && OPERATOR.email,
);
