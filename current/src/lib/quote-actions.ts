export type QuoteStatus =
  | "drafted"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "void";

export type QuoteActionKey =
  | "edit"
  | "delete"
  | "void"
  | "template"
  | "duplicate"
  | "download"
  | "export_csv"
  | "resend"
  | "copy_link"
  | "send_test"
  | "send_reminder"
  | "mark_viewed"
  | "mark_rejected"
  | "mark_accepted"
  | "view_history";

export type QuoteAction = {
  key: QuoteActionKey;
  label: string;
  danger?: boolean;
  dividerBefore?: boolean;
};

/** Utilities available across statuses (shown in a shared menu section). */
export const QUOTE_GLOBAL_ACTION_KEYS: readonly QuoteActionKey[] = [
  "download",
  "export_csv",
  "duplicate",
  "template",
  "view_history",
] as const;

/** Destructive actions — always last, red. */
export const QUOTE_DESTRUCTIVE_ACTION_KEYS: readonly QuoteActionKey[] = [
  "void",
  "delete",
] as const;

/**
 * Singular quote actions — sent quotes remain editable.
 * Draft has no public link yet (no copy_link / send_test / resend).
 */
export const QUOTE_STATUS_ACTION_MATRIX: Record<QuoteStatus, QuoteActionKey[]> =
  {
    drafted: ["edit", "download", "export_csv", "duplicate", "delete"],
    sent: [
      "resend",
      "send_reminder",
      "download",
      "export_csv",
      "copy_link",
      "template",
      "duplicate",
      "void",
    ],
    viewed: [
      "resend",
      "send_reminder",
      "download",
      "export_csv",
      "copy_link",
      "template",
      "duplicate",
      "void",
    ],
    accepted: ["download", "export_csv", "copy_link", "template", "duplicate"],
    rejected: ["download", "export_csv", "copy_link", "template", "duplicate"],
    expired: ["edit", "download", "export_csv", "template", "duplicate", "void"],
    void: ["download", "export_csv", "template", "duplicate"],
  };

const ACTION_META: Record<
  QuoteActionKey,
  { label: string; danger?: boolean }
> = {
  edit: { label: "Edit" },
  download: { label: "Download PDF" },
  export_csv: { label: "Download CSV" },
  delete: { label: "Delete", danger: true },
  void: { label: "Void Quote", danger: true },
  template: { label: "Save As Template" },
  duplicate: { label: "Duplicate" },
  resend: { label: "Re-Send Quote" },
  copy_link: { label: "Copy Quote Link" },
  send_test: { label: "Send Test Quote" },
  send_reminder: { label: "Send Reminder" },
  mark_viewed: { label: "Viewed" },
  mark_rejected: { label: "Rejected" },
  mark_accepted: { label: "Accepted" },
  view_history: { label: "View History" },
};

const GLOBAL_SET = new Set<QuoteActionKey>(QUOTE_GLOBAL_ACTION_KEYS);
const DESTRUCTIVE_SET = new Set<QuoteActionKey>(QUOTE_DESTRUCTIVE_ACTION_KEYS);

function toQuoteAction(
  key: QuoteActionKey,
  status: QuoteStatus,
  dividerBefore = false,
): QuoteAction {
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

function partitionQuoteKeys(keys: QuoteActionKey[]) {
  const statusSpecific = keys.filter(
    (key) => !GLOBAL_SET.has(key) && !DESTRUCTIVE_SET.has(key),
  );
  const global = QUOTE_GLOBAL_ACTION_KEYS.filter((key) => keys.includes(key));
  const destructive = QUOTE_DESTRUCTIVE_ACTION_KEYS.filter((key) =>
    keys.includes(key),
  );
  return { statusSpecific, global, destructive };
}

export function getQuoteActionsForStatus(
  status: QuoteStatus,
  exclude: QuoteActionKey[] = [],
): QuoteAction[] {
  const excluded = new Set(exclude);
  const keys = QUOTE_STATUS_ACTION_MATRIX[status].filter(
    (key) => !excluded.has(key),
  );
  const { statusSpecific, global, destructive } = partitionQuoteKeys(keys);

  const actions: QuoteAction[] = statusSpecific.map((key) =>
    toQuoteAction(key, status),
  );

  global.forEach((key, index) => {
    actions.push(toQuoteAction(key, status, index === 0 && actions.length > 0));
  });

  destructive.forEach((key, index) => {
    actions.push(toQuoteAction(key, status, index === 0 && actions.length > 0));
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

/** Bulk / floating-bar actions shared across quote rows. */
export function getQuoteUniversalActions(): QuoteAction[] {
  const keys: QuoteActionKey[] = ["download", "export_csv", "duplicate"];
  return keys.map((key) => toQuoteAction(key, "sent"));
}

/**
 * Bulk bar actions = intersection of actions available on every selected
 * status (Edit excluded — not bulk-friendly). Falls back to universal
 * utilities when nothing is selected.
 */
export function getQuoteBulkActions(statuses: QuoteStatus[]): QuoteAction[] {
  if (statuses.length === 0) return getQuoteUniversalActions();

  const unique = [...new Set(statuses)];
  let sharedKeys = QUOTE_STATUS_ACTION_MATRIX[unique[0]!].filter(
    (key) => key !== "edit",
  );

  for (const status of unique.slice(1)) {
    const allowed = new Set(QUOTE_STATUS_ACTION_MATRIX[status]);
    sharedKeys = sharedKeys.filter((key) => allowed.has(key));
  }

  if (sharedKeys.length === 0) return getQuoteUniversalActions();

  const { statusSpecific, global, destructive } =
    partitionQuoteKeys(sharedKeys);
  const labelStatus = unique.length === 1 ? unique[0]! : "sent";
  const actions: QuoteAction[] = statusSpecific.map((key) =>
    toQuoteAction(key, labelStatus),
  );
  global.forEach((key, index) => {
    actions.push(
      toQuoteAction(key, labelStatus, index === 0 && actions.length > 0),
    );
  });
  destructive.forEach((key, index) => {
    actions.push(
      toQuoteAction(key, labelStatus, index === 0 && actions.length > 0),
    );
  });
  return actions;
}
