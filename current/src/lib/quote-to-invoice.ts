import { loadQuoteDetails } from "@/lib/quote-details";
import {
  peekNextInvoiceNumber,
  todayIso,
} from "@/lib/document-numbers";
import {
  DEFAULT_QUOTE_TIMELINE_FOR_INVOICE,
  saveQuoteTimelineForInvoice,
  type ActivityItem,
} from "@/lib/document-activity";
import type { InvoiceDetailsState } from "@/components/invoice/InvoiceDetailsPanel";

const CONVERSION_KEY = "atb-quote-accepted-conversion";

export type QuoteAcceptancePayload = {
  quoteNumber: string;
  acceptedAt: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/** Persist that a quote was accepted so the invoice draft can prefill. */
export function markQuoteAcceptedForInvoice(
  quoteNumber?: string,
  quoteTimeline: ActivityItem[] = DEFAULT_QUOTE_TIMELINE_FOR_INVOICE,
) {
  if (!canUseStorage()) return;
  const details = loadQuoteDetails();
  const payload: QuoteAcceptancePayload = {
    quoteNumber:
      quoteNumber?.trim() ||
      details?.invoiceNumber?.trim() ||
      "Q-118",
    acceptedAt: Date.now(),
  };
  sessionStorage.setItem(CONVERSION_KEY, JSON.stringify(payload));
  saveQuoteTimelineForInvoice(quoteTimeline);
}

export function peekQuoteAcceptance(): QuoteAcceptancePayload | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(CONVERSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuoteAcceptancePayload;
  } catch {
    return null;
  }
}

export function consumeQuoteAcceptance(): QuoteAcceptancePayload | null {
  const payload = peekQuoteAcceptance();
  if (canUseStorage()) sessionStorage.removeItem(CONVERSION_KEY);
  return payload;
}

/** Build invoice draft details from the accepted quote. */
export function invoiceDetailsFromAcceptedQuote(
  acceptance: QuoteAcceptancePayload,
): InvoiceDetailsState {
  const quote = loadQuoteDetails();
  return {
    invoiceNumber: peekNextInvoiceNumber(),
    issueDate: "Send right away",
    dueDate: quote?.dueDate || "Net 30",
    taxMode: quote?.taxMode || "inclusive",
    currency: quote?.currency || "CAD",
    referenceNumber: acceptance.quoteNumber,
    serviceStart: quote?.serviceStart || todayIso(),
    serviceEnd: quote?.serviceEnd || "",
  };
}
