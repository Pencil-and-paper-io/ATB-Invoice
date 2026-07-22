import {
  findTaxOption,
  type AlbertaTaxOption,
} from "@/lib/alberta-tax";
import {
  DEFAULT_TAX_SUGGESTIONS,
  syncSuggestedLabel,
  type TaxSuggestions,
} from "@/lib/tax-suggestions";

export const GST_HST_REGISTER_URL =
  "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/gst-hst-account/register-account.html";

export type GstRegistrationStatus =
  | "small_supplier"
  | "pending_number"
  | "registered";

export const GST_REGISTRATION_OPTIONS: {
  value: GstRegistrationStatus;
  label: string;
}[] = [
  {
    value: "small_supplier",
    label:
      "I have not earned $30,000 yet and do not need a GST/HST number",
  },
  {
    value: "pending_number",
    label:
      "I have earned $30,000 or more but do not have my GST/HST number yet",
  },
  {
    value: "registered",
    label: "I have a GST/HST number",
  },
];

export type PlaceOfSupplySuggestion = {
  provinceCode: string;
  taxLabel: string;
  explanation: string;
  /** PST/QST is optional until the business is registered locally. */
  pstMayApply: boolean;
  suggestions: TaxSuggestions;
};

const BY_PROVINCE: Record<
  string,
  Omit<PlaceOfSupplySuggestion, "provinceCode" | "suggestions">
> = {
  AB: {
    taxLabel: "GST - 5%",
    explanation:
      "Alberta has no PST. Place-of-supply rules use 5% GST for taxable sales to Alberta customers.",
    pstMayApply: false,
  },
  NT: {
    taxLabel: "GST - 5%",
    explanation:
      "Northwest Territories: charge 5% GST. There is no territorial sales tax.",
    pstMayApply: false,
  },
  NU: {
    taxLabel: "GST - 5%",
    explanation:
      "Nunavut: charge 5% GST. There is no territorial sales tax.",
    pstMayApply: false,
  },
  YT: {
    taxLabel: "GST - 5%",
    explanation:
      "Yukon: charge 5% GST. There is no territorial sales tax.",
    pstMayApply: false,
  },
  ON: {
    taxLabel: "HST - 13% (ON)",
    explanation:
      "Ontario place of supply uses 13% HST (combined GST/HST) for most taxable sales.",
    pstMayApply: false,
  },
  NS: {
    taxLabel: "HST - 14% (NS)",
    explanation:
      "Nova Scotia place of supply uses 14% HST for most taxable sales.",
    pstMayApply: false,
  },
  NB: {
    taxLabel: "HST - 15% (NB / PE / NL)",
    explanation:
      "New Brunswick place of supply uses 15% HST for most taxable sales.",
    pstMayApply: false,
  },
  PE: {
    taxLabel: "HST - 15% (NB / PE / NL)",
    explanation:
      "Prince Edward Island place of supply uses 15% HST for most taxable sales.",
    pstMayApply: false,
  },
  NL: {
    taxLabel: "HST - 15% (NB / PE / NL)",
    explanation:
      "Newfoundland and Labrador place of supply uses 15% HST for most taxable sales.",
    pstMayApply: false,
  },
  BC: {
    taxLabel: "GST - 5%",
    explanation:
      "For remote sellers, start with 5% GST. BC PST (7%) may also apply if you are registered to collect it locally.",
    pstMayApply: true,
  },
  SK: {
    taxLabel: "GST - 5%",
    explanation:
      "For remote sellers, start with 5% GST. Saskatchewan PST (6%) may also apply if you are registered to collect it locally.",
    pstMayApply: true,
  },
  MB: {
    taxLabel: "GST - 5%",
    explanation:
      "For remote sellers, start with 5% GST. Manitoba RST (7%) may also apply if you are registered to collect it locally.",
    pstMayApply: true,
  },
  QC: {
    taxLabel: "GST - 5%",
    explanation:
      "For remote sellers, start with 5% GST. Quebec QST may also apply if you are registered to collect it locally.",
    pstMayApply: true,
  },
};

function suggestionsFromLabel(taxLabel: string): TaxSuggestions {
  const option = findTaxOption(taxLabel);
  if (!option || option.gstRate == null) {
    return {
      ...DEFAULT_TAX_SUGGESTIONS,
      includeGst: false,
      includePst: false,
      suggestedLabel: "",
    };
  }
  return {
    includeGst: true,
    gstRate: option.gstRate.toFixed(2),
    includePst: option.pstRate != null,
    pstRate:
      option.pstRate != null
        ? option.pstRate.toFixed(2)
        : DEFAULT_TAX_SUGGESTIONS.pstRate,
    suggestedLabel: option.label,
  };
}

export function suggestTaxFromProvince(
  provinceCode: string,
): PlaceOfSupplySuggestion | null {
  const code = provinceCode.trim().toUpperCase();
  if (!code) return null;
  const match = BY_PROVINCE[code];
  if (!match) return null;
  return {
    provinceCode: code,
    ...match,
    suggestions: suggestionsFromLabel(match.taxLabel),
  };
}

export type TaxCategoryChip = {
  id: "zero-rated" | "exempt" | "out-of-scope";
  label: string;
  optionLabel: string;
  hint: string;
};

export const TAX_CATEGORY_CHIPS: TaxCategoryChip[] = [
  {
    id: "zero-rated",
    label: "Zero-rated",
    optionLabel: "Zero-rated - 0%",
    hint: "Taxable at 0% — show $0.00 tax. Examples: basic groceries, many prescription drugs/medical devices, exports outside Canada, feminine hygiene products.",
  },
  {
    id: "exempt",
    label: "Exempt",
    optionLabel: "Tax Exempt",
    hint: "GST/HST does not apply — leave tax blank/N/A (not $0.00). Examples: most healthcare & dental, educational services, child care for ages 14 and under, financial services, long-term residential rent.",
  },
  {
    id: "out-of-scope",
    label: "Out of scope",
    optionLabel: "No Tax",
    hint: "Not a taxable supply — omit tax. Examples: pure pass-through disbursements (no GST charged originally), tips/gratuities, employee salaries or dividends.",
  },
];

export function federalTaxLabelFromItems(
  taxLabels: string[],
): "GST" | "HST" | "GST/HST" {
  let hasGst = false;
  let hasHst = false;
  for (const label of taxLabels) {
    const option = findTaxOption(label);
    if (!option || option.gstRate == null) continue;
    if (/hst/i.test(option.label)) hasHst = true;
    else hasGst = true;
  }
  if (hasGst && hasHst) return "GST/HST";
  if (hasHst) return "HST";
  return "GST";
}

export function optionIsHst(option: AlbertaTaxOption | undefined) {
  return Boolean(option && /hst/i.test(option.label));
}

export function syncSuggestedLabelSafe(suggestions: TaxSuggestions) {
  return suggestions.suggestedLabel || syncSuggestedLabel(suggestions);
}
