"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  hrefForCustomerInvoice,
  hrefForCustomerQuote,
} from "@/lib/invoice-demo-data";
import { SendReminderModal } from "./SendReminderModal";

type NotificationKind =
  | "paid"
  | "overdue"
  | "viewed"
  | "partially_paid"
  | "quote_accepted"
  | "quote_rejected";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  documentKind: "invoice" | "quote";
  title: string;
  body: string;
  timeAgo: string;
  unread: boolean;
  number: string;
  amount: string;
  metaLabel: string;
  accountMasked?: string;
  customerName?: string;
  /** Status string used for routing to the document detail view. */
  routeStatus: string;
};

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    kind: "paid",
    documentKind: "invoice",
    title: "Invoice Paid",
    body: "This invoice was successfully paid by e-transfer to your account ending in 0303.",
    timeAgo: "2d ago",
    unread: true,
    number: "2880",
    amount: "$ 1,500.00",
    metaLabel: "Sent Jul 8",
    accountMasked: "**** **** **** 7091",
    routeStatus: "Paid",
  },
  {
    id: "n2",
    kind: "overdue",
    documentKind: "invoice",
    title: "Invoice Overdue",
    body: "Invoice #3002 for Acme Construction Co is 18 days past due. Send a reminder to follow up.",
    timeAgo: "1d ago",
    unread: true,
    number: "3002",
    amount: "$ 2,187.50",
    metaLabel: "Due Jul 5",
    customerName: "Acme Construction Co",
    routeStatus: "Overdue",
  },
  {
    id: "n3",
    kind: "viewed",
    documentKind: "invoice",
    title: "Invoice Viewed",
    body: "Acme Construction Co opened invoice #2998. They may be preparing to pay.",
    timeAgo: "6h ago",
    unread: true,
    number: "2998",
    amount: "$ 960.00",
    metaLabel: "Viewed today",
    customerName: "Acme Construction Co",
    routeStatus: "Viewed",
  },
  {
    id: "n4",
    kind: "quote_accepted",
    documentKind: "quote",
    title: "Quote Accepted",
    body: "Acme Construction Co accepted quote Q-104. You can convert it to an invoice.",
    timeAgo: "1d ago",
    unread: true,
    number: "Q-104",
    amount: "$ 4,200.00",
    metaLabel: "Accepted Jul 22",
    customerName: "Acme Construction Co",
    routeStatus: "Accepted",
  },
  {
    id: "n5",
    kind: "quote_rejected",
    documentKind: "quote",
    title: "Quote Rejected",
    body: "Cedar Contracting declined quote Q-088. Review their feedback if provided.",
    timeAgo: "2d ago",
    unread: false,
    number: "Q-088",
    amount: "$ 3,100.00",
    metaLabel: "Rejected Jul 20",
    customerName: "Cedar Contracting",
    routeStatus: "Rejected",
  },
  {
    id: "n6",
    kind: "partially_paid",
    documentKind: "invoice",
    title: "Invoice Partially Paid",
    body: "Acme Construction Co paid part of invoice #3003. A balance is still outstanding.",
    timeAgo: "3d ago",
    unread: false,
    number: "3003",
    amount: "$ 1,400.00 due",
    metaLabel: "Partially paid",
    customerName: "Acme Construction Co",
    routeStatus: "Partially Paid",
  },
  {
    id: "n7",
    kind: "overdue",
    documentKind: "invoice",
    title: "Invoice Overdue",
    body: "Invoice #3002 still has an unpaid balance. Send a reminder to collect payment.",
    timeAgo: "4d ago",
    unread: false,
    number: "3002",
    amount: "$ 2,187.50",
    metaLabel: "Due Jul 5",
    customerName: "Acme Construction Co",
    routeStatus: "Overdue",
  },
];

const KIND_STYLE: Record<
  NotificationKind,
  { iconWrap: string; amount: string; meta: string }
> = {
  paid: {
    iconWrap: "bg-[#E8F7EC] text-[#1B7A3A]",
    amount: "text-midnight-ink",
    meta: "bg-black/[0.06] text-black/55",
  },
  overdue: {
    iconWrap: "bg-[#FDECEC] text-[#C62828]",
    amount: "text-[#C62828]",
    meta: "bg-[#FDECEC] text-[#C62828]",
  },
  viewed: {
    iconWrap: "bg-[#3C6CFF]/10 text-[#3C6CFF]",
    amount: "text-midnight-ink",
    meta: "bg-[#3C6CFF]/10 text-[#3C6CFF]",
  },
  partially_paid: {
    iconWrap: "bg-[#FFF8E6] text-[#8A6A00]",
    amount: "text-[#8A6A00]",
    meta: "bg-[#FFF8E6] text-[#8A6A00]",
  },
  quote_accepted: {
    iconWrap: "bg-[#E8F7EC] text-[#1B7A3A]",
    amount: "text-midnight-ink",
    meta: "bg-[#E8F7EC] text-[#1B7A3A]",
  },
  quote_rejected: {
    iconWrap: "bg-[#FDECEC] text-[#C62828]",
    amount: "text-midnight-ink",
    meta: "bg-[#FDECEC] text-[#C62828]",
  },
};

