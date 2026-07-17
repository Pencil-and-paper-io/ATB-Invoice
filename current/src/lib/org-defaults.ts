/**
 * @deprecated Prefer `getCustomerCascadeDefaults` / `loadOrganizationSettings`
 * from `@/lib/organization-settings`. Kept for existing imports.
 */
export {
  DEFAULT_ORGANIZATION_SETTINGS as ORGANIZATION_DEFAULTS_FULL,
  getCustomerCascadeDefaults,
  loadOrganizationSettings,
} from "./organization-settings";

import { DEFAULT_ORGANIZATION_SETTINGS } from "./organization-settings";

/** Static fallback when storage is unavailable (SSR / first paint). */
export const ORGANIZATION_DEFAULTS = {
  currency: DEFAULT_ORGANIZATION_SETTINGS.currency,
  taxStatus: DEFAULT_ORGANIZATION_SETTINGS.taxStatus,
  quoteExpiryDays: DEFAULT_ORGANIZATION_SETTINGS.quoteExpiryDays,
  paymentTerms: DEFAULT_ORGANIZATION_SETTINGS.paymentTerms,
  paymentPreferences: [...DEFAULT_ORGANIZATION_SETTINGS.paymentPreferences],
  autoSend: DEFAULT_ORGANIZATION_SETTINGS.autoSend,
  reminders: DEFAULT_ORGANIZATION_SETTINGS.reminders,
  reminderDays: DEFAULT_ORGANIZATION_SETTINGS.reminderDays,
  receipts: DEFAULT_ORGANIZATION_SETTINGS.receipts,
};
