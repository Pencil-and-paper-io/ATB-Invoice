"use client";

import { useEffect, useRef, useState } from "react";
import {
  channelLabel,
  formatReminderSendDateLabel,
  isoFromAnchorLabel,
  isoFromScheduledReminderDate,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
  todayIsoDate,
  type DocumentKind,
} from "@/lib/document-automations";
import {
  appendInvoiceActivityExtra,
  appendQuoteActivityExtra,
  formatActivityNow,
} from "@/lib/document-activity";
import { draftInvoice } from "@/lib/invoice-demo-data";
import type {
  DocumentAutomationsState,
  ReminderChannel,
} from "./DocumentAutomationsSection";
import {
  InvoiceNotificationPreview,
  QuoteNotificationPreview,
} from "./NotificationMessagePreview";
import { ReminderDeliveryControls } from "./ReminderDeliveryControls";
import {
  MessagePreview,
  SendMethodAccordion,
  type SendAccordionMethod,
} from "./SendMethodAccordion";
import { Modal } from "./ui";

const fieldTriggerClass =
  "flex w-full max-w-sm items-center justify-between rounded border border-black/20 bg-input-grey px-2.5 py-2.5 text-left text-sm text-midnight-ink transition hover:border-prime-blue focus:border-prime-blue";

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function addDaysToIso(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(year, month - 1, day + days);
  return toIsoDate(next.getFullYear(), next.getMonth() + 1, next.getDate());
}

function isDateAllowed(
  iso: string,
  {
    allowSendNow,
    maxDate,
    todayIso,
  }: {
    allowSendNow: boolean;
    maxDate?: string | null;
    todayIso: string;
  },
) {
  if (maxDate && iso > maxDate) return false;
  if (!allowSendNow && iso <= todayIso) return false;
  return true;
}

