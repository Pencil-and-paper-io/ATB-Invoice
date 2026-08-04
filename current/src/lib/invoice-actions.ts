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
  | "send"
  | "resend"
  | "send_test"
  | "send_reminder"
  | "mark_sent"
  | "mark_viewed"
  | "mark_followed_up"
  | "mark_paid";

export type InvoiceAction = {
  /** May be a synthetic parent key such as `download_menu`. */
  key: string;
  label: string;
  danger?: boolean;
  dividerBefore?: boolean;
  /** Renders a non-interactive section heading above this item. */
  sectionTitleBefore?: string;
  /** Nested choices (e.g. Download → As PDF / As CSV). */
  submenu?: { key: InvoiceActionKey; label: string }[];
};

/** Utilities available across statuses (shown in a shared menu section). */
export const INVOICE_GLOBAL_ACTION_KEYS: readonly InvoiceActionKey[] = [
  "download",
  "export_csv",
  "duplicate",
  "template",
] as const;

/** Destructive actions — always last, red. */
export const INVOICE_DESTRUCTIVE_ACTION_KEYS: readonly InvoiceActionKey[] = [
  "void",
  "uncollectible",
  "delete",
] as const;

/** Manual lifecycle overrides — grouped under “Manually mark as…”. */
export const INVOICE_MANUAL_MARK_KEYS: readonly InvoiceActionKey[] = [
  "mark_sent",
  "mark_viewed",
  "mark_followed_up",
  "mark_paid",
] as const;

/**
 * Single-invoice action matrix.
 * Manual mark keys are added by status in `manualMarkKeysForStatus`.
 * Download PDF/CSV are merged into a single “Download” submenu in the UI.
 */
export const STATUS_ACTION_MATRIX: Record<InvoiceStatus, InvoiceActionKey[]> = {
  drafted: [
    "edit",
    "send",
    "download",
    "export_csv",
    "send_test",
    "duplicate",
    "delete",
  ],
  sent: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "void",
    "template",
    "duplicate",
  ],
  viewed: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "void",
    "template",
    "duplicate",
  ],
  partially_paid: [
    "send_reminder",
    "send_receipt",
    "download",
    "export_csv",
    "void",
    "template",
    "uncollectible",
    "duplicate",
  ],
  paid: [
    "send_receipt",
    "download",
    "export_csv",
    "template",
    "duplicate",
  ],
  overdue_under_90: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "void",
    "template",
    "duplicate",
  ],
  overdue_over_90: [
    "resend",
    "send_reminder",
    "download",
    "export_csv",
    "uncollectible",
    "template",
    "duplicate",
  ],
  uncollectible: ["download", "export_csv", "template", "duplicate"],
  void: ["download", "export_csv", "template", "duplicate"],
};

const ACTION_META: Record<
  InvoiceActionKey,
  { label: string; danger?: boolean }
> = {
  edit: { label: "Edit" },
  download: { label: "As PDF" },
  export_csv: { label: "As CSV" },
  send_receipt: { label: "Send Receipt" },
  delete: { label: "Delete", danger: true },
  void: { label: "Void Invoice", danger: true },
  template: { label: "Save As Template" },
  uncollectible: { label: "Mark As Uncollectible", danger: true },
  duplicate: { label: "Duplicate" },
  send: { label: "Send Invoice" },
  resend: { label: "Re-Send Invoice" },
  send_test: { label: "Send Test Invoice" },
  send_reminder: { label: "Send Reminder" },
  mark_sent: { label: "Sent" },
  mark_viewed: { label: "Viewed" },
  mark_followed_up: { label: "Followed Up" },
  mark_paid: { label: "Paid" },
};

/** Send / re-send / reminder / receipt — kept contiguous with no internal dividers. */
export const INVOICE_SEND_ACTION_KEYS: readonly InvoiceActionKey[] = [
  "send",
  "resend",
  "send_test",
  "send_reminder",
  "send_receipt",
] as const;

const GLOBAL_SET = new Set<InvoiceActionKey>(INVOICE_GLOBAL_ACTION_KEYS);
const DESTRUCTIVE_SET = new Set<InvoiceActionKey>(INVOICE_DESTRUCTIVE_ACTION_KEYS);
const MANUAL_MARK_SET = new Set<InvoiceActionKey>(INVOICE_MANUAL_MARK_KEYS);
const DOWNLOAD_KEYS = new Set<InvoiceActionKey>(["download", "export_csv"]);
const SEND_SET = new Set<InvoiceActionKey>(INVOICE_SEND_ACTION_KEYS);

