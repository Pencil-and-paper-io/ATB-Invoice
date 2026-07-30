"use client";

import { useEffect, useId, useState } from "react";
import {
  channelLabel,
  formatReminderSendDateLabel,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
  DOCUMENT_AUTOMATIONS_CHANGED_EVENT,
  type DocumentKind,
} from "@/lib/document-automations";
import {
  appendInvoiceActivityExtra,
  appendQuoteActivityExtra,
  formatActivityNow,
  type ActivityItem,
} from "@/lib/document-activity";
import { draftInvoice } from "@/lib/invoice-demo-data";
import {
  formatLinkCountdown,
  SHAREABLE_LINK_TTL_SECONDS,
} from "@/lib/shareable-link";
import type { DocumentAutomationsState } from "./DocumentAutomationsSection";
import { EditScheduledReminderModal } from "./ScheduledReminderPanel";
import { PencilIcon } from "./ui";

export type DocumentActivityItem = ActivityItem;

function ChannelTooltip({
  channel,
  destination,
}: {
  channel: "email" | "text";
  destination: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline">
      <button
        type="button"
        className="inline text-inherit underline decoration-black/35 underline-offset-2 transition hover:decoration-black/70"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {channel}
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-midnight-ink px-2.5 py-1.5 text-xs leading-4 text-white shadow-lg"
        >
          {destination}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-midnight-ink"
            aria-hidden
          />
        </span>
      ) : null}
    </span>
  );
}

function ActivityHistoryText({ item }: { item: DocumentActivityItem }) {
  const match = item.text.match(/via (email|text)\b/i);
  if (!match || match.index == null) {
    return <p className="mt-1 text-sm text-[#666666]">{item.text}</p>;
  }

  const channel = match[1].toLowerCase() as "email" | "text";
  const before = item.text.slice(0, match.index);
  const after = item.text.slice(match.index + match[0].length);
  const destination =
    item.sendDestination ??
    (channel === "email"
      ? draftInvoice.customer.email
      : draftInvoice.customer.phone);

  return (
    <p className="mt-1 text-sm text-[#666666]">
      {before}via{" "}
      <ChannelTooltip channel={channel} destination={destination} />
      {after}
    </p>
  );
}

function ActivityDot({ upcoming }: { upcoming?: boolean }) {
  if (upcoming) {
    return (
      <span
        className="relative z-10 mt-0.5 h-2 w-2 shrink-0 rounded-full border border-dashed border-midnight-ink bg-white"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="relative z-10 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-midnight-ink"
      aria-hidden
    />
  );
}

function sendByLabel(channel: DocumentAutomationsState["reminderChannel"]) {
  return `Send by ${channelLabel(channel).toLowerCase()}`;
}

const reminderPillClass =
  "mt-1.5 flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md border border-black/12 bg-black/[0.04] px-2.5 py-1.5 text-left text-sm text-black/50 transition hover:border-black/20 hover:bg-black/[0.07] hover:text-black/70";

function SentLinkActivityExtras({
  item,
  onRevoke,
}: {
  item: DocumentActivityItem;
  onRevoke: () => void;
}) {
  const [expiresAt] = useState(() => {
    if (item.linkExpiresAt) return item.linkExpiresAt;
    const remaining =
      item.linkRemainingSeconds ?? SHAREABLE_LINK_TTL_SECONDS;
    return Date.now() + remaining * 1000;
  });
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
  );
  const revoked = Boolean(item.linkRevoked);
  const expired = !revoked && remainingSeconds <= 0;

  useEffect(() => {
    if (revoked) return;
    const id = window.setInterval(() => {
      setRemainingSeconds(
        Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
      );
    }, 250);
    return () => window.clearInterval(id);
  }, [expiresAt, revoked]);

  if (revoked) {
    return (
      <span className="mt-1.5 inline-flex items-center rounded bg-black/[0.04] px-2 py-0.5 text-xs font-semibold text-black/55">
        Link revoked
      </span>
    );
  }

  if (expired) {
    return (
      <span className="mt-1.5 inline-flex items-center rounded bg-black/[0.04] px-2 py-0.5 text-xs font-semibold text-black/55">
        Link expired
      </span>
    );
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center rounded border border-sunshine-yellow/70 bg-sunshine-yellow/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-midnight-ink"
        role="status"
        aria-live="polite"
      >
        {formatLinkCountdown(remainingSeconds)} left
      </span>
      <button
        type="button"
        onClick={onRevoke}
        className="text-xs font-semibold text-prime-blue underline-offset-2 hover:underline"
      >
        Revoke access
      </button>
    </div>
  );
}

/**
 * Shared activity timeline for preview/sent invoices and quotes.
 * Optionally prepends a scheduled reminder row (or an Add reminder slot).
 */
