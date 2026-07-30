"use client";

import { draftInvoice, previewMeta } from "@/lib/invoice-demo-data";
import {
  MessagePreview,
  SendButtonIcon,
  SendMethodAccordion,
  useSendMethodSelection,
} from "./SendMethodAccordion";
import { InvoiceNotificationPreview } from "./NotificationMessagePreview";
import { ShareableLinkHelp } from "./ShareableLinkHelp";
import { Modal } from "./ui";

const COMPANY_NAME = draftInvoice.business.name;

/**
 * After contact info change + revoke: re-send active docs to updated contact
 * via email, text, or shareable URL.
 */
export function ResendAfterRevokeModal({
  onClose,
  onSent,
  documentCount,
  customerName,
  email,
  phone,
}: {
  onClose: () => void;
  onSent?: (method: "email" | "text" | "link") => void;
  documentCount: number;
  customerName: string;
  email: string;
  phone: string;
}) {
  const { selected, copied, sending, setCopied, setSending, selectMethod } =
    useSendMethodSelection();
  const dueDate = previewMeta.dueDate.replace(/^Due /, "");
  const destinations = {
    email: email.trim(),
    phone: phone.trim(),
    link: "https://pay.atb.com/invoice/3001",
  };
  const emailAvailable = Boolean(destinations.email);
  const textAvailable = Boolean(destinations.phone);

  async function handleConfirm() {
    if (!selected || sending) return;
    setSending(true);

    if (selected === "link") {
      try {
        await navigator.clipboard.writeText(destinations.link);
        setCopied(true);
      } catch {
        // Demo: still proceed even if clipboard is blocked.
      }
      window.setTimeout(() => {
        onSent?.(selected);
        onClose();
      }, 600);
      return;
    }

    window.setTimeout(() => {
      onSent?.(selected);
      onClose();
    }, 200);
  }

  const confirmLabel = (() => {
    if (copied) return "Copied!";
    if (selected === "email") return "Send via email";
    if (selected === "text") return "Send via text";
    if (selected === "link") return "Copy link";
    return "Send";
  })();

  return (
    <Modal
      title="Re-Send"
      titleId="resend-after-revoke-title"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      zClass="z-[230]"
      confirmLabel={confirmLabel}
      onConfirm={() => void handleConfirm()}
      confirmDisabled={!selected || sending}
      confirmChildren={
        <>
          {selected ? <SendButtonIcon method={selected} /> : null}
          {confirmLabel}
        </>
      }
    >
      <p className="type-paragraph-1 text-black/65">
        You&apos;ve successfully revoked previous access to {documentCount}{" "}
        active quotes/invoices. Send them to your updated contact:
      </p>

      <div className="mt-5">
        <SendMethodAccordion
          selected={selected}
          onSelect={selectMethod}
          sections={[
            {
              method: "email",
              title: "Email",
              summary: emailAvailable
                ? `Send to ${destinations.email}`
                : "No email on file — add one on the customer page",
              available: emailAvailable,
              children: (
                <MessagePreview>
                  <InvoiceNotificationPreview
                    customerName={customerName}
                    companyName={COMPANY_NAME}
                    dueDate={dueDate}
                  />
                </MessagePreview>
              ),
            },
            {
              method: "text",
              title: "Text message",
              summary: textAvailable
                ? `Send to ${destinations.phone}`
                : "No phone on file — add one on the customer page",
              available: textAvailable,
              children: (
                <MessagePreview>
                  <InvoiceNotificationPreview
                    customerName={customerName}
                    companyName={COMPANY_NAME}
                    dueDate={dueDate}
                  />
                </MessagePreview>
              ),
            },
            {
              method: "link",
              title: "URL link",
              summary: "Copy a shareable link",
              available: true,
              children: <ShareableLinkHelp mode="send" />,
            },
          ]}
        />
      </div>
    </Modal>
  );
}