export function isManualMarkActionKey(key: string) {
  return MANUAL_MARK_SET.has(key as InvoiceActionKey);
}

export function isDownloadMenuActionKey(key: string) {
  return key === "download_menu";
}

export function isMarkMenuActionKey(key: string) {
  return key === "mark_menu";
}

export function isSendMenuActionKey(key: string) {
  return key === "send_menu";
}

export function isSendActionKey(key: string) {
  return SEND_SET.has(key as InvoiceActionKey);
}

/** Which manual mark options apply for a given status. */
export function manualMarkKeysForStatus(
  status: InvoiceStatus,
): InvoiceActionKey[] {
  if (status === "void" || status === "uncollectible") return [];
  if (status === "paid") return ["mark_followed_up"];
  return [...INVOICE_MANUAL_MARK_KEYS];
}

function toInvoiceAction(
  key: InvoiceActionKey,
  dividerBefore = false,
): InvoiceAction {
  return {
    key,
    label: ACTION_META[key].label,
    danger: ACTION_META[key].danger,
    dividerBefore,
  };
}

function partitionInvoiceKeys(keys: InvoiceActionKey[]) {
  const statusSpecific = keys.filter(
    (key) =>
      !GLOBAL_SET.has(key) &&
      !DESTRUCTIVE_SET.has(key) &&
      !MANUAL_MARK_SET.has(key) &&
      !DOWNLOAD_KEYS.has(key) &&
      !SEND_SET.has(key),
  );
  const send = INVOICE_SEND_ACTION_KEYS.filter((key) => keys.includes(key));
  const global = INVOICE_GLOBAL_ACTION_KEYS.filter(
    (key) => keys.includes(key) && !DOWNLOAD_KEYS.has(key),
  );
  const hasPdf = keys.includes("download");
  const hasCsv = keys.includes("export_csv");
  const manual = INVOICE_MANUAL_MARK_KEYS.filter((key) => keys.includes(key));
  const destructive = INVOICE_DESTRUCTIVE_ACTION_KEYS.filter((key) =>
    keys.includes(key),
  );
  return {
    statusSpecific,
    send,
    global,
    manual,
    destructive,
    hasPdf,
    hasCsv,
  };
}

function buildDownloadAction(hasPdf: boolean, hasCsv: boolean): InvoiceAction | null {
  if (!hasPdf && !hasCsv) return null;
  const submenu: { key: InvoiceActionKey; label: string }[] = [];
  if (hasPdf) submenu.push({ key: "download", label: "As PDF" });
  if (hasCsv) submenu.push({ key: "export_csv", label: "As CSV" });
  if (submenu.length === 1) {
    return {
      key: submenu[0]!.key,
      label: submenu[0]!.key === "download" ? "Download PDF" : "Download CSV",
    };
  }
  return {
    key: "download_menu",
    label: "Download",
    submenu,
  };
}

function buildMarkAction(manual: InvoiceActionKey[]): InvoiceAction | null {
  if (manual.length === 0) return null;
  if (manual.length === 1) {
    return toInvoiceAction(manual[0]!);
  }
  return {
    key: "mark_menu",
    label: "Manually mark as...",
    submenu: manual.map((key) => ({
      key,
      label: ACTION_META[key].label,
    })),
  };
}

function buildOrderedActions(keys: InvoiceActionKey[]): InvoiceAction[] {
  const {
    statusSpecific,
    send,
    global,
    manual,
    destructive,
    hasPdf,
    hasCsv,
  } = partitionInvoiceKeys(keys);

  const actions: InvoiceAction[] = statusSpecific.map((key) =>
    toInvoiceAction(key),
  );

  send.forEach((key, index) => {
    actions.push(
      toInvoiceAction(key, index === 0 && actions.length > 0),
    );
  });

  const markAction = buildMarkAction(manual);
  if (markAction) {
    actions.push({
      ...markAction,
      dividerBefore: actions.length > 0,
    });
  }

  const downloadAction = buildDownloadAction(hasPdf, hasCsv);
  if (downloadAction) {
    actions.push({
      ...downloadAction,
      dividerBefore: actions.length > 0,
    });
  }

  global.forEach((key) => {
    actions.push(toInvoiceAction(key));
  });

  destructive.forEach((key, index) => {
    actions.push(toInvoiceAction(key, index === 0 && actions.length > 0));
  });

  return actions;
}

function keysForStatus(status: InvoiceStatus): InvoiceActionKey[] {
  return [
    ...STATUS_ACTION_MATRIX[status],
    ...manualMarkKeysForStatus(status),
  ];
}

