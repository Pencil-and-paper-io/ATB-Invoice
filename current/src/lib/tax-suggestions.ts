import {
  ALBERTA_TAX_OPTIONS,
  findTaxOption,
  type AlbertaTaxOption,
} from "@/lib/alberta-tax";
import { OUTSIDE_CANADA_LOCATION } from "@/lib/canada";
import {
  loadOrganizationSettings,
  orgSuppressesSalesTax,
  type OrganizationSettings,
} from "@/lib/organization-settings";

export type TaxSuggestions = {
  includeGst: boolean;
  gstRate: string;
  includePst: boolean;
  pstRate: string;
  suggestedLabel: string;
};

export type TaxStatusOption = "Taxable" | "Tax-exempt";

/** Shared Taxable / Tax-exempt copy for org Tax Info and customer Tax Info. */
export const TAX_SETTING_OPTIONS: {
  value: TaxStatusOption;
  label: string;
  /** Manage Organization → Tax Info */
  orgDetails: string;
  /** Customer profile → Tax Info */
  customerDetails: string;
}[] = [
  {
    value: "Taxable",
    label: "Taxable",
    orgDetails:
      "Choose this if you usually charge GST/HST on the goods or services you sell. Most vendors that sell taxable supplies (products, consulting, trades, and similar commercial services) fall here. New customers will inherit this as their default.",
    customerDetails:
      "Usually charge GST/HST on the goods or services you sell this customer.",
  },
  {
    value: "Tax-exempt",
    label: "Tax-exempt",
    orgDetails:
      "Choose this if GST/HST does not apply to what you sell — show tax as blank/N/A (not $0.00). Common exempt vendors include most healthcare and dental practices, many educational providers, child care for ages 14 and under, most financial services, and long-term residential landlords. If you’re unsure, check CRA guidance or your accountant.",
    customerDetails:
      "GST/HST does not apply — show tax as blank/N/A (not $0.00). Common examples include healthcare and dental, education, child care for ages 14 and under, financial services, and long-term residential rent.",
  },
];

export const DEFAULT_TAX_SUGGESTIONS: TaxSuggestions = {
  includeGst: true,
  gstRate: "5.00",
  includePst: false,
  pstRate: "8.00",
  suggestedLabel: "GST - 5%",
};

/** Rate options for customer Taxable defaults (excludes categories & GST-included). */
export const CUSTOMER_TAXABLE_OPTIONS: AlbertaTaxOption[] =
  ALBERTA_TAX_OPTIONS.filter(
    (option) =>
      !option.included &&
      option.label !== "Zero-rated - 0%" &&
      option.label !== "Tax Exempt" &&
      option.label !== "No Tax",
  );

/** Non-taxable category options for customers (excludes line-level “No Tax”). */
export const CUSTOMER_NON_TAXABLE_OPTIONS: AlbertaTaxOption[] =
  ALBERTA_TAX_OPTIONS.filter(
    (option) =>
      option.label === "Zero-rated - 0%" || option.label === "Tax Exempt",
  );

export type NonTaxableSuggestion = {
  label: string;
  note: string;
  suggestions: TaxSuggestions;
};

function orgDefaultsTaxExempt(
  org: OrganizationSettings = loadOrganizationSettings(),
): boolean {
  return orgSuppressesSalesTax(org) || org.taxStatus === "Tax-exempt";
}

export type TaxableSuggestion = {
  label: string;
  note: string;
  suggestions: TaxSuggestions;
};

/** Province → tax option label (aligned with place-of-supply recommendations). */
const PROVINCE_TAX_LABEL: Record<string, string> = {
  AB: "GST - 5%",
  NT: "GST - 5%",
  NU: "GST - 5%",
  YT: "GST - 5%",
  ON: "HST - 13% (ON)",
  NS: "HST - 14% (NS)",
  NB: "HST - 15% (NB / PE / NL)",
  PE: "HST - 15% (NB / PE / NL)",
  NL: "HST - 15% (NB / PE / NL)",
  BC: "GST - 5%",
  SK: "GST - 5%",
  MB: "GST - 5%",
  QC: "GST - 5%",
};

function resolveTaxableFromProvince(code: string): {
  label: string;
  suggestions: TaxSuggestions;
} | null {
  if (!code) return null;
  const label = PROVINCE_TAX_LABEL[code];
  if (!label) return null;
  const option = findTaxOption(label);
  if (!option) return null;
  return { label: option.label, suggestions: taxSuggestionsFromOption(option) };
}

/**
 * Recommended taxable rate for a customer from billing province, with org
 * Tax Setting context in the recommendation note.
 */
export function suggestTaxableForCustomer(province: string): TaxableSuggestion {
  const code = province.trim().toUpperCase();
  const orgExempt = orgDefaultsTaxExempt();

  const byProvince = resolveTaxableFromProvince(code);
  if (byProvince) {
    return {
      label: byProvince.label,
      note: orgExempt
        ? "Your organization default is tax-exempt — use Taxable only if this customer is an exception"
        : "Recommended based on customer's province",
      suggestions: byProvince.suggestions,
    };
  }

  if (code === OUTSIDE_CANADA_LOCATION.code) {
    const gst = findTaxOption("GST - 5%")!;
    return {
      label: gst.label,
      note: "Confirm whether supplies outside Canada should be zero-rated instead",
      suggestions: taxSuggestionsFromOption(gst),
    };
  }

  const fallback = { ...DEFAULT_TAX_SUGGESTIONS };
  return {
    label: fallback.suggestedLabel,
    note: orgExempt
      ? "Your organization default is tax-exempt — use Taxable only if this customer is an exception"
      : "Recommended GST default — add a billing province for a place-of-supply rate",
    suggestions: fallback,
  };
}

