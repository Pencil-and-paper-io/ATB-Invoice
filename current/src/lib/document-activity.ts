export type ActivityItem = {
  id: string;
  time: string;
  text: string;
};

const QUOTE_TIMELINE_KEY = "atb-quote-timeline-for-invoice";
const INVOICE_PAYMENT_ACTIVITY_KEY = "atb-invoice-payment-activity";
const PENDING_TOAST_KEY = "atb-invoice-pending-toast";

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/** Default quote history shown on invoices created from an accepted quote. */
export const DEFAULT_QUOTE_TIMELINE_FOR_INVOICE: ActivityItem[] = [
  {
    id: "q-accept",
    time: "July 8, 10:15am",
    text: "Customer accepted the quote",
  },
  {
    id: "q3",
    time: "July 4, 3:33pm",
    text: "Quote was viewed by the customer for the first time",
  },
  {
    id: "q2",
    time: "July 4, 9:01am",
    text: "You sent the quote totalling $3,555.99 via email",
  },
  {
    id: "q1",
    time: "July 3, 7:01pm",
    text: "Quote was created for $3,555.99",
  },
];

export function formatActivityNow(date = new Date()): string {
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function saveQuoteTimelineForInvoice(items: ActivityItem[]) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(QUOTE_TIMELINE_KEY, JSON.stringify(items));
}

/** Ensure a quote timeline exists (e.g. Quick Links `/?from=quote`). */
export function ensureQuoteTimelineForInvoice(
  items: ActivityItem[] = DEFAULT_QUOTE_TIMELINE_FOR_INVOICE,
) {
  if (!canUseStorage()) return;
  if (sessionStorage.getItem(QUOTE_TIMELINE_KEY)) return;
  saveQuoteTimelineForInvoice(items);
}

export function loadQuoteTimelineForInvoice(): ActivityItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(QUOTE_TIMELINE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendInvoicePaymentActivity(item: ActivityItem) {
  if (!canUseStorage()) return;
  const existing = loadInvoicePaymentActivity();
  sessionStorage.setItem(
    INVOICE_PAYMENT_ACTIVITY_KEY,
    JSON.stringify([item, ...existing]),
  );
}

export function loadInvoicePaymentActivity(): ActivityItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(INVOICE_PAYMENT_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPendingInvoiceToast(message: string) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(PENDING_TOAST_KEY, message);
}

export function consumePendingInvoiceToast(): string | null {
  if (!canUseStorage()) return null;
  const message = sessionStorage.getItem(PENDING_TOAST_KEY);
  sessionStorage.removeItem(PENDING_TOAST_KEY);
  return message;
}

function isDemoPaymentPlaceholder(item: ActivityItem) {
  return (
    /^Payment of \$/i.test(item.text) ||
    /^Partial payment of \$/i.test(item.text)
  );
}

/** Merge live payments + base invoice events + originating quote history. */
export function mergeInvoiceActivity(base: ActivityItem[]): ActivityItem[] {
  const payments = loadInvoicePaymentActivity();
  const quote = loadQuoteTimelineForInvoice();
  const rest =
    payments.length > 0
      ? base.filter((item) => !isDemoPaymentPlaceholder(item))
      : base;

  const seen = new Set<string>();
  const out: ActivityItem[] = [];
  for (const item of [...payments, ...rest, ...quote]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export type RecordedPaymentSummary = {
  amount: number;
  method: string;
  isPartial: boolean;
  remaining: number;
  voidRemainder: boolean;
  chequeRef?: string;
};

export function buildPaymentActivityItem(
  payment: RecordedPaymentSummary,
  formatMoney: (value: number) => string,
): ActivityItem {
  const methodLabel = payment.chequeRef?.trim()
    ? `${payment.method} (${payment.chequeRef.trim()})`
    : payment.method;

  if (payment.isPartial && !payment.voidRemainder) {
    return {
      id: `pay-${Date.now()}`,
      time: formatActivityNow(),
      text: `Partial payment of ${formatMoney(payment.amount)} recorded via ${methodLabel} — ${formatMoney(payment.remaining)} remaining`,
    };
  }

  const closedNote =
    payment.isPartial && payment.voidRemainder
      ? ` (remaining ${formatMoney(payment.remaining)} voided)`
      : "";

  return {
    id: `pay-${Date.now()}`,
    time: formatActivityNow(),
    text: `Payment of ${formatMoney(payment.amount)} was recorded via ${methodLabel}${closedNote}`,
  };
}

export function toastMessageForPayment(payment: RecordedPaymentSummary) {
  if (payment.isPartial && !payment.voidRemainder) {
    return "Partial payment recorded";
  }
  if (payment.isPartial && payment.voidRemainder) {
    return "Payment recorded — remaining balance voided";
  }
  return "Payment recorded";
}
