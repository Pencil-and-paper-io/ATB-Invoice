"use client";

import { useEffect, useState } from "react";
import { previewMeta } from "@/lib/invoice-demo-data";
import {
  channelLabel,
  formatScheduledReminderDate,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
} from "@/lib/document-automations";
import type {
  DocumentAutomationsState,
  ReminderChannel,
} from "./DocumentAutomationsSection";
import { ReminderDeliveryControls } from "./ReminderDeliveryControls";
import { Modal, PencilIcon } from "./ui";

type TimelineItem = {
  id: string;
  time: string;
  text: string;
  upcoming?: boolean;
};

const CREATED_ACTIVITY: TimelineItem = {
  id: "preview-created",
  time: "July 3, 7:01pm",
  text: "Invoice was created for $353.00",
};

function EditModal({
  value,
  anchorLabel,
  onClose,
  onSave,
}: {
  value: DocumentAutomationsState;
  anchorLabel: string;
  onClose: () => void;
  onSave: (next: DocumentAutomationsState) => void;
}) {
  const [days, setDays] = useState(value.reminderDays || "3");
  const [channel, setChannel] = useState<ReminderChannel>(
    value.reminderChannel === "text" ? "text" : "email",
  );

  const daysNum = Number(days) || 0;
  const scheduledLabel = formatScheduledReminderDate(daysNum, anchorLabel);

  function handleSave() {
    onSave({
      ...value,
      reminders: true,
      reminderDays: days.replace(/[^\d]/g, "") || "3",
      reminderChannel: channel,
    });
  }

  return (
    <Modal
      title="Scheduled Reminder"
      titleId="edit-preview-reminder-title"
      onClose={onClose}
      confirmLabel="Save"
      onConfirm={handleSave}
      maxWidthClass="max-w-2xl"
    >
      <div className="flex flex-col gap-4 text-sm">
        <ReminderDeliveryControls
          reminderDays={days}
          reminderChannel={channel}
          onDaysChange={setDays}
          onChannelChange={setChannel}
          previewKind="invoice"
        />
        <p className="rounded-lg border border-black/10 bg-page-grey/60 px-3 py-2 text-black/70">
          Scheduled for{" "}
          <span className="font-semibold">{scheduledLabel}</span>
          {" · "}
          {channelLabel(channel)}
        </p>
      </div>
    </Modal>
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

/** Past events (solid) + optional future scheduled reminder (dotted connector, clickable). */
export function PreviewInvoiceActivity() {
  const [schedule, setSchedule] = useState<DocumentAutomationsState | null>(
    null,
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSchedule(loadOrInitDocumentAutomations("invoice"));
  }, []);

  const dueAnchor = previewMeta.dueDate.replace(/^Due\s+/i, "");

  function applySchedule(next: DocumentAutomationsState) {
    persistDocumentAutomations("invoice", next);
    setSchedule(next);
    setEditing(false);
  }

  const upcoming: TimelineItem | null = schedule?.reminders
    ? {
        id: "preview-reminder",
        time: formatScheduledReminderDate(
          Number(schedule.reminderDays) || 0,
          dueAnchor,
        ),
        text: `${channelLabel(schedule.reminderChannel)} reminder`,
        upcoming: true,
      }
    : null;

  const items = upcoming ? [upcoming, CREATED_ACTIVITY] : [CREATED_ACTIVITY];

  return (
    <>
      <div className="flex flex-col">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const connectorDashed = Boolean(item.upcoming);
          const isClickable = item.upcoming;

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

              {isClickable ? (
                <div className="min-w-0 flex-1 pb-4">
                  <p className="text-sm text-black/55">{item.time}</p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-1 flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md border border-black/12 bg-black/[0.04] px-2.5 py-1.5 text-left text-sm text-black/50 transition hover:border-black/20 hover:bg-black/[0.07] hover:text-black/70"
                    aria-label="Edit scheduled reminder"
                  >
                    <span className="min-w-0 truncate">{item.text}</span>
                    <PencilIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </button>
                </div>
              ) : (
                <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                  <p className="text-sm text-black">{item.time}</p>
                  <p className="mt-1 text-sm text-[#666666]">{item.text}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && schedule ? (
        <EditModal
          value={schedule}
          anchorLabel={dueAnchor}
          onClose={() => setEditing(false)}
          onSave={applySchedule}
        />
      ) : null}
    </>
  );
}