export function NotificationsPanel({
  panelId,
  onClose,
}: {
  panelId: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState(DEMO_NOTIFICATIONS);
  const [reminderTarget, setReminderTarget] = useState<AppNotification | null>(
    null,
  );
  const unreadCount = useMemo(
    () => items.filter((item) => item.unread).length,
    [items],
  );

  function clearAll() {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  }

  function markRead(id: string) {
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, unread: false } : entry,
      ),
    );
  }

  function openDocument(item: AppNotification) {
    markRead(item.id);
    const href =
      item.documentKind === "quote"
        ? hrefForCustomerQuote(item.routeStatus)
        : hrefForCustomerInvoice(item.routeStatus);
    onClose?.();
    router.push(href);
  }

  return (
    <>
      <div
        id={panelId}
        role="dialog"
        aria-label="Notifications"
        className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,400px)] overflow-hidden rounded-xl border border-black/10 bg-white text-midnight-ink shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <h2 className="text-base font-semibold text-midnight-ink">
            {unreadCount} New Notification{unreadCount === 1 ? "" : "s"}
          </h2>
          <button
            type="button"
            onClick={clearAll}
            disabled={unreadCount === 0}
            className="text-sm font-semibold text-prime-blue transition hover:underline disabled:cursor-default disabled:text-black/30 disabled:no-underline"
          >
            Clear All
          </button>
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-black/50">
            You’re all caught up.
          </p>
        ) : (
          <ul className="max-h-[min(70vh,600px)] overflow-y-auto py-2">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationItem
                  item={item}
                  onActivate={() => openDocument(item)}
                  onSendReminder={() => {
                    markRead(item.id);
                    setReminderTarget(item);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {reminderTarget ? (
        <SendReminderModal
          invoiceNumber={`#${reminderTarget.number}`}
          customerName={reminderTarget.customerName}
          onClose={() => setReminderTarget(null)}
          onSent={() => setReminderTarget(null)}
        />
      ) : null}
    </>
  );
}

function NotificationItem({
  item,
  onActivate,
  onSendReminder,
}: {
  item: AppNotification;
  onActivate: () => void;
  onSendReminder: () => void;
}) {
  const style = KIND_STYLE[item.kind];
  const isOverdue = item.kind === "overdue";
  const docLabel = item.documentKind === "quote" ? "Quote" : "Invoice";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      className="relative w-full cursor-pointer px-5 py-6 text-left outline-none transition hover:bg-black/[0.04] focus-visible:bg-black/[0.04]"
    >
      {item.unread ? (
        <span
          className="absolute right-4 top-5 h-2.5 w-2.5 rounded-full bg-sunshine-yellow"
          aria-label="Unread"
        />
      ) : null}

      <div className="flex items-start gap-3 pr-4">
        <span
          className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}
        >
          <KindIcon kind={item.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-midnight-ink">{item.title}</p>
            <p className="shrink-0 text-xs text-black/45">{item.timeAgo}</p>
          </div>
          <p className="mt-1.5 text-sm leading-5 text-black/70">{item.body}</p>

          <div className="mt-4 rounded-lg border border-black/10 bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-midnight-ink">
                {docLabel} #{item.number.replace(/^#/, "")}
              </p>
              <p className={`shrink-0 text-sm font-semibold ${style.amount}`}>
                {item.amount}
              </p>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span
                className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${style.meta}`}
              >
                {item.metaLabel}
              </span>
              {item.accountMasked ? (
                <span className="text-xs tracking-wide text-black/45">
                  {item.accountMasked}
                </span>
              ) : null}
            </div>
          </div>

          {isOverdue ? (
            <button
              type="button"
              className="ui-btn-secondary mt-4 h-9 px-4 text-sm"
              onClick={(event) => {
                event.stopPropagation();
                onSendReminder();
              }}
            >
              Send reminder
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: NotificationKind }) {
  if (kind === "paid" || kind === "quote_accepted") return <CheckIcon />;
  if (kind === "overdue") return <OverdueIcon />;
  if (kind === "viewed") return <EyeIcon />;
  if (kind === "partially_paid") return <PartialIcon />;
  return <RejectIcon />;
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="m2.5 8.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OverdueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v5.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.25" r="1" fill="currentColor" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PartialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.75a8.25 8.25 0 0 1 0 16.5"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m9 9 6 6M15 9l-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
