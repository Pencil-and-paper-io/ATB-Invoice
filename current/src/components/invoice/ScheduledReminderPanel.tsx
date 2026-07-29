"use client";

import { useEffect, useState } from "react";
import {
  channelLabel,
  formatScheduledReminderDate,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
  type DocumentKind,
} from "@/lib/document-automations";
import {
  appendInvoiceActivityExtra,
  appendQuoteActivityExtra,
  formatActivityNow,
} from "@/lib/document-activity";
import type {
  DocumentAutomationsState,
  ReminderChannel,
} from "./DocumentAutomationsSection";
import { ReminderDeliveryControls } from "./ReminderDeliveryControls";
import { Modal } from "./ui";

export function EditScheduledReminderModal({
  documentKind,
  value,
  onClose,
  onSave,
}: {
  documentKind: DocumentKind;
  value: DocumentAutomationsState;
  /** Kept for call-site compatibility (schedule date still uses this outside the modal). */
  anchorLabel: string;
  onClose: () => void;
  onSave: (next: DocumentAutomationsState) => void;
}) {
  const [days, setDays] = useState(value.reminderDays || "3");
  const [channel, setChannel] = useState<ReminderChannel>(
    value.reminderChannel === "text" ? "text" : "email",
  );

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
      titleId="edit-scheduled-reminder-title"
      onClose={onClose}
      confirmLabel="Save"
      onConfirm={handleSave}
      maxWidthClass="max-w-3xl"
      zClass="z-[220]"
      subtitle="Select when and how the reminder is sent"
    >
      <ReminderDeliveryControls
        reminderDays={days}
        reminderChannel={channel}
        onDaysChange={setDays}
        onChannelChange={setChannel}
        previewKind={documentKind}
      />
    </Modal>
  );
}

export function ScheduledReminderPanel({
  documentKind,
  anchorLabel,
  customerId,
  onActivityChange,
}: {
  documentKind: DocumentKind;
  /** Due date or expiry label used to compute the send date. */
  anchorLabel: string;
  customerId?: string | null;
  onActivityChange?: () => void;
}) {
  const [schedule, setSchedule] = useState<DocumentAutomationsState>(() =>
    loadOrInitDocumentAutomations(documentKind, customerId),
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
    onActivityChange?.();
  }

  function applySchedule(next: DocumentAutomationsState) {
    const prev = schedule;
    persistDocumentAutomations(documentKind, next);
    setSchedule(next);
    setEditing(false);

    if (!prev.reminders && next.reminders) {
      const when = formatScheduledReminderDate(
        Number(next.reminderDays) || 0,
        anchorLabel,
      );
      logActivity(
        `Scheduled ${channelLabel(next.reminderChannel).toLowerCase()} reminder for ${when}`,
      );
      return;
    }
    if (prev.reminders && !next.reminders) {
      logActivity("Scheduled reminder cancelled");
      return;
    }
    if (prev.reminders && next.reminders) {
      const when = formatScheduledReminderDate(
        Number(next.reminderDays) || 0,
        anchorLabel,
      );
      logActivity(
        `Updated scheduled reminder — ${channelLabel(next.reminderChannel)} on ${when}`,
      );
    }
  }

  function cancelSchedule() {
    applySchedule({
      ...schedule,
      reminders: false,
      reminderChannel: null,
    });
  }

  const daysNum = Number(schedule.reminderDays) || 0;
  const whenLabel = formatScheduledReminderDate(daysNum, anchorLabel);

  return (
    <>
      <section className="flex flex-col gap-3 rounded-[10px] bg-white p-[30px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-black">
            Scheduled reminder
          </h2>
          {schedule.reminders ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-prime-blue hover:underline"
            >
              Edit
            </button>
          ) : null}
        </div>

        {schedule.reminders ? (
          <>
            <p className="text-sm text-[#666666]">
              {channelLabel(schedule.reminderChannel)} reminder sends on{" "}
              <span className="font-semibold text-black">{whenLabel}</span>
              {" "}
              ({daysNum === 1 ? "1 day" : `${daysNum} days`} before{" "}
              {documentKind === "invoice" ? "due" : "expiry"}).
            </p>
            <button
              type="button"
              onClick={cancelSchedule}
              className="self-start text-sm font-semibold text-status-danger hover:underline"
            >
              Cancel reminder
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#666666]">No reminder scheduled.</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="self-start text-sm font-semibold text-prime-blue hover:underline"
            >
              Schedule reminder
            </button>
          </>
        )}
      </section>

      {editing ? (
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
