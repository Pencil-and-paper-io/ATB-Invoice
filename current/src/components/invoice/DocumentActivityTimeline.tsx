"use client";

import { useEffect, useState } from "react";
import {
  channelLabel,
  formatScheduledReminderDate,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
  type DocumentKind,
} from "@/lib/document-automations";
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

/**
 * Shared activity timeline for preview/sent invoices and quotes.
 * Optionally prepends a 3-line scheduled reminder (date, label, send-by pill).
 */
export function DocumentActivityTimeline({
  documentKind,
  pastItems,
  anchorLabel,
  customerId,
  showScheduledReminder = true,
}: {
  documentKind: DocumentKind;
  pastItems: DocumentActivityItem[];
  /** Due date or expiry label used to compute the reminder send date. */
  anchorLabel: string;
  customerId?: string | null;
  showScheduledReminder?: boolean;
}) {
  const [schedule, setSchedule] = useState<DocumentAutomationsState | null>(
    null,
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSchedule(loadOrInitDocumentAutomations(documentKind, customerId));
  }, [documentKind, customerId]);

  function applySchedule(next: DocumentAutomationsState) {
    persistDocumentAutomations(documentKind, next);
    setSchedule(next);
    setEditing(false);
  }

  const showUpcoming = Boolean(
    showScheduledReminder && schedule?.reminders,
  );

  const items: (DocumentActivityItem & {
    upcoming?: boolean;
    channelLabel?: string;
  })[] = showUpcoming && schedule
    ? [
        {
          id: "scheduled-reminder",
          time: formatScheduledReminderDate(
            Number(schedule.reminderDays) || 0,
            anchorLabel,
          ),
          text: "Scheduled reminder",
          channelLabel: sendByLabel(schedule.reminderChannel),
          upcoming: true,
        },
        ...pastItems,
      ]
    : pastItems;

  return (
    <>
      <div className="flex flex-col">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const connectorDashed = Boolean(item.upcoming);

          return (
            <div key={item.id} className="relative flex gap-5">
              <div className="relative flex w-2 shrink-0 flex-col items-center">
                <ActivityDot upcoming={item.upcoming} />
                {!isLast ? (
                  <span
                    className={`mt-1 w-0 flex-1 border-l ${
                      connectorDashed
                        ? "border-dashed border-midnight-ink"
                        : "border-solid border-midnight-ink"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>

              {item.upcoming ? (
                <div className="min-w-0 flex-1 pb-4">
                  <p className="type-subtitle-1 text-black">{item.time}</p>
                  <p className="mt-1 text-sm text-black">{item.text}</p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-1.5 flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md border border-black/12 bg-black/[0.04] px-2.5 py-1.5 text-left text-sm text-black/50 transition hover:border-black/20 hover:bg-black/[0.07] hover:text-black/70"
                    aria-label="Edit scheduled reminder"
                  >
                    <span className="min-w-0 truncate">
                      {item.channelLabel}
                    </span>
                    <PencilIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </button>
                </div>
              ) : (
                <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                  <p className="type-subtitle-1 text-black">{item.time}</p>
                  <p className="mt-1 text-sm text-[#666666]">{item.text}</p>
                </div>
              )}
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
        />
      ) : null}
    </>
  );
}