export function getActionsForStatus(
  status: InvoiceStatus,
  exclude: InvoiceActionKey[] = [],
): InvoiceAction[] {
  const excluded = new Set(exclude);
  const keys = keysForStatus(status).filter((key) => !excluded.has(key));
  return buildOrderedActions(keys);
}

/** Bulk / floating-bar actions shared across invoice rows. */
export function getInvoiceUniversalActions(): InvoiceAction[] {
  return foldInvoiceActionsForBulkBar(
    buildOrderedActions(["download", "export_csv", "duplicate"]),
  );
}

/** Actions that are not meaningful (or safe) for multi-select. */
const BULK_EXCLUDED_KEYS = new Set<InvoiceActionKey>(["edit"]);

/**
 * Fold flat send / single download / single mark items into click menus for
 * the floating bulk action bar only.
 */
export function foldInvoiceActionsForBulkBar(
  actions: InvoiceAction[],
): InvoiceAction[] {
  const result: InvoiceAction[] = [];
  let sendInserted = false;
  let downloadInserted = false;
  let markInserted = false;

  const sendItems = actions.filter((action) => isSendActionKey(action.key));
  const downloadItems = actions.filter(
    (action) =>
      action.key === "download" ||
      action.key === "export_csv" ||
      action.key === "download_menu",
  );
  const markItems = actions.filter(
    (action) =>
      isManualMarkActionKey(action.key) || action.key === "mark_menu",
  );

  for (const action of actions) {
    if (isSendActionKey(action.key)) {
      if (sendInserted) continue;
      sendInserted = true;
      result.push({
        key: "send_menu",
        label: "Send",
        dividerBefore: sendItems[0]?.dividerBefore,
        submenu: sendItems.map((item) => ({
          key: item.key as InvoiceActionKey,
          label: item.label,
        })),
      });
      continue;
    }

    if (
      action.key === "download" ||
      action.key === "export_csv" ||
      action.key === "download_menu"
    ) {
      if (downloadInserted) continue;
      downloadInserted = true;
      const submenu =
        action.key === "download_menu" && action.submenu
          ? action.submenu
          : downloadItems
              .filter((item) => item.key === "download" || item.key === "export_csv")
              .map((item) => ({
                key: item.key as InvoiceActionKey,
                label: item.key === "download" ? "As PDF" : "As CSV",
              }));
      // If we only found the menu itself, use its submenu; if flat items, use those
      const resolvedSubmenu =
        submenu.length > 0
          ? submenu
          : action.submenu ?? [];
      if (resolvedSubmenu.length === 0) continue;
      result.push({
        key: "download_menu",
        label: "Download",
        dividerBefore: downloadItems[0]?.dividerBefore,
        submenu: resolvedSubmenu,
      });
      continue;
    }

    if (isManualMarkActionKey(action.key) || action.key === "mark_menu") {
      if (markInserted) continue;
      markInserted = true;
      const submenu =
        action.key === "mark_menu" && action.submenu
          ? action.submenu
          : markItems
              .filter((item) => isManualMarkActionKey(item.key))
              .map((item) => ({
                key: item.key as InvoiceActionKey,
                label: item.label,
              }));
      const resolvedSubmenu = submenu.length > 0 ? submenu : action.submenu ?? [];
      if (resolvedSubmenu.length === 0) continue;
      result.push({
        key: "mark_menu",
        label: "Manually mark as...",
        dividerBefore: markItems[0]?.dividerBefore,
        submenu: resolvedSubmenu,
      });
      continue;
    }

    result.push(action);
  }

  return result;
}

/**
 * Bulk bar actions = intersection of actions available on every selected
 * status (Edit excluded). Falls back to universal utilities when nothing is
 * selected.
 */
export function getInvoiceBulkActions(
  statuses: InvoiceStatus[],
): InvoiceAction[] {
  if (statuses.length === 0) return getInvoiceUniversalActions();

  const unique = [...new Set(statuses)];
  let sharedKeys = keysForStatus(unique[0]!).filter(
    (key) => !BULK_EXCLUDED_KEYS.has(key),
  );

  for (const status of unique.slice(1)) {
    const allowed = new Set(keysForStatus(status));
    sharedKeys = sharedKeys.filter((key) => allowed.has(key));
  }

  if (sharedKeys.length === 0) return getInvoiceUniversalActions();

  return foldInvoiceActionsForBulkBar(buildOrderedActions(sharedKeys));
}

export const UNCOLLECTIBLE_REASON_CODES = [
  "Customer insolvent/bankrupt",
  "Disputed invoice (settled)",
  "Unprofitable to collect (small balance)",
  "Other",
] as const;
