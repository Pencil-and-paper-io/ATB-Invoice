/**
 * Organization settings — source of defaults that cascade to new customers,
 * quotes, and invoices.
 */

export const ORG_SETTINGS_STORAGE_KEY = "atb-organization-settings";

/** Reference copy shown on invoices — single source of truth, not user-edited. */
export type PaymentReferenceDetail = {
  label: string;
  text: string;
  italic?: boolean;
};

export const CORE_PAYMENT_METHODS: readonly {
  id: "interac" | "eft" | "cash" | "cheque";
  label: string;
  invoiceLabel: string;
  needsAccount: boolean;
  details: readonly PaymentReferenceDetail[];
}[] = [
  {
    id: "interac",
    label: "Interac e-Transfer",
    invoiceLabel: "Interac e-Transfer Request",
    needsAccount: true,
    details: [
      { label: "Cost to you", text: "$1.50 per request" },
      { label: "Cost to customer", text: "Free" },
      {
        label: "Limits",
        text: "Typically capped at $3,000 per day (dependent on client's personal bank plan)",
      },
    ],
  },
  {
    id: "eft",
    label: "EFT (Direct Deposit)",
    invoiceLabel: "EFT (Direct Deposit)",
    needsAccount: true,
    details: [
      {
        label: "Cost to you",
        text: "Up to $1.50 per EFT deposit; check your specific account terms.",
      },
      { label: "Cost to customer", text: "Typically free" },
      {
        label: "Limits",
        text: "$3,000 to $10,000 per day (dependent on client's personal bank security limits)",
      },
      {
        label: "Note",
        text: "Selecting this will display your bank deposit info on the invoice. You can turn this payment mechanism for specific clients later.",
        italic: true,
      },
    ],
  },
  {
    id: "cash",
    label: "Cash",
    invoiceLabel: "Cash",
    needsAccount: false,
    details: [
      {
        label: "Cost to you",
        text: "Up to $2.50 per $1,000 cash; check your specific account terms.",
      },
      {
        label: "Cost to customer",
        text: "Free at their own bank's ATM, or up to $2.00 if using an out-of-network machine.",
      },
    ],
  },
  {
    id: "cheque",
    label: "Cheque",
    invoiceLabel: "Cheque",
    needsAccount: false,
    details: [
      {
        label: "Cost to you",
        text: "Up to $1.00 per cheque; check your specific account terms.",
      },
      {
        label: "Cost to customer",
        text: "Up to $2.00 per cheque written",
      },
    ],
  },
];

export type PaymentMethodId = (typeof CORE_PAYMENT_METHODS)[number]["id"];

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  enabled: boolean;
  /** Deposit destination label / account nickname for Interac or EFT */
  accountLabel: string;
};

export type OrganizationSettings = {
  businessName: string;
  gstHstNumber: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  brandColor: string;
  logoDataUrl: string | null;
  currency: string;
  taxStatus: "Taxable" | "Tax-exempt";
  quoteExpiryDays: string;
  paymentTerms: string;
  paymentMethods: PaymentMethodConfig[];
  /** Labels of enabled methods selected as customer/invoice defaults */
  paymentPreferences: string[];
  autoSend: boolean;
  reminders: boolean;
  reminderDays: string;
  receipts: boolean;
};

function defaultPaymentMethods(): PaymentMethodConfig[] {
  return CORE_PAYMENT_METHODS.map((method) => ({
    id: method.id,
    enabled: method.id === "interac",
    accountLabel: "",
  }));
}

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  businessName: "Horlicks Company",
  gstHstNumber: "",
  email: "invoicing@horlicks.com",
  phone: "1-403-257-0099",
  addressLine1: "115-31st Ave SE",
  addressLine2: "",
  city: "Calgary",
  province: "AB",
  postalCode: "T3Z 1R0",
  brandColor: "#FF7F30",
  logoDataUrl: null,
  currency: "CAD",
  taxStatus: "Taxable",
  quoteExpiryDays: "45",
  paymentTerms: "Net 30",
  paymentMethods: defaultPaymentMethods(),
  paymentPreferences: ["Interac e-Transfer"],
  autoSend: false,
  reminders: false,
  reminderDays: "3",
  receipts: false,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizePaymentMethods(
  parsed?: Partial<PaymentMethodConfig>[],
): PaymentMethodConfig[] {
  const defaults = defaultPaymentMethods();
  if (!Array.isArray(parsed) || parsed.length === 0) return defaults;

  return defaults.map((fallback) => {
    const match = parsed.find((entry) => entry?.id === fallback.id);
    return {
      id: fallback.id,
      enabled: Boolean(match?.enabled ?? fallback.enabled),
      accountLabel:
        typeof match?.accountLabel === "string"
          ? match.accountLabel
          : fallback.accountLabel,
    };
  });
}

