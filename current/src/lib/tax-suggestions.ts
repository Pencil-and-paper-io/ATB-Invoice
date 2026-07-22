import {
  ALBERTA_TAX_OPTIONS,
  findTaxOption,
  type AlbertaTaxOption,
} from "@/lib/alberta-tax";
import { OUTSIDE_CANADA_LOCATION } from "@/lib/canada";
import {
  loadOrganizationSettings,
  orgSuppressesSalesTax,
} from "@/lib/organization-settings";

export type TaxSuggestions = {
  includeGst: boolean;
  gstRate: string;
  includePst: boolean;
  pstRate: string;
  suggestedLabel: string;
};

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

/**
 * Pre-select Zero-rated for customers outside Canada, or Tax Exempt when the
 * organization does not charge GST/HST. Otherwise defaults to Tax Exempt.
 */
export function suggestNonTaxableForCustomer(
  province: string,
): NonTaxableSuggestion {
  const outsideCanada =
    province.trim().toUpperCase() === OUTSIDE_CANADA_LOCATION.code;

  if (outsideCanada) {
    const option = findTaxOption("Zero-rated - 0%")!;
    return {
      label: option.label,
      note: "Recommended based on customer's location (outside Canada — often zero-rated exports)",
      suggestions: taxSuggestionsFromOption(option),
    };
  }

  const org = loadOrganizationSettings();
  if (orgSuppressesSalesTax(org) || org.taxStatus === "Tax-exempt") {
    const option = findTaxOption("Tax Exempt")!;
    return {
      label: option.label,
      note: "Recommended based on your organization profile (you are not charging GST/HST)",
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