/**
 * Cascade org Tax Setting (+ location) into a recommended customer tax status
 * and nested rate / category defaults for new or empty profiles.
 */
export function suggestCustomerTaxCascade(province: string): {
  taxStatus: TaxStatusOption;
  suggestions: TaxSuggestions;
  recommendedLabel: string;
  recommendedNote: string;
} {
  const org = loadOrganizationSettings();
  const outsideCanada =
    province.trim().toUpperCase() === OUTSIDE_CANADA_LOCATION.code;

  if (orgDefaultsTaxExempt(org)) {
    if (outsideCanada) {
      const option = findTaxOption("Zero-rated - 0%")!;
      return {
        taxStatus: "Tax-exempt",
        suggestions: taxSuggestionsFromOption(option),
        recommendedLabel: option.label,
        recommendedNote: "Recommended for customers outside Canada",
      };
    }
    const option = findTaxOption("Tax Exempt")!;
    return {
      taxStatus: "Tax-exempt",
      suggestions: taxSuggestionsFromOption(option),
      recommendedLabel: option.label,
      recommendedNote: "Recommended based on your organization default",
    };
  }

  const taxable = suggestTaxableForCustomer(province);
  return {
    taxStatus: "Taxable",
    suggestions: taxable.suggestions,
    recommendedLabel: taxable.label,
    recommendedNote: taxable.note,
  };
}

/**
 * Pre-select Zero-rated for customers outside Canada, or Tax Exempt when the
 * organization does not charge GST/HST. Otherwise defaults to Tax Exempt.
 */
export function suggestNonTaxableForCustomer(
  province: string,
): NonTaxableSuggestion {
  const cascade = suggestCustomerTaxCascade(province);
  if (cascade.taxStatus === "Tax-exempt") {
    return {
      label: cascade.recommendedLabel,
      note: cascade.recommendedNote,
      suggestions: cascade.suggestions,
    };
  }

  const outsideCanada =
    province.trim().toUpperCase() === OUTSIDE_CANADA_LOCATION.code;
  if (outsideCanada) {
    const option = findTaxOption("Zero-rated - 0%")!;
    return {
      label: option.label,
      note: "Recommended for customers outside Canada",
      suggestions: taxSuggestionsFromOption(option),
    };
  }

  const option = findTaxOption("Tax Exempt")!;
  return {
    label: option.label,
    note: "",
    suggestions: taxSuggestionsFromOption(option),
  };
}

export function buildSuggestedTaxLabel({
  includeGst,
  gstRate,
  includePst,
  pstRate,
}: {
  includeGst: boolean;
  gstRate: number;
  includePst: boolean;
  pstRate: number;
}) {
  if (!includeGst && !includePst) return "";

  const match = ALBERTA_TAX_OPTIONS.find((option) => {
    if (includeGst && includePst) {
      return (
        option.gstRate != null &&
        option.pstRate != null &&
        Math.abs((option.gstRate ?? 0) - gstRate) < 0.001 &&
        Math.abs((option.pstRate ?? 0) - pstRate) < 0.001
      );
    }
    if (includeGst && !includePst) {
      return (
        option.gstRate != null &&
        option.pstRate == null &&
        Math.abs((option.gstRate ?? 0) - gstRate) < 0.001 &&
        !option.included
      );
    }
    return (
      option.pstRate != null &&
      option.gstRate == null &&
      Math.abs((option.pstRate ?? 0) - pstRate) < 0.001
    );
  });
  if (match) return match.label;

  if (includeGst && includePst) {
    const total = Number((gstRate + pstRate).toFixed(3));
    return `GST + PST / QST (${total}%)`;
  }
  if (includeGst) return `GST / HST - ${gstRate}%`;
  return `PST / QST - ${pstRate}%`;
}

export function taxSuggestionsFromOption(option: AlbertaTaxOption): TaxSuggestions {
  const includeGst = option.gstRate != null;
  const includePst = option.pstRate != null;
  const gstRate =
    option.gstRate != null ? option.gstRate.toFixed(2) : DEFAULT_TAX_SUGGESTIONS.gstRate;
  const pstRate =
    option.pstRate != null ? option.pstRate.toFixed(2) : DEFAULT_TAX_SUGGESTIONS.pstRate;
  return {
    includeGst,
    includePst,
    gstRate,
    pstRate,
    suggestedLabel: option.label,
  };
}

export function syncSuggestedLabel(suggestions: Omit<TaxSuggestions, "suggestedLabel">) {
  return buildSuggestedTaxLabel({
    includeGst: suggestions.includeGst,
    gstRate: Number(suggestions.gstRate) || 0,
    includePst: suggestions.includePst,
    pstRate: Number(suggestions.pstRate) || 0,
  });
}

export function formatTaxSuggestionsSummary(suggestions: TaxSuggestions) {
  if (suggestions.suggestedLabel.trim()) {
    return suggestions.suggestedLabel;
  }
  if (!suggestions.includeGst && !suggestions.includePst) {
    return "No tax rate selected";
  }
  return syncSuggestedLabel(suggestions) || "No tax rate selected";
}
