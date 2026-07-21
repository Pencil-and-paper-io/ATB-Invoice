/** Canada’s 13 provinces and territories — used for tax locality. */
export const CA_PROVINCES_TERRITORIES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

export type CaProvinceCode = (typeof CA_PROVINCES_TERRITORIES)[number]["code"];

export function provinceLabel(code: string) {
  const match = CA_PROVINCES_TERRITORIES.find((entry) => entry.code === code);
  return match ? `${match.name} (${match.code})` : code;
}

/** Suggested customer tags for grouping accounts. */
export const CUSTOMER_TAG_OPTIONS = [
  "VIP",
  "Contractor",
  "Retail",
  "Wholesale",
  "Net-30",
] as const;

export const LOCKED_CURRENCY = "CAD" as const;
export const LOCKED_CURRENCY_BADGE =
  "Invoice Total in CAD (Canadian Dollars)" as const;