export function paymentMethodLabel(id: PaymentMethodId) {
  return CORE_PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id;
}

export function getEnabledPaymentMethodLabels(
  settings: OrganizationSettings,
): string[] {
  return settings.paymentMethods
    .filter((method) => method.enabled)
    .map((method) => paymentMethodLabel(method.id));
}

export type InvoicePaymentOption = {
  id: PaymentMethodId;
  label: string;
  checked: boolean;
  details: PaymentReferenceDetail[];
};

/** Build invoice payment rows from org enablement + shared reference copy. */
export function getInvoicePaymentOptions(
  settings: OrganizationSettings = loadOrganizationSettings(),
): InvoicePaymentOption[] {
  const preferenceLabels = new Set(
    settings.paymentPreferences.length > 0
      ? settings.paymentPreferences
      : getEnabledPaymentMethodLabels(settings).slice(0, 1),
  );

  return CORE_PAYMENT_METHODS.filter((method) =>
    settings.paymentMethods.some(
      (entry) => entry.id === method.id && entry.enabled,
    ),
  ).map((method) => {
    const label = paymentMethodLabel(method.id);
    return {
      id: method.id,
      label: method.invoiceLabel,
      checked: preferenceLabels.has(label),
      details: [...method.details],
    };
  });
}

export function loadOrganizationSettings(): OrganizationSettings {
  if (!canUseStorage()) {
    return {
      ...DEFAULT_ORGANIZATION_SETTINGS,
      paymentMethods: defaultPaymentMethods(),
      paymentPreferences: [
        ...DEFAULT_ORGANIZATION_SETTINGS.paymentPreferences,
      ],
    };
  }
  try {
    const raw = localStorage.getItem(ORG_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_ORGANIZATION_SETTINGS,
        paymentMethods: defaultPaymentMethods(),
        paymentPreferences: [
          ...DEFAULT_ORGANIZATION_SETTINGS.paymentPreferences,
        ],
      };
    }
    const parsed = JSON.parse(raw) as Partial<OrganizationSettings>;
    const paymentMethods = normalizePaymentMethods(parsed.paymentMethods);
    const enabledLabels: string[] = paymentMethods
      .filter((method) => method.enabled)
      .map((method) => paymentMethodLabel(method.id));

    let paymentPreferences = Array.isArray(parsed.paymentPreferences)
      ? parsed.paymentPreferences.filter((label) =>
          enabledLabels.includes(label),
        )
      : [...DEFAULT_ORGANIZATION_SETTINGS.paymentPreferences];

    if (
      !Array.isArray(parsed.paymentMethods) &&
      Array.isArray(parsed.paymentPreferences)
    ) {
      paymentMethods.forEach((method) => {
        const label = paymentMethodLabel(method.id);
        method.enabled = parsed.paymentPreferences!.includes(label);
      });
      paymentPreferences = parsed.paymentPreferences.filter((label) =>
        CORE_PAYMENT_METHODS.some((method) => method.label === label),
      );
    }

    if (paymentPreferences.length === 0 && enabledLabels.length > 0) {
      paymentPreferences = [enabledLabels[0]!];
    }

    return {
      ...DEFAULT_ORGANIZATION_SETTINGS,
      ...parsed,
      paymentMethods,
      paymentPreferences,
    };
  } catch {
    return {
      ...DEFAULT_ORGANIZATION_SETTINGS,
      paymentMethods: defaultPaymentMethods(),
      paymentPreferences: [
        ...DEFAULT_ORGANIZATION_SETTINGS.paymentPreferences,
      ],
    };
  }
}

export function saveOrganizationSettings(settings: OrganizationSettings) {
  if (!canUseStorage()) return;
  localStorage.setItem(ORG_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/** Defaults that cascade onto new customer records */
export function getCustomerCascadeDefaults(
  settings: OrganizationSettings = loadOrganizationSettings(),
) {
  const enabled = getEnabledPaymentMethodLabels(settings);
  const paymentPreferences = settings.paymentPreferences.filter((label) =>
    enabled.includes(label),
  );

  return {
    currency: settings.currency,
    taxStatus: settings.taxStatus,
    quoteExpiryDays: settings.quoteExpiryDays,
    paymentTerms: settings.paymentTerms,
    paymentPreferences:
      paymentPreferences.length > 0
        ? paymentPreferences
        : enabled.slice(0, 1),
    autoSend: settings.autoSend,
    reminders: settings.reminders,
    reminderDays: settings.reminderDays,
    receipts: settings.receipts,
  };
}
