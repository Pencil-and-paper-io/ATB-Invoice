export type InvoiceStatus =
  | "drafted"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue_under_90"
  | "overdue_over_90"
  | "uncollectible"
  | "void";

export type InvoiceActionKey =
  | "edit"
  | "delete"
  | "void"
  | "template"
  | "uncollectible"
  | "duplicate"
  | "download"
  | "export_csv"
  | "send_receipt"
  | "resend"
  | "copy_link"
  | "send_test"
  | "send_reminder"
  | "mark_viewed"
  | "view_history";

export type InvoiceAction = {
  key: InvoiceActionKey;
  label: string;
  danger?: boolean;
  dividerBefore?: boolean;
};

/** Utilities available across statuses (shown in a shared menu section). */
export const INVOICE_GLOBAL_ACTION_KEYS: readonly InvoiceActionKey[] = [
  "download",
  "export_csv",
  "duplicate",
  "template",
  "view_history",
] as const;

/** Destructive actions — always last, red. */
export const INVOICE_DESTRUCTIVE_ACTION_KEYS: readonly InvoiceActionKey[] = [
  "void",
  "uncollectible",
  "delete",
] as const;

/**
 * Single-invoice action matrix.
 * Draft has no public link yet (no copy_link / send_test / resend).
 */
export const STATUS_ACTION_MATRIX: Record<InvoiceStatus, InvoiceActionKey[]> = {
  drafted: ["edit", "download", "export_csv", "send_test", "duplicate", "delete"],
  sent: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "copy_link",
    "mark_viewed",
    "void",
    "template",
    "view_history",
    "duplicate",
  ],
  viewed: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "copy_link",
    "void",
    "template",
    "view_history",
    "duplicate",
  ],
  partially_paid: [
    "send_reminder",
    "send_receipt",
    "download",
    "export_csv",
    "copy_link",
    "void",
    "template",
    "uncollectible",
    "view_history",
    "duplicate",
  ],
  paid: [
    "send_receipt",
    "download",
    "export_csv",
    "copy_link",
    "template",
    "view_history",
    "duplicate",
  ],
  overdue_under_90: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "copy_link",
    "void",
    "template",
    "view_history",
    "duplicate",
  ],
  overdue_over_90: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "copy_link",
    "uncollectible",
    "template",
    "view_history",
    "duplicate",
  ],
  uncollectible: ["download", "export_csv", "template", "view_history", "duplicate"],
  void: ["download", "export_csv", "template", "view_history", "duplicate"],
};

const ACTION_META: Record<
  InvoiceActionKey,
  { label: string; danger?: boolean }
> = {
  edit: { label: "Edit" },
  download: { label: "Download PDF" },
  export_csv: { label: "Download CSV" },
  send_receipt: { label: "Send Receipt" },
  delete: { label: "Delete", danger: true },
  void: { label: "Void Invoice", danger: true },
  template: { label: "Save As Template" },
  uncollectible: { label: "Mark As Uncollectible", danger: true },
  duplicate: { label: "Duplicate" },
  resend: { label: "Re-Send Invoice" },
  copy_link: { label: "Copy Invoice Link" },
  send_test: { label: "Send Test Invoice" },
  send_reminder: { label: "Send Reminder" },
  mark_viewed: { label: "Mark As Viewed" },
  view_history: { label: "View History" },
};

const GLOBAL_SET = new Set<InvoiceActionKey>(INVOICE_GLOBAL_ACTION_KEYS);
const DESTRUCTIVE_SET = new Set<InvoiceActionKey>(INVOICE_DESTRUCTIVE_ACTION_KEYS);

function toInvoiceAction(
  key: InvoiceActionKey,
  status: InvoiceStatus,
  dividerBefore = false,
): InvoiceAction {
  if (key === "download" && status === "drafted") {
    return {
      key,
      label: "Download PDF",
      danger: ACTION_META[key].danger,
      dividerBefore,
    };
  }
  return {
    key,
    label: ACTION_META[key].label,
    danger: ACTION_META[key].danger,
    dividerBefore,
  };
}

