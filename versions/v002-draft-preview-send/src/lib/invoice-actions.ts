export type InvoiceStatus =
  | "drafted"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue_under_90"
  | "overdue_over_90"
  | "uncollectible";

export type InvoiceActionKey =
  | "edit"
  | "delete"
  | "void"
  | "template"
  | "uncollectible"
  | "duplicate"
  | "download";

export type InvoiceAction = {
  key: InvoiceActionKey;
  label: string;
  danger?: boolean;
};

/** Single-invoice action matrix from product rules. */
export const STATUS_ACTION_MATRIX: Record<InvoiceStatus, InvoiceActionKey[]> = {
  drafted: ["edit", "download", "delete", "duplicate"],
  sent: ["void", "template", "duplicate"],
  viewed: ["void", "template", "uncollectible", "duplicate"],
  partially_paid: ["void", "template", "uncollectible", "duplicate"],
  paid: ["template", "duplicate"],
  overdue_under_90: ["void", "template", "uncollectible", "duplicate"],
  overdue_over_90: ["template", "uncollectible", "duplicate"],
  uncollectible: ["template", "duplicate"],
};

const ACTION_META: Record<
  InvoiceActionKey,
  { label: string; danger?: boolean }
> = {
  edit: { label: "Edit" },
  download: { label: "Download" },
  delete: { label: "Delete", danger: true },
  void: { label: "Void Invoice", danger: true },
  template: { label: "Save as Template" },
  uncollectible: { label: "Mark as Uncollectible", danger: true },
  duplicate: { label: "Duplicate" },
};

export function getActionsForStatus(
  status: InvoiceStatus,
  exclude: InvoiceActionKey[] = [],
): InvoiceAction[] {
  const excluded = new Set(exclude);
  return STATUS_ACTION_MATRIX[status]
    .filter((key) => !excluded.has(key))
    .map((key) => ({
      key,
      label: ACTION_META[key].label,
      danger: ACTION_META[key].danger,
    }));
}

export const UNCOLLECTIBLE_REASON_CODES = [
  "Customer insolvent/bankrupt",
  "Disputed invoice (settled)",
  "Unprofitable to collect (small balance)",
  "Other",
] as const;
