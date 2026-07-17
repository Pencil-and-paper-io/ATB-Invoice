import type { InvoiceDetailsState } from "@/components/invoice/InvoiceDetailsPanel";

const STORAGE_KEY = "atb-invoice-quote-details";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadQuoteDetails(): InvoiceDetailsState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InvoiceDetailsState;
  } catch {
    return null;
  }
}

export function persistQuoteDetails(details: InvoiceDetailsState) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
}

/** Bump the quote number (e.g. 0003 → 0004) and persist for a new draft. */
export function duplicateQuoteDetails(): InvoiceDetailsState {
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const current = loadQuoteDetails() ?? {
    invoiceNumber: "0003",
    issueDate: today,
    dueDate: "Net 30",
    taxMode: "inclusive" as const,
    currency: "CAD",
    validUntil: "",
    serviceStart: today,
    serviceEnd: "",
  };

  const nextNumber = incrementDocumentNumber(current.invoiceNumber);
  const duplicated: InvoiceDetailsState = {
    ...current,
    invoiceNumber: nextNumber,
    issueDate: today,
  };
  persistQuoteDetails(duplicated);
  return duplicated;
}

function incrementDocumentNumber(value: string) {
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return `${value}-2`;
  const [, prefix, digits] = match;
  const next = String(Number(digits) + 1).padStart(digits.length, "0");
  return `${prefix}${next}`;
}

export function formatQuoteDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