function partitionInvoiceKeys(keys: InvoiceActionKey[]) {
  const statusSpecific = keys.filter(
    (key) => !GLOBAL_SET.has(key) && !DESTRUCTIVE_SET.has(key),
  );
  const global = INVOICE_GLOBAL_ACTION_KEYS.filter((key) => keys.includes(key));
  const destructive = INVOICE_DESTRUCTIVE_ACTION_KEYS.filter((key) =>
    keys.includes(key),
  );
  return { statusSpecific, global, destructive };
}

export function getActionsForStatus(
  status: InvoiceStatus,
  exclude: InvoiceActionKey[] = [],
): InvoiceAction[] {
  const excluded = new Set(exclude);
  const keys = STATUS_ACTION_MATRIX[status].filter((key) => !excluded.has(key));
  const { statusSpecific, global, destructive } = partitionInvoiceKeys(keys);

  const actions: InvoiceAction[] = statusSpecific.map((key) =>
    toInvoiceAction(key, status),
  );

  global.forEach((key, index) => {
    actions.push(
      toInvoiceAction(key, status, index === 0 && actions.length > 0),
    );
  });

  destructive.forEach((key, index) => {
    actions.push(
      toInvoiceAction(key, status, index === 0 && actions.length > 0),
    );
  });

  const resendIndex = actions.findIndex((action) => action.key === "resend");
  if (resendIndex >= 0 && actions[resendIndex + 1]) {
    actions[resendIndex + 1] = {
      ...actions[resendIndex + 1]!,
      dividerBefore: true,
    };
  }

  return actions;
}

/** Bulk / floating-bar actions shared across invoice rows. */
export function getInvoiceUniversalActions(): InvoiceAction[] {
  const keys: InvoiceActionKey[] = ["download", "export_csv", "duplicate"];
  return keys.map((key) => toInvoiceAction(key, "sent"));
}

/** Actions that are not meaningful (or safe) for multi-select. */
const BULK_EXCLUDED_KEYS = new Set<InvoiceActionKey>([
  "edit",
  "mark_viewed",
]);

/**
 * Bulk bar actions = intersection of actions available on every selected
 * status (Edit / Mark As Viewed excluded — not bulk-friendly). Falls back to
 * universal utilities when nothing is selected.
 */
export function getInvoiceBulkActions(
  statuses: InvoiceStatus[],
): InvoiceAction[] {
  if (statuses.length === 0) return getInvoiceUniversalActions();

  const unique = [...new Set(statuses)];
  let sharedKeys = STATUS_ACTION_MATRIX[unique[0]!].filter(
    (key) => !BULK_EXCLUDED_KEYS.has(key),
  );

  for (const status of unique.slice(1)) {
    const allowed = new Set(STATUS_ACTION_MATRIX[status]);
    sharedKeys = sharedKeys.filter((key) => allowed.has(key));
  }

  if (sharedKeys.length === 0) return getInvoiceUniversalActions();

  const { statusSpecific, global, destructive } =
    partitionInvoiceKeys(sharedKeys);
  const labelStatus = unique.length === 1 ? unique[0]! : "sent";
  const actions: InvoiceAction[] = statusSpecific.map((key) =>
    toInvoiceAction(key, labelStatus),
  );
  global.forEach((key, index) => {
    actions.push(
      toInvoiceAction(key, labelStatus, index === 0 && actions.length > 0),
    );
  });
  destructive.forEach((key, index) => {
    actions.push(
      toInvoiceAction(key, labelStatus, index === 0 && actions.length > 0),
    );
  });
  return actions;
}

export const UNCOLLECTIBLE_REASON_CODES = [
  "Customer insolvent/bankrupt",
  "Disputed invoice (settled)",
  "Unprofitable to collect (small balance)",
  "Other",
] as const;
