"use client";

import { draftInvoice, formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  MessagePreview,
  SendMethodAccordion,
  type SendAccordionMethod,
} from "./SendMethodAccordion";

export type ReminderChannel = "email" | "text";

export type DocumentAutomationsState = {
  autoSend: boolean;
  reminders: boolean;
  reminderDays: string;
  reminderChannel: ReminderChannel | null;
};

const inputClass = UI_CLASS.input;

const SENDER_NAME = "Meganne";
const COMPANY_NAME = draftInvoice.business.name;
const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/invoice/3001",
};

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
      {checked && children ? (
        <div className="pl-6">{children}</div>
      ) : null}
    </div>
  );
}

/** Per-document automation overrides (cascaded from org / customer defaults). */
export function DocumentAutomationsSection({
  value,
  onChange,
  documentKind = "invoice",
}: {
  value: DocumentAutomationsState;
  onChange: (next: DocumentAutomationsState) => void;
  documentKind?: "invoice" | "quote";
}) {
  const isInvoice = documentKind === "invoice";
  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);
  const customerName = draftInvoice.customer.name;
  const documentLabel = isInvoice ? "invoice" : "quote";
  const documentNumber = isInvoice
    ? previewMeta.invoiceNumber
    : "QTE - 1001";
  const duePhrase = isInvoice
    ? `due ${previewMeta.dueDate.replace(/^Due /, "")}`
    : `expires ${previewMeta.dueDate.replace(/^Due /, "")}`;
  const amount = formatMoney(previewMeta.amount);

  function selectReminderChannel(method: SendAccordionMethod) {
    if (method !== "email" && method !== "text") return;
    onChange({ ...value, reminderChannel: method });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="type-body-muted">
        Starts from this customer&apos;s defaults. Change them only for this{" "}
        {documentKind}.
      </p>
      {isInvoice ? (
        <CheckboxRow
          checked={value.autoSend}
          onChange={(autoSend) => onChange({ ...value, autoSend })}
          label="Auto-send: Send this invoice automatically on its issuance date."
        />
      ) : null}
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
        <div className="flex flex-col gap-4">
          <div className="relative max-w-[220px]">
            <input
              inputMode="numeric"
              className={`${inputClass} pr-24`}
              value={value.reminderDays}
              onChange={(event) =>
                onChange({
                  ...value,
                  reminderDays: event.target.value.replace(/[^\d]/g, ""),
                })
              }
              aria-label="Reminder days before"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-black/45">
              days before
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-black">
              How should the reminder be sent?
            </p>
            <p className="mt-1 text-xs text-black/50">
              Choose one option and preview the message.
            </p>
            <div className="mt-3">
              <SendMethodAccordion
                selected={value.reminderChannel}
                onSelect={selectReminderChannel}
                sections={[
                  {
                    method: "email",
                    title: "Email",
                    summary: emailAvailable
                      ? `Send to ${DEMO_DESTINATIONS.email}`
                      : "No email on file — add one on the customer page",
                    available: emailAvailable,
                    children: (
                      <MessagePreview>
                        Hello {customerName}, this is a friendly reminder that{" "}
                        {documentLabel} {documentNumber} from {SENDER_NAME} at{" "}
                        {COMPANY_NAME} for {amount} is {duePhrase}. View it
                        here: {DEMO_DESTINATIONS.link}
                      </MessagePreview>
                    ),
                  },
                  {
                    method: "text",
                    title: "Text message",
                    summary: textAvailable
                      ? `Send to ${DEMO_DESTINATIONS.phone}`
                      : "No phone on file — add one on the customer page",
                    available: textAvailable,
                    children: (
                      <MessagePreview>
                        Reminder from {SENDER_NAME} at {COMPANY_NAME}:{" "}
                        {documentLabel} {documentNumber} ({amount}) is{" "}
                        {duePhrase}. Open: {DEMO_DESTINATIONS.link}
                      </MessagePreview>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </CheckboxRow>
    </div>
  );
}
