import type { InvoiceDetailsState } from "@/components/invoice/InvoiceDetailsPanel";
import {
  peekNextInvoiceNumber,
  todayIso,
} from "@/lib/document-numbers";

const STORAGE_KEY = "atb-invoice-draft-details";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadInvoiceDetails(): InvoiceDetailsState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InvoiceDetailsState;
  } catch {
    return null;
  }
}

export function persistInvoiceDetails(details: InvoiceDetailsState) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
}

export function defaultInvoiceDetails(): InvoiceDetailsState {
  return {
    invoiceNumber: peekNextInvoiceNumber(),
    issueDate: "Send right away",
    dueDate: "Net 30",
    taxMode: "inclusive",
    currency: "CAD",
    referenceNumber: "",
    serviceStart: todayIso(),
    serviceEnd: "",
  };
}
