import type {
  DocumentAutomationsState,
  ReminderChannel,
} from "@/components/invoice/DocumentAutomationsSection";
import {
  getCustomerCascadeDefaults,
  loadOrganizationSettings,
} from "@/lib/organization-settings";
import { loadCustomerProfileSettings } from "@/lib/customer-profile-settings";

const STORAGE_KEYS = {
  invoice: "atb-invoice-document-automations",
  quote: "atb-quote-document-automations",
} as const;

export type DocumentKind = keyof typeof STORAGE_KEYS;

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function defaultAutomationsFromCascade(
  customerId?: string | null,
): DocumentAutomationsState {
  const cascade = getAutomationDefaultsForCustomer(customerId);
  return {
    autoSend: cascade.autoSend,
    autoSendInvoice: false,
    reminders: cascade.reminders,
    reminderDays: cascade.reminderDays,
    reminderChannel: cascade.reminders
      ? cascade.reminderChannel === "text"
        ? "text"
        : "email"
      : null,
    reminderSendDate: null,
  };
}

/** Org defaults, overridden by customer profile when present. */
export function getAutomationDefaultsForCustomer(
  customerId?: string | null,
) {
  const org = getCustomerCascadeDefaults(loadOrganizationSettings());
  const profile = customerId
    ? loadCustomerProfileSettings(customerId)
    : null;

  return {
    autoSend: profile?.autoSend ?? org.autoSend,
    reminders: profile?.reminders ?? org.reminders,
    reminderDays:
      profile?.reminderDays?.trim() || org.reminderDays || "3",
    reminderChannel:
      (profile?.reminders ?? org.reminders)
        ? org.reminderChannel === "text" || org.reminderChannel === "email"
          ? org.reminderChannel
          : "email"
        : null,
  };
}

export function loadDocumentAutomations(
  kind: DocumentKind,
): DocumentAutomationsState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS[kind]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DocumentAutomationsState>;
    return normalizeAutomations(parsed);
  } catch {
    return null;
  }
}

export function persistDocumentAutomations(
  kind: DocumentKind,
  value: DocumentAutomationsState,
) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(value));
}

export function loadOrInitDocumentAutomations(
  kind: DocumentKind,
  customerId?: string | null,
): DocumentAutomationsState {
  return loadDocumentAutomations(kind) ?? defaultAutomationsFromCascade(customerId);
}

function normalizeAutomations(
  value: Partial<DocumentAutomationsState>,
): DocumentAutomationsState {
  const reminders = Boolean(value.reminders);
  const channel =
    value.reminderChannel === "text" || value.reminderChannel === "email"
      ? value.reminderChannel
      : reminders
        ? ("email" as ReminderChannel)
        : null;
  return {
    autoSend: Boolean(value.autoSend),
    autoSendInvoice: Boolean(value.autoSendInvoice),
    reminders,
    reminderDays: String(value.reminderDays ?? "3").replace(/[^\d]/g, "") || "3",
    reminderChannel: reminders ? channel : null,
    reminderSendDate:
      typeof value.reminderSendDate === "string" &&
      (/^\d{4}-\d{2}-\d{2}$/.test(value.reminderSendDate) ||
        value.reminderSendDate === "now")
        ? value.reminderSendDate
        : null,
  };
}

export function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatReminderSendDateLabel(
  sendDate: string | null | undefined,
  daysBefore: number,
  anchorLabel: string,
): string {
  if (sendDate === "now") return "Now";
  if (sendDate && /^\d{4}-\d{2}-\d{2}$/.test(sendDate)) {
    const [year, month, day] = sendDate.split("-").map(Number);
    return new Intl.DateTimeFormat("en-CA", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }
  return formatScheduledReminderDate(daysBefore, anchorLabel);
}

/** Convert a display/anchor label into YYYY-MM-DD when possible. */
export function isoFromScheduledReminderDate(
  daysBefore: number,
  anchorLabel: string,
): string | null {
  const parsed = tryParseAnchorDate(anchorLabel);
  if (!parsed || !Number.isFinite(daysBefore) || daysBefore < 0) return null;
  const scheduled = new Date(parsed);
  scheduled.setDate(scheduled.getDate() - daysBefore);
  return `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, "0")}-${String(scheduled.getDate()).padStart(2, "0")}`;
}

/** Convert due/expiry display labels to YYYY-MM-DD when parseable. */
export function isoFromAnchorLabel(anchorLabel: string): string | null {
  const parsed = tryParseAnchorDate(anchorLabel);
  if (!parsed) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/** Approximate scheduled send date for demo display. */
export function formatScheduledReminderDate(
  daysBefore: number,
  anchorLabel: string,
): string {
  const parsed = tryParseAnchorDate(anchorLabel);
  if (!parsed || !Number.isFinite(daysBefore) || daysBefore < 0) {
    return `${daysBefore} day${daysBefore === 1 ? "" : "s"} before ${anchorLabel}`;
  }
  const scheduled = new Date(parsed);
  scheduled.setDate(scheduled.getDate() - daysBefore);
  return scheduled.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function tryParseAnchorDate(label: string): Date | null {
  const cleaned = label
    .replace(/^Due\s+/i, "")
    .replace(/^Expires\s+/i, "")
    .replace(/^Valid until\s+/i, "")
    .trim();
  const ms = Date.parse(cleaned);
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}

export function channelLabel(channel: ReminderChannel | null) {
  if (channel === "text") return "Text";
  return "Email";
}
