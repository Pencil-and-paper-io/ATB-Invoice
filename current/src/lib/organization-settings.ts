/**
 * Organization settings — source of defaults that cascade to new customers,
 * quotes, and invoices.
 */

export const ORG_SETTINGS_STORAGE_KEY = "atb-organization-settings";

export type PaymentDetailField = {
  key: keyof PaymentMethodDetails;
  label: string;
  italic?: boolean;
};

export type PaymentMethodDetails = {
  costToYou: string;
  costToCustomer: string;
  limits: string;
  note: string;
};

export const CORE_PAYMENT_METHODS: readonly {
  id: "interac" | "eft" | "cash" | "cheque";
  label: string;
  invoiceLabel: string;
  needsAccount: boolean;
  detailFields: readonly PaymentDetailField[];
}[] = [
  {
    id: "interac",
    label: "Interac e-Transfer",
    invoiceLabel: "Interac e-Transfer Request",
    needsAccount: true,
    detailFields: [
      { key: "costToYou", label: "Cost to you" },
      { key: "costToCustomer", label: "Cost to customer" },
      { key: "limits", label: "Limits" },
    ],
  },
  {
    id: "eft",
    label: "EFT (Direct Deposit)",
    invoiceLabel: "EFT (Direct Deposit)",
    needsAccount: true,
    detailFields: [
      { key: "costToYou", label: "Cost to you" },
      { key: "costToCustomer", label: "Cost to customer" },
      { key: "limits", label: "Limits" },
      { key: "note", label: "Note", italic: true },
    ],
  },
  {
    id: "cash",
    label: "Cash",
    invoiceLabel: "Cash",
    needsAccount: false,
    detailFields: [
      { key: "costToYou", label: "Cost to you" },
      { key: "costToCustomer", label: "Cost to customer" },
    ],
  },
  {
    id: "cheque",
    label: "Cheque",
    invoiceLabel: "Cheque",
    needsAccount: false,
    detailFields: [
      { key: "costToYou", label: "Cost to you" },
      { key: "costToCustomer", label: "Cost to customer" },
    ],
  },
];

export type PaymentMethodId = (typeof CORE_PAYMENT_METHODS)[number]["id"];

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  enabled: boolean;
  /** Deposit destination label / account nickname for Interac or EFT */
  accountLabel: string;
} & PaymentMethodDetails;

const DEFAULT_PAYMENT_DETAILS: Record<PaymentMethodId, PaymentMethodDetails> = {
  interac: {
    costToYou: "$1.50 per request",
    costToCustomer: "Free",
    limits:
      "Typically capped at $3,000 per day (dependent on client's personal bank plan)",
    note: "",
  },
  eft: {
    costToYou:
      "Up to $1.50 per EFT deposit; check your specific account terms.",
    costToCustomer: "Typically free",
    limits:
      "$3,000 to $10,000 per day (dependent on client's personal bank security limits)",
    note: "Selecting this will display your bank deposit info on the invoice. You can turn this payment mechanism for specific clients later.",
  },
  cash: {
    costToYou:
      "Up to $2.50 per $1,000 cash; check your specific account terms.",
    costToCustomer:
      "Free at their own bank's ATM, or up to $2.00 if using an out-of-network machine.",
    limits: "",
    note: "",
  },
  cheque: {
    costToYou:
      "Up to $1.00 per cheque; check your specific account terms.",
    costToCustomer: "Up to $2.00 per cheque written",
    limits: "",
    note: "",
  },
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
    ...DEFAULT_PAYMENT_DETAILS[method.id],
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
      costToYou:
        typeof match?.costToYou === "string"
          ? match.costToYou
          : fallback.costToYou,
      costToCustomer:
        typeof match?.costToCustomer === "string"
          ? match.costToCustomer
          : fallback.costToCustomer,
      limits:
        typeof match?.limits === "string" ? match.limits : fallback.limits,
      note: typeof match?.note === "string" ? match.note : fallback.note,
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

export type InvoicePaymentDetail = {
  label: string;
  text: string;
  italic?: boolean;
};

export type InvoicePaymentOption = {
  id: PaymentMethodId;
  label: string;
  checked: boolean;
  details: InvoicePaymentDetail[];
};

/** Build invoice payment rows from org settings (single source of truth). */
export function getInvoicePaymentOptions(
  settings: OrganizationSettings = loadOrganizationSettings(),
): InvoicePaymentOption[] {
  const preferenceLabels = new Set(
    settings.paymentPreferences.length > 0
      ? settings.paymentPreferences
      : getEnabledPaymentMethodLabels(settings).slice(0, 1),
  );

  return CORE_PAYMENT_METHODS.map((method) => {
    const config = settings.paymentMethods.find(
      (entry) => entry.id === method.id,
    );
    const enabled = Boolean(config?.enabled);
    const label = paymentMethodLabel(method.id);
    const details: InvoicePaymentDetail[] = [];
    for (const field of method.detailFields) {
      const text = config?.[field.key]?.trim() ?? "";
      if (!text) continue;
      details.push({
        label: field.label,
        text,
        italic: field.italic,
      });
    }

    return {
      id: method.id,
      label: method.invoiceLabel,
      checked: enabled && preferenceLabels.has(label),
      details,
    };
  }).filter((option) => {
    const config = settings.paymentMethods.find(
      (entry) => entry.id === option.id,
    );
    return Boolean(config?.enabled);
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

    // Migrate older saves that only had paymentPreferences strings
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
