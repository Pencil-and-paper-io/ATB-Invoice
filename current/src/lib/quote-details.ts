import type { InvoiceDetailsState } from "@/components/invoice/InvoiceDetailsPanel";
import {
  allocateNextQuoteNumber,
  incrementDocumentNumber,
  todayIso,
} from "@/lib/document-numbers";

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

/** Bump the quote number and persist for a new draft. */
export function duplicateQuoteDetails(): InvoiceDetailsState {
  const today = todayIso();
  const current = loadQuoteDetails() ?? {
    invoiceNumber: allocateNextQuoteNumber(),
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

export function formatQuoteDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
