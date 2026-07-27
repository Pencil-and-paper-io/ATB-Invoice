"use client";

import { draftInvoice, formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import {
  MessagePreview,
  SendButtonIcon,
  SendMethodAccordion,
  useSendMethodSelection,
} from "./SendMethodAccordion";
import { Modal } from "./ui";

const SENDER_NAME = "Meganne";
const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/invoice/3001",
};

export function SendReminderModal({
  onClose,
  onSent,
  amountDue,
  invoiceNumber = previewMeta.invoiceNumber,
  dueDate = previewMeta.dueDate.replace(/^Due /, ""),
  customerName = draftInvoice.customer.name,
}: {
  onClose: () => void;
  onSent?: (method: "email" | "text") => void;
  amountDue?: number;
  invoiceNumber?: string;
  dueDate?: string;
  customerName?: string;
}) {
  const { selected, sending, setSending, selectMethod } =
    useSendMethodSelection();
  const balance = amountDue ?? previewMeta.amount;

  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);

  function handleConfirm() {
    if (!selected || selected === "link" || sending) return;
    setSending(true);
    window.setTimeout(() => {
      onSent?.(selected);
      onClose();
    }, 250);
  }

  const confirmLabel =
    selected === "email"
      ? "Send via email"
      : selected === "text"
        ? "Send via text"
        : "Send reminder";

  return (
    <Modal
      title="Send reminder"
      titleId="send-reminder-title"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      zClass="z-[80]"
      confirmLabel={confirmLabel}
      onConfirm={handleConfirm}
      confirmDisabled={!selected || selected === "link" || sending}
      confirmChildren={
        <>
          {selected && selected !== "link" ? (
            <SendButtonIcon method={selected} />
          ) : null}
          {sending ? "Sending…" : confirmLabel}
        </>
      }
    >
      <p className="text-sm leading-5 text-black/65">
        Remind {customerName} about the outstanding balance on{" "}
        {invoiceNumber} ({formatMoney(balance)}), due {dueDate}.
      </p>

      <div className="mt-6">
        <p className="text-sm font-semibold text-black">
          How do you want to send it?
        </p>
        <p className="mt-1 text-xs text-black/50">Choose one option below.</p>
        <div className="mt-4">
          <SendMethodAccordion
            selected={selected}
            onSelect={selectMethod}
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
                    Hello {customerName}, this is a friendly reminder that
                    invoice {invoiceNumber} from {SENDER_NAME} at {COMPANY_NAME}{" "}
                    for {formatMoney(balance)} was due {dueDate}. Click this
                    link to view and pay your invoice: {DEMO_DESTINATIONS.link}
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
                    Reminder from {SENDER_NAME} at {COMPANY_NAME}: invoice{" "}
                    {invoiceNumber} ({formatMoney(balance)}) was due {dueDate}.
                    Pay here: {DEMO_DESTINATIONS.link}
                  </MessagePreview>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