export function DocumentActivityTimeline({
  documentKind,
  pastItems,
  onPastItemsChange,
  anchorLabel,
  customerId,
  showScheduledReminder = true,
  allowSendNow = false,
}: {
  documentKind: DocumentKind;
  pastItems: DocumentActivityItem[];
  /** When provided, enables revoke updates for shareable-link rows. */
  onPastItemsChange?: (items: DocumentActivityItem[]) => void;
  /** Due date or expiry label used to compute the reminder send date. */
  anchorLabel: string;
  customerId?: string | null;
  showScheduledReminder?: boolean;
  /** Sent documents can pick an absolute date / Now; preview uses days-before. */
  allowSendNow?: boolean;
}) {
  const [schedule, setSchedule] = useState<DocumentAutomationsState | null>(
    null,
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSchedule(loadOrInitDocumentAutomations(documentKind, customerId));
  }, [documentKind, customerId]);

  useEffect(() => {
    function onAutomationsChanged(event: Event) {
      const detail = (event as CustomEvent<{ kind?: DocumentKind }>).detail;
      if (detail?.kind && detail.kind !== documentKind) return;
      setSchedule(loadOrInitDocumentAutomations(documentKind, customerId));
    }
    window.addEventListener(
      DOCUMENT_AUTOMATIONS_CHANGED_EVENT,
      onAutomationsChanged,
    );
    return () =>
      window.removeEventListener(
        DOCUMENT_AUTOMATIONS_CHANGED_EVENT,
        onAutomationsChanged,
      );
  }, [documentKind, customerId]);

  function logActivity(text: string) {
    const item = {
      id: `rem-${Date.now()}`,
      time: formatActivityNow(),
      text,
    };
    if (documentKind === "invoice") appendInvoiceActivityExtra(item);
    else appendQuoteActivityExtra(item);
  }

  function applySchedule(next: DocumentAutomationsState) {
    if (next.reminderSendDate === "now") {
      const cleared = {
        ...next,
        reminders: false,
        reminderSendDate: null,
        reminderChannel: null as DocumentAutomationsState["reminderChannel"],
      };
      persistDocumentAutomations(documentKind, cleared);
      setSchedule(cleared);
      setEditing(false);
      logActivity(`${channelLabel(next.reminderChannel)} reminder sent`);
      return;
    }

    persistDocumentAutomations(documentKind, next);
    setSchedule(next);
    setEditing(false);
  }

  function removeSchedule() {
    if (!schedule) {
      setEditing(false);
      return;
    }
    const next = {
      ...schedule,
      reminders: false,
      reminderChannel: null,
      reminderSendDate: null,
    };
    persistDocumentAutomations(documentKind, next);
    setSchedule(next);
    setEditing(false);
  }

  function revokeLink(itemId: string) {
    onPastItemsChange?.(
      pastItems.map((item) =>
        item.id === itemId ? { ...item, linkRevoked: true } : item,
      ),
    );
  }

  const showReminderSlot = Boolean(showScheduledReminder && schedule);
  const hasScheduled = Boolean(schedule?.reminders);

  return (
    <>
      <div className="flex flex-col">
        {showReminderSlot ? (
          <div className="relative flex gap-5">
            <div className="relative flex w-2 shrink-0 flex-col items-center">
              <ActivityDot upcoming />
              {pastItems.length > 0 ? (
                <span
                  className="mt-1 w-0 flex-1 border-l border-dashed border-midnight-ink"
                  aria-hidden
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1 pb-4">
              {hasScheduled && schedule ? (
                <>
                  <p className="type-subtitle-1 text-black">
                    {formatReminderSendDateLabel(
                      schedule.reminderSendDate,
                      Number(schedule.reminderDays) || 0,
                      anchorLabel,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-black">Scheduled reminder</p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className={reminderPillClass}
                    aria-label="Edit scheduled reminder"
                  >
                    <span className="min-w-0 truncate">
                      {sendByLabel(schedule.reminderChannel)}
                    </span>
                    <PencilIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={reminderPillClass}
                  aria-label="Add reminder"
                >
                  <span className="min-w-0 truncate">Add reminder</span>
                  <PencilIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {pastItems.map((item, index) => {
          const isLast = index === pastItems.length - 1;

          return (
            <div key={item.id} className="relative flex gap-5">
              <div className="relative flex w-2 shrink-0 flex-col items-center">
                <ActivityDot />
                {!isLast ? (
                  <span
                    className="mt-1 w-0 flex-1 border-l border-solid border-midnight-ink"
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                <p className="type-subtitle-1 text-black">{item.time}</p>
                <ActivityHistoryText item={item} />
                {item.kind === "sent_link" ? (
                  <SentLinkActivityExtras
                    item={item}
                    onRevoke={() => revokeLink(item.id)}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {editing && schedule ? (
        <EditScheduledReminderModal
          documentKind={documentKind}
          value={schedule}
          anchorLabel={anchorLabel}
          onClose={() => setEditing(false)}
          onSave={applySchedule}
          onRemove={removeSchedule}
          allowSendNow={allowSendNow}
        />
      ) : null}
    </>
  );
}
