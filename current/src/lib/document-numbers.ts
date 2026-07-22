import { loadOrganizationSettings } from "@/lib/organization-settings";

const LAST_QUOTE_NUMBER_KEY = "atb-last-quote-number";
const LAST_INVOICE_NUMBER_KEY = "atb-last-invoice-number";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function incrementDocumentNumber(value: string) {
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return `${value}-2`;
  const [, prefix, digits] = match;
  const next = String(Number(digits) + 1).padStart(digits.length, "0");
  return `${prefix}${next}`;
}

function peekFromStorage(storageKey: string, startNumber: string) {
  if (!canUseStorage()) return startNumber;
  const last = localStorage.getItem(storageKey);
  if (!last) return startNumber;
  return incrementDocumentNumber(last);
}

function allocateFromStorage(storageKey: string, startNumber: string) {
  const next = peekFromStorage(storageKey, startNumber);
  if (canUseStorage()) {
    localStorage.setItem(storageKey, next);
  }
  return next;
}

/** Next quote number from org start number + last used. */
export function peekNextQuoteNumber() {
  const settings = loadOrganizationSettings();
  return peekFromStorage(LAST_QUOTE_NUMBER_KEY, settings.quoteStartNumber);
}

export function allocateNextQuoteNumber() {
  const settings = loadOrganizationSettings();
  return allocateFromStorage(LAST_QUOTE_NUMBER_KEY, settings.quoteStartNumber);
}

/** Next invoice number from org start number + last used. */
export function peekNextInvoiceNumber() {
  const settings = loadOrganizationSettings();
  return peekFromStorage(LAST_INVOICE_NUMBER_KEY, settings.invoiceStartNumber);
}

export function allocateNextInvoiceNumber() {
  const settings = loadOrganizationSettings();
  return allocateFromStorage(
    LAST_INVOICE_NUMBER_KEY,
    settings.invoiceStartNumber,
  );
}

/** Remember an edited/saved document number as the latest sequence. */
export function rememberDocumentNumber(
  kind: "quote" | "invoice",
  number: string,
) {
  if (!canUseStorage() || !number.trim()) return;
  const key =
    kind === "quote" ? LAST_QUOTE_NUMBER_KEY : LAST_INVOICE_NUMBER_KEY;
  localStorage.setItem(key, number.trim());
}

export function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToIso(iso: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Map org/customer payment terms into Due Date field options. */
export function normalizeDueDateOption(paymentTerms: string) {
  const value = paymentTerms.trim().toLowerCase();
  if (value.includes("15")) return "Net 15";
  if (value.includes("30")) return "Net 30";
  if (
    value.includes("receipt") ||
    value.includes("immediate") ||
    value.includes("upon")
  ) {
    return "Upon receipt";
  }
  return paymentTerms.trim() || "Net 30";
}
