export type QuoteStatus =
  | "drafted"
  | "sent"
  | "viewed"
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
  | "resend"
  | "copy_link"
  | "send_test"
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

/**
 * Singular quote actions — sent quotes remain editable.
 * Draft has no public link yet (no copy_link / send_test / resend).
 * Decision marking lives on Record Decision; Void Quote is last and separated.
 */
export const QUOTE_STATUS_ACTION_MATRIX: Record<QuoteStatus, QuoteActionKey[]> =
  {
    drafted: ["edit", "download", "duplicate", "delete"],
    sent: ["resend", "download", "template", "duplicate", "void"],
    viewed: ["resend", "download", "template", "duplicate", "void"],
    rejected: ["download", "template", "duplicate"],
    expired: ["edit", "download", "template", "duplicate", "void"],
    void: ["download", "template", "duplicate"],
  };

const ACTION_META: Record<
  QuoteActionKey,
  { label: string; danger?: boolean }
> = {
  edit: { label: "Edit" },
  download: { label: "Download PDF" },
  delete: { label: "Delete", danger: true },
  void: { label: "Void Quote", danger: true },
  template: { label: "Save As Template" },
  duplicate: { label: "Duplicate And Edit" },
  resend: { label: "Re-Send" },
  copy_link: { label: "Copy Quote Link" },
  send_test: { label: "Send Test Quote" },
  mark_viewed: { label: "Viewed" },
  mark_rejected: { label: "Rejected" },
  mark_accepted: { label: "Accepted" },
  view_history: { label: "View History" },
};

export function getQuoteActionsForStatus(
  status: QuoteStatus,
  exclude: QuoteActionKey[] = [],
): QuoteAction[] {
  const excluded = new Set(exclude);
  const keys = QUOTE_STATUS_ACTION_MATRIX[status].filter(
    (key) => !excluded.has(key),
  );

  return keys.map((key) => {
    const dividerBefore = key === "void" || key === "delete";

    if (key === "download" && status === "drafted") {
      return {
        key,
        label: "Download Draft PDF",
        dividerBefore,
      };
    }
    return {
      key,
      label: ACTION_META[key].label,
      danger: ACTION_META[key].danger,
      dividerBefore,
    };
  });
}
