import {
  getInvoicePaymentOptions,
  loadOrganizationSettings,
  type InvoicePaymentOption,
  type PaymentMethodId,
} from "@/lib/organization-settings";

const INVOICE_KEY = "atb-draft-invoice-payments";
const QUOTE_KEY = "atb-draft-quote-payments";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function storageKey(kind: "invoice" | "quote") {
  return kind === "quote" ? QUOTE_KEY : INVOICE_KEY;
}

type StoredPaymentSelection = {
  checkedIds: PaymentMethodId[];
  accountLabels: Partial<Record<PaymentMethodId, string>>;
};

function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return (
    value === "interac" ||
    value === "eft" ||
    value === "cash" ||
    value === "cheque"
  );
}

export function persistDocumentPayments(
  kind: "invoice" | "quote",
  payments: InvoicePaymentOption[],
) {
  if (!canUseStorage()) return;
  const payload: StoredPaymentSelection = {
    checkedIds: payments.filter((p) => p.checked).map((p) => p.id),
    accountLabels: Object.fromEntries(
      payments
        .filter((p) => p.accountLabel?.trim())
        .map((p) => [p.id, p.accountLabel!.trim()]),
    ) as Partial<Record<PaymentMethodId, string>>,
  };
  localStorage.setItem(storageKey(kind), JSON.stringify(payload));
}

export function loadDocumentPayments(
  kind: "invoice" | "quote",
): InvoicePaymentOption[] {
  const base = getInvoicePaymentOptions(loadOrganizationSettings());
  if (!canUseStorage()) return base;
  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<StoredPaymentSelection>;
    const checkedIds = new Set(
      Array.isArray(parsed.checkedIds)
        ? parsed.checkedIds.filter(isPaymentMethodId)
        : [],
    );
    const labels =
      parsed.accountLabels && typeof parsed.accountLabels === "object"
        ? parsed.accountLabels
        : {};

    return base.map((option) => ({
      ...option,
      checked: checkedIds.has(option.id),
      accountLabel:
        (typeof labels[option.id] === "string" && labels[option.id]?.trim()) ||
        option.accountLabel,
    }));
  } catch {
    return base;
  }
}

export function eftPaymentSelected(payments: InvoicePaymentOption[]) {
  return payments.some((option) => option.id === "eft" && option.checked);
}

/** Customer-facing EFT instruction using the document number. */
export function eftCustomerReferenceNote(invoiceNumber: string) {
  const inv = invoiceNumber.trim();
  if (!inv) return null;
  return `Add [${inv}] in the reference field to make sure your payment is matched to this invoice.`;
}

/** Demo payment methods for the customer pay-invoice portal. */
export function customerPortalPaymentOptions(): InvoicePaymentOption[] {
  const base = getInvoicePaymentOptions(loadOrganizationSettings());
  const byId = new Map(base.map((option) => [option.id, option]));
  return (["interac", "eft"] as const).map((id) => {
    const existing = byId.get(id);
    if (existing) return { ...existing, checked: true };
    return {
      id,
      label: id === "interac" ? "Interac e-Transfer Request" : "EFT (Direct Deposit)",
      checked: true,
      details: [],
    };
  });
}
