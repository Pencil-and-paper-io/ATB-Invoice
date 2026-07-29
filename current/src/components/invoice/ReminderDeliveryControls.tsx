"use client";

import { draftInvoice } from "@/lib/invoice-demo-data";
import { UI_CLASS } from "@/lib/design-tokens";
import type { ReminderChannel } from "./DocumentAutomationsSection";
import {
  InvoiceNotificationPreview,
  QuoteNotificationPreview,
} from "./NotificationMessagePreview";
import {
  MessagePreview,
  SendMethodAccordion,
  type SendAccordionMethod,
} from "./SendMethodAccordion";

const inputClass = UI_CLASS.input;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
};

export type ReminderPreviewKind = "invoice" | "quote" | "either";

/** Days-before input + email/text accordion with message preview. */
export function ReminderDeliveryControls({
  reminderDays,
  reminderChannel,
  onDaysChange,
  onChannelChange,
  previewKind = "invoice",
  daysSuffix = "days before",
  daysAriaLabel = "Reminder days before",
}: {
  reminderDays: string;
  reminderChannel: ReminderChannel | null;
  onDaysChange: (days: string) => void;
  onChannelChange: (channel: ReminderChannel) => void;
  previewKind?: ReminderPreviewKind;
  daysSuffix?: string;
  daysAriaLabel?: string;
}) {
  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);
  const messagePreview =
    previewKind === "quote" ? (
      <QuoteNotificationPreview />
    ) : (
      <InvoiceNotificationPreview />
    );

  function selectChannel(method: SendAccordionMethod) {
    if (method !== "email" && method !== "text") return;
    onChannelChange(method);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-[260px]">
        <input
          inputMode="numeric"
          className={`${inputClass} pr-28`}
          value={reminderDays}
          onChange={(event) =>
            onDaysChange(event.target.value.replace(/[^\d]/g, ""))
          }
          aria-label={daysAriaLabel}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-black/45">
          {daysSuffix}
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
            selected={reminderChannel}
            onSelect={selectChannel}
            sections={[
              {
                method: "email",
                title: "Email",
                summary: emailAvailable
                  ? `Send to ${DEMO_DESTINATIONS.email}`
                  : "No email on file — add one on the customer page",
                available: emailAvailable,
                children: <MessagePreview>{messagePreview}</MessagePreview>,
              },
              {
                method: "text",
                title: "Text message",
                summary: textAvailable
                  ? `Send to ${DEMO_DESTINATIONS.phone}`
                  : "No phone on file — add one on the customer page",
                available: textAvailable,
                children: <MessagePreview>{messagePreview}</MessagePreview>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
