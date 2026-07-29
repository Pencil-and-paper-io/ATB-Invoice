"use client";

import { draftInvoice } from "@/lib/invoice-demo-data";
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

/** Compact days field — avoids `.ui-input { width: 100% }`. */
const daysInputClass =
  "w-[4ch] shrink-0 rounded border border-black/20 bg-input-grey px-1 py-2.5 text-center text-sm text-midnight-ink outline-none transition hover:border-prime-blue focus:border-prime-blue";

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
};

export type ReminderPreviewKind = "invoice" | "quote" | "either";

function daysBeforePhrase(previewKind: ReminderPreviewKind) {
  if (previewKind === "quote") return "quote expires";
  if (previewKind === "either") return "due date or expiry";
  return "invoice is due";
}

/** Days-before input + email/text accordion with message preview. */
export function ReminderDeliveryControls({
  reminderDays,
  reminderChannel,
  onDaysChange,
  onChannelChange,
  previewKind = "invoice",
  daysAriaLabel = "Reminder days before",
}: {
  reminderDays: string;
  reminderChannel: ReminderChannel | null;
  onDaysChange: (days: string) => void;
  onChannelChange: (channel: ReminderChannel) => void;
  previewKind?: ReminderPreviewKind;
  /** @deprecated Unused — kept for call-site compatibility. */
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
      <div className="flex flex-nowrap items-center gap-x-2 whitespace-nowrap text-sm text-black">
        <span>Send the reminder</span>
        <input
          inputMode="numeric"
          maxLength={4}
          size={4}
          className={daysInputClass}
          value={reminderDays}
          onChange={(event) =>
            onDaysChange(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
          }
          aria-label={daysAriaLabel}
        />
        <span>days before the {daysBeforePhrase(previewKind)} by:</span>
      </div>

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
  );
}
