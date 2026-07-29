"use client";

import { useEffect, useState } from "react";
import {
  channelLabel,
  formatReminderSendDateLabel,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
  type DocumentKind,
} from "@/lib/document-automations";
import {
  appendInvoiceActivityExtra,
  appendQuoteActivityExtra,
  formatActivityNow,
} from "@/lib/document-activity";
import type { DocumentAutomationsState } from "./DocumentAutomationsSection";
import { EditScheduledReminderModal } from "./ScheduledReminderPanel";
import { PencilIcon } from "./ui";

export type DocumentActivityItem = {
  id: string;
  time: string;
  text: string;
};

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

/**
 * Shared activity timeline for preview/sent invoices and quotes.
 * Optionally prepends a scheduled reminder row (or an Add reminder slot).
 */
export function DocumentActivityTimeline({
  documentKind,
  pastItems,
  anchorLabel,
  customerId,
  showScheduledReminder = true,
  allowSendNow = false,
}: {
  documentKind: DocumentKind;
  pastItems: DocumentActivityItem[];
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
                <p className="mt-1 text-sm text-[#666666]">{item.text}</p>
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