function MonthCalendar({
  value,
  onSelect,
  onSelectNow,
  allowSendNow = true,
  maxDate,
}: {
  value: string;
  onSelect: (iso: string) => void;
  onSelectNow: () => void;
  allowSendNow?: boolean;
  /** Inclusive upper bound (YYYY-MM-DD), e.g. quote expiry. */
  maxDate?: string | null;
}) {
  const todayIso = todayIsoDate();
  const tomorrowIso = addDaysToIso(todayIso, 1);
  const oneWeekIso = addDaysToIso(todayIso, 7);
  const selected = parseIsoDate(value === "now" ? todayIso : value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selected?.year ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    selected?.month ?? today.getMonth() + 1,
  );

  useEffect(() => {
    const next = parseIsoDate(value === "now" ? todayIso : value);
    if (!next) return;
    setViewYear(next.year);
    setViewMonth(next.month);
  }, [value, todayIso]);

  const monthLabel = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth - 1, 1));

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  }

  const allowOpts = { allowSendNow, maxDate, todayIso };
  const nowDisabled = !allowSendNow || !isDateAllowed(todayIso, allowOpts);
  const tomorrowDisabled = !isDateAllowed(tomorrowIso, allowOpts);
  const oneWeekDisabled = !isDateAllowed(oneWeekIso, allowOpts);

  function presetClass(selected: boolean, disabled: boolean) {
    if (disabled) {
      return "cursor-not-allowed bg-black/[0.03] text-black/30";
    }
    if (selected) return "bg-prime-blue text-white";
    return "bg-black/[0.04] text-black hover:bg-black/[0.07]";
  }

  return (
    <div className="w-[280px]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded px-2 py-1 text-sm text-black/60 transition hover:bg-black/[0.04] hover:text-black"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-black">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded px-2 py-1 text-sm text-black/60 transition hover:bg-black/[0.04] hover:text-black"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-black/40">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="h-8" />;
          }
          const iso = toIsoDate(viewYear, viewMonth, day);
          const isSelected = value === iso || (value === "now" && iso === todayIso);
          const isToday = iso === todayIso;
          const disabled = !isDateAllowed(iso, allowOpts);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`h-8 rounded text-sm transition ${
                isSelected
                  ? "bg-prime-blue font-semibold text-white"
                  : disabled
                    ? "cursor-not-allowed text-black/25"
                    : isToday
                      ? "font-semibold text-prime-blue hover:bg-black/[0.06]"
                      : "text-black hover:bg-black/[0.06]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {allowSendNow ? (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-black/10 pt-3">
          <button
            type="button"
            disabled={tomorrowDisabled}
            onClick={() => onSelect(tomorrowIso)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition ${presetClass(
              value === tomorrowIso,
              tomorrowDisabled,
            )}`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            disabled={oneWeekDisabled}
            onClick={() => onSelect(oneWeekIso)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition ${presetClass(
              value === oneWeekIso,
              oneWeekDisabled,
            )}`}
          >
            In 1 week
          </button>
          <button
            type="button"
            disabled={nowDisabled}
            onClick={onSelectNow}
            className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition ${presetClass(
              value === "now" || value === todayIso,
              nowDisabled,
            )}`}
          >
            Now
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ReminderSendDateField({
  value,
  onChange,
  allowSendNow = true,
  maxDate,
}: {
  /** "now" or YYYY-MM-DD */
  value: string;
  onChange: (next: string) => void;
  allowSendNow?: boolean;
  maxDate?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const todayIso = todayIsoDate();
  const tomorrowIso = addDaysToIso(todayIso, 1);
  const oneWeekIso = addDaysToIso(todayIso, 7);
  const label =
    allowSendNow && (value === "now" || value === todayIso)
      ? "Now"
      : value === tomorrowIso
        ? "Tomorrow"
        : value === oneWeekIso
          ? "In 1 week"
          : formatReminderSendDateLabel(value, 0, value);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-black">
        <span>Send the reminder on</span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`${fieldTriggerClass} min-w-[11rem]`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span>{label}</span>
          <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
            <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white p-3 shadow-lg">
          <MonthCalendar
            value={value}
            allowSendNow={allowSendNow}
            maxDate={maxDate}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
            onSelectNow={() => {
              onChange("now");
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function initialSendDate(
  value: DocumentAutomationsState,
  anchorLabel: string,
  allowSendNow: boolean,
  maxDate?: string | null,
): string {
  if (allowSendNow && value.reminderSendDate === "now") return "now";
  if (
    value.reminderSendDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.reminderSendDate)
  ) {
    if (maxDate && value.reminderSendDate > maxDate) return maxDate;
    return value.reminderSendDate;
  }
  let derived =
    isoFromScheduledReminderDate(
      Number(value.reminderDays) || 3,
      anchorLabel,
    ) ?? todayIsoDate();
  // Preview cannot select today/now — bump to tomorrow if needed.
  if (!allowSendNow && derived <= todayIsoDate()) {
    const [y, m, d] = todayIsoDate().split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    derived = toIsoDate(next.getFullYear(), next.getMonth() + 1, next.getDate());
  }
  if (maxDate && derived > maxDate) return maxDate;
  return derived;
}

export function EditScheduledReminderModal({
  documentKind,
  value,
  anchorLabel,
  onClose,
  onSave,
  onRemove,
  allowSendNow = true,
}: {
  documentKind: DocumentKind;
  value: DocumentAutomationsState;
  anchorLabel: string;
  onClose: () => void;
  onSave: (next: DocumentAutomationsState) => void;
  onRemove: () => void;
  /**
   * Sent documents: calendar date + optional Now.
   * Preview (`false`): days-before due/expiry input.
   */
  allowSendNow?: boolean;
}) {
  const useRelativeDays = !allowSendNow;
  const maxDate =
    documentKind === "quote" ? isoFromAnchorLabel(anchorLabel) : null;
  const [sendDate, setSendDate] = useState(() =>
    initialSendDate(value, anchorLabel, allowSendNow, maxDate),
  );
  const [days, setDays] = useState(value.reminderDays || "3");
  const [channel, setChannel] = useState<ReminderChannel>(
    value.reminderChannel === "text" ? "text" : "email",
  );

  const todayIso = todayIsoDate();
  const isNow =
    allowSendNow && (sendDate === "now" || sendDate === todayIso);
  const emailAvailable = Boolean(draftInvoice.customer.email);
  const textAvailable = Boolean(draftInvoice.customer.phone);
  const messagePreview =
    documentKind === "quote" ? (
      <QuoteNotificationPreview />
    ) : (
      <InvoiceNotificationPreview />
    );

  function selectChannel(method: SendAccordionMethod) {
    if (method !== "email" && method !== "text") return;
    setChannel(method);
  }

  function handleConfirm() {
    if (useRelativeDays) {
      onSave({
        ...value,
        reminders: true,
        reminderChannel: channel,
        reminderDays: days.replace(/[^\d]/g, "") || "3",
        reminderSendDate: null,
      });
      return;
    }
    onSave({
      ...value,
      reminders: true,
      reminderChannel: channel,
      reminderSendDate: isNow ? "now" : sendDate,
      reminderDays: value.reminderDays || "3",
    });
  }

  return (
    <Modal
      title="Scheduled Reminder"
      titleId="edit-scheduled-reminder-title"
      onClose={onClose}
      cancelLabel="Remove scheduled reminder"
      onCancel={onRemove}
      confirmLabel={isNow ? "Send" : "Save"}
      onConfirm={handleConfirm}
      maxWidthClass="max-w-3xl"
      zClass="z-[220]"
    >
      {useRelativeDays ? (
        <ReminderDeliveryControls
          reminderDays={days}
          reminderChannel={channel}
          onDaysChange={setDays}
          onChannelChange={setChannel}
          previewKind={documentKind}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <ReminderSendDateField
            value={sendDate}
            onChange={setSendDate}
            allowSendNow={allowSendNow}
            maxDate={maxDate}
          />
          <SendMethodAccordion
            selected={channel}
            onSelect={selectChannel}
            sections={[
              {
                method: "email",
                title: "Email",
                summary: emailAvailable
                  ? `Send to ${draftInvoice.customer.email}`
                  : "No email on file — add one on the customer page",
                available: emailAvailable,
                children: <MessagePreview>{messagePreview}</MessagePreview>,
              },
              {
                method: "text",
                title: "Text message",
                summary: textAvailable
                  ? `Send to ${draftInvoice.customer.phone}`
                  : "No phone on file — add one on the customer page",
                available: textAvailable,
                children: <MessagePreview>{messagePreview}</MessagePreview>,
              },
            ]}
          />
        </div>
      )}
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
    if (next.reminderSendDate === "now") {
      persistDocumentAutomations(documentKind, {
        ...next,
        reminders: false,
        reminderSendDate: null,
        reminderChannel: null,
      });
      setSchedule({
        ...next,
        reminders: false,
        reminderSendDate: null,
        reminderChannel: null,
      });
      setEditing(false);
      logActivity(
        `${channelLabel(next.reminderChannel)} reminder sent`,
      );
      return;
    }

    persistDocumentAutomations(documentKind, next);
    setSchedule(next);
    setEditing(false);

    if (!prev.reminders && next.reminders) {
      const when = formatReminderSendDateLabel(
        next.reminderSendDate,
        Number(next.reminderDays) || 0,
        anchorLabel,
      );
      logActivity(
        `Scheduled ${channelLabel(next.reminderChannel).toLowerCase()} reminder for ${when}`,
      );
      return;
    }
    if (prev.reminders && next.reminders) {
      const when = formatReminderSendDateLabel(
        next.reminderSendDate,
        Number(next.reminderDays) || 0,
        anchorLabel,
      );
      logActivity(
        `Updated scheduled reminder — ${channelLabel(next.reminderChannel)} on ${when}`,
      );
    }
  }

  function removeSchedule() {
    const next = {
      ...schedule,
      reminders: false,
      reminderChannel: null,
      reminderSendDate: null,
    };
    persistDocumentAutomations(documentKind, next);
    setSchedule(next);
    setEditing(false);
    if (schedule.reminders) logActivity("Scheduled reminder cancelled");
  }

  const daysNum = Number(schedule.reminderDays) || 0;
  const whenLabel = formatReminderSendDateLabel(
    schedule.reminderSendDate,
    daysNum,
    anchorLabel,
  );

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
              onClick={removeSchedule}
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
          onRemove={removeSchedule}
        />
      ) : null}
    </>
  );
}
