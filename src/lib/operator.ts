/**
 * Who runs Jovia. Shown in the imprint, the terms and the privacy policy.
 * Replace every empty value before the public launch.
 */
export const OPERATOR = {
  name: "",
  street: "",
  postalCodeAndCity: "",
  country: "Switzerland",
  email: "",
  /** Company number (UID), only if a company is registered. */
  uid: "",
};

export const PREMIUM_PRICE = "CHF 3.50";
export const TERMS_VERSION = "draft-2026-11";

export const operatorComplete = Boolean(
  OPERATOR.name && OPERATOR.street && OPERATOR.postalCodeAndCity && OPERATOR.email,
);
