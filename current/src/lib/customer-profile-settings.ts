import {
  DEFAULT_TAX_SUGGESTIONS,
  syncSuggestedLabel,
  type TaxSuggestions,
} from "@/lib/tax-suggestions";
import { orgSuppressesSalesTax } from "@/lib/organization-settings";

const STORAGE_KEY = "atb-customer-profile-settings";

export type CustomerProfileSettings = {
  taxStatus: "Taxable" | "Tax-exempt";
  taxSuggestions: TaxSuggestions;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeSuggestions(
  value: Partial<TaxSuggestions> | undefined,
): TaxSuggestions {
  if (!value) return { ...DEFAULT_TAX_SUGGESTIONS };
  const hasSelection =
    Boolean(value.suggestedLabel?.trim()) ||
    value.includeGst === true ||
    value.includePst === true;
  if (!hasSelection) {
    return {
      includeGst: false,
      gstRate: "",
      includePst: false,
      pstRate: "",
      suggestedLabel: "",
    };
  }
  const base = { ...DEFAULT_TAX_SUGGESTIONS, ...value };
  return {
    ...base,
    suggestedLabel: base.suggestedLabel || syncSuggestedLabel(base),
  };
}

export function loadCustomerProfileSettings(
  customerId: string | null | undefined,
): CustomerProfileSettings | null {
  if (!customerId || !canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<
      string,
      Partial<CustomerProfileSettings>
    >;
    const entry = parsed[customerId];
    if (!entry) return null;
    return {
      taxStatus: entry.taxStatus === "Tax-exempt" ? "Tax-exempt" : "Taxable",
      taxSuggestions: normalizeSuggestions(entry.taxSuggestions),
    };
  } catch {
    return null;
  }
}

export function saveCustomerProfileSettings(
  customerId: string,
  settings: CustomerProfileSettings,
) {
  if (!canUseStorage() || !customerId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Record<string, CustomerProfileSettings>)
      : {};
    parsed[customerId] = {
      taxStatus: settings.taxStatus,
      taxSuggestions: normalizeSuggestions(settings.taxSuggestions),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage failures in demo
  }
}

/** Tax label to prefill on quote/invoice line items for this customer. */
export function getCustomerDefaultTaxLabel(customerId: string | null | undefined) {
  if (!customerId) return "";
  if (orgSuppressesSalesTax()) return "";
  const settings = loadCustomerProfileSettings(customerId);
  if (!settings) {
    return DEFAULT_TAX_SUGGESTIONS.suggestedLabel;
  }
  return settings.taxSuggestions.suggestedLabel.trim();
}
