"use client";

import { useState } from "react";
import { channelLabel } from "@/lib/document-automations";
import {
  ReminderDeliveryControls,
  type ReminderPreviewKind,
} from "./ReminderDeliveryControls";
import { Modal, PencilIcon, SectionCard } from "./ui";

export type ReminderChannel = "email" | "text";

export type DocumentAutomationsState = {
  autoSend: boolean;
  /** Quote-only: send invoice automatically when the quote is accepted. */
  autoSendInvoice: boolean;
  reminders: boolean;
  reminderDays: string;
  reminderChannel: ReminderChannel | null;
  /** Absolute send date (YYYY-MM-DD) for preview/sent scheduling; null = derive from days. */
  reminderSendDate: string | null;
};

function DefaultCheckIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path
        d="M1 5.2 4.8 8.8 13 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-2.5 text-sm text-black">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-prime-blue"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </label>
      {checked && children ? <div className="pl-6">{children}</div> : null}
    </div>
  );
}

export function DocumentAutomationsEditor({
  value,
  onChange,
  documentKind,
}: {
  value: DocumentAutomationsState;
  onChange: (next: DocumentAutomationsState) => void;
  documentKind: "invoice" | "quote";
}) {
  const isInvoice = documentKind === "invoice";
  const previewKind: ReminderPreviewKind = isInvoice ? "invoice" : "quote";

  return (
    <div className="flex flex-col gap-3">
      {isInvoice ? (
        <CheckboxRow
          checked={value.autoSend}
          onChange={(autoSend) => onChange({ ...value, autoSend })}
          label="Auto-send: Send this invoice automatically on its issuance date."
        />
      ) : (
        <CheckboxRow
          checked={value.autoSendInvoice}
          onChange={(autoSendInvoice) =>
            onChange({ ...value, autoSendInvoice })
          }
          label="Auto-Send Invoice: When the quote is accepted, automatically send an invoice"
        />
      )}
      <CheckboxRow
        checked={value.reminders}
        onChange={(reminders) =>
          onChange({
            ...value,
            reminders,
            reminderChannel: reminders
              ? value.reminderChannel ?? "email"
              : null,
          })
        }
        label={
          isInvoice
            ? "Reminders: Send a reminder before this invoice is due."
            : "Reminders: Send a reminder before this quote expires."
        }
      >
        <ReminderDeliveryControls
          reminderDays={value.reminderDays}
          reminderChannel={value.reminderChannel}
          onDaysChange={(reminderDays) => onChange({ ...value, reminderDays })}
          onChannelChange={(reminderChannel) =>
            onChange({ ...value, reminderChannel })
          }
          previewKind={previewKind}
        />
      </CheckboxRow>
    </div>
  );
}

/** Per-document automation overrides — summary + edit modal (same pattern as payments). */
export function DocumentAutomationsSection({
  value,
  onChange,
  documentKind = "invoice",
  embedded = false,
}: {
  value: DocumentAutomationsState;
  onChange: (next: DocumentAutomationsState) => void;
  documentKind?: "invoice" | "quote";
  embedded?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const isInvoice = documentKind === "invoice";

  const summaryItems: { id: string; label: string }[] = [];
  if (isInvoice && value.autoSend) {
    summaryItems.push({
      id: "auto-send",
      label: "Auto-send on issuance date",
    });
  }
  if (!isInvoice && value.autoSendInvoice) {
    summaryItems.push({
      id: "auto-send-invoice",
      label: "Auto-send invoice when accepted",
    });
  }
  if (value.reminders) {
    const days = value.reminderDays.trim() || "3";
    const channel = channelLabel(value.reminderChannel);
    summaryItems.push({
      id: "reminders",
      label: `Reminders · ${days} days before · ${channel}`,
    });
  }

  function openEdit() {
    setDraft(value);
    setEditOpen(true);
  }

  function saveEdit() {
    onChange(draft);
    setEditOpen(false);
  }

  const body = (
    <>
      <div className="flex flex-col">
        {summaryItems.length === 0 ? (
          <p className="type-body-muted py-1">No automations enabled.</p>
        ) : (
          summaryItems.map((item) => (
            <div key={item.id} className="flex items-start gap-2 py-2.5">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-prime-blue"
                aria-hidden
              >
                <DefaultCheckIcon />
              </span>
              <p className="min-w-0 flex-1 type-subtitle-1 text-black">
                {item.label}
              </p>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={openEdit}
          className="mt-1 inline-flex items-center gap-2.5 self-start type-button text-midnight-ink transition hover:text-prime-blue"
        >
          <PencilIcon className="h-4 w-4" />
          Edit automations
        </button>
      </div>

      {editOpen ? (
        <Modal
          title="Edit Automations"
          titleId="edit-document-automations-title"
          onClose={() => setEditOpen(false)}
          confirmLabel="Save"
          onConfirm={saveEdit}
          maxWidthClass="max-w-3xl"
          zClass="z-[220]"
        >
          <DocumentAutomationsEditor
            value={draft}
            onChange={setDraft}
            documentKind={documentKind}
          />
        </Modal>
      ) : null}
    </>
  );

  if (embedded) return body;

  return (
    <SectionCard title="Automations" className="gap-2.5">
      {body}
    </SectionCard>
  );
}
