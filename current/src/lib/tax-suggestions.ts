import {
  ALBERTA_TAX_OPTIONS,
  type AlbertaTaxOption,
} from "@/lib/alberta-tax";

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
  if (!suggestions.includeGst && !suggestions.includePst) {
    return "No tax suggested";
  }
  return (
    suggestions.suggestedLabel ||
    syncSuggestedLabel(suggestions) ||
    "No tax suggested"
  );
}
