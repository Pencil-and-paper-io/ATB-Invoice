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

/**
 * Single-invoice action matrix.
 * Draft has no public link yet (no copy_link / send_test / resend).
 * Delete is always listed last so the menu can separate it.
 */
export const STATUS_ACTION_MATRIX: Record<InvoiceStatus, InvoiceActionKey[]> = {
  drafted: ["edit", "download", "export_csv", "duplicate", "delete"],
  sent: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "copy_link",
    "send_test",
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
    "send_test",
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
    "send_test",
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
  export_csv: { label: "Export CSV" },
  send_receipt: { label: "Send Receipt" },
  delete: { label: "Delete", danger: true },
  void: { label: "Void Invoice", danger: true },
  template: { label: "Save As Template" },
  uncollectible: { label: "Mark As Uncollectible", danger: true },
  duplicate: { label: "Duplicate" },
  resend: { label: "Re-Send" },
  copy_link: { label: "Copy Invoice Link" },
  send_test: { label: "Send Test Invoice" },
  send_reminder: { label: "Send Reminder" },
  mark_viewed: { label: "Mark As Viewed" },
  view_history: { label: "View History" },
};

export function getActionsForStatus(
  status: InvoiceStatus,
  exclude: InvoiceActionKey[] = [],
): InvoiceAction[] {
  const excluded = new Set(exclude);
  const keys = STATUS_ACTION_MATRIX[status].filter((key) => !excluded.has(key));
  const trailingKeys = new Set<InvoiceActionKey>([
    "void",
    "uncollectible",
    "delete",
  ]);

  let trailingDividerPlaced = false;
  return keys.map((key) => {
    const needsDivider = trailingKeys.has(key) && !trailingDividerPlaced;
    if (needsDivider) trailingDividerPlaced = true;

    if (key === "download" && status === "drafted") {
      return { key, label: "Download Draft PDF", dividerBefore: needsDivider };
    }
    return {
      key,
      label: ACTION_META[key].label,
      danger: ACTION_META[key].danger,
      dividerBefore: needsDivider,
    };
  });
}

export const UNCOLLECTIBLE_REASON_CODES = [
  "Customer insolvent/bankrupt",
  "Disputed invoice (settled)",
  "Unprofitable to collect (small balance)",
  "Other",
] as const;
