"use client";

import { draftInvoice, formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import {
  MessagePreview,
  SendButtonIcon,
  SendMethodAccordion,
  useSendMethodSelection,
} from "./SendMethodAccordion";
import { InvoiceNotificationPreview } from "./NotificationMessagePreview";
import { Modal } from "./ui";

const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
};

export function SendReminderModal({
  onClose,
  onSent,
  amountDue,
  invoiceNumber = previewMeta.invoiceNumber,
  dueDate = previewMeta.dueDate.replace(/^Due /, ""),
  customerName = draftInvoice.customer.name,
  bulkCount,
}: {
  onClose: () => void;
  onSent?: (method: "email" | "text") => void;
  amountDue?: number;
  invoiceNumber?: string;
  dueDate?: string;
  customerName?: string;
  /** When > 1, copy clarifies this is a preview for one of N selected invoices. */
  bulkCount?: number;
}) {
  const { selected, sending, setSending, selectMethod } =
    useSendMethodSelection();
  const balance = amountDue ?? previewMeta.amount;
  const isBulk = typeof bulkCount === "number" && bulkCount > 1;

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
      ? isBulk
        ? `Send ${bulkCount} via email`
        : "Send via email"
      : selected === "text"
        ? isBulk
          ? `Send ${bulkCount} via text`
          : "Send via text"
        : isBulk
          ? `Send ${bulkCount} reminders`
          : "Send reminder";

  return (
    <Modal
      title={isBulk ? "Send Reminders" : "Send reminder"}
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
      {isBulk ? (
        <p className="text-sm leading-5 text-black/65">
          Preview uses one of the {bulkCount} selected invoices (
          {invoiceNumber} for {customerName}, {formatMoney(balance)} due{" "}
          {dueDate}). Sending will remind all {bulkCount} selected customers.
        </p>
      ) : (
        <p className="text-sm leading-5 text-black/65">
          Remind {customerName} about the outstanding balance on{" "}
          {invoiceNumber} ({formatMoney(balance)}), due {dueDate}.
        </p>
      )}

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
                    <InvoiceNotificationPreview
                      customerName={customerName}
                      companyName={COMPANY_NAME}
                      invoiceNumber={invoiceNumber}
                      amount={balance}
                      dueDate={dueDate}
                    />
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
                    <InvoiceNotificationPreview
                      customerName={customerName}
                      companyName={COMPANY_NAME}
                      invoiceNumber={invoiceNumber}
                      amount={balance}
                      dueDate={dueDate}
                    />
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
