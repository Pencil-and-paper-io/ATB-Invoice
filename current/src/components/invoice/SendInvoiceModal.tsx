"use client";

import { useRouter } from "next/navigation";
import { draftInvoice, previewMeta } from "@/lib/invoice-demo-data";
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
  link: "https://pay.atb.com/invoice/3001",
};

export function SendInvoiceModal({
  onClose,
  onSent,
  mode = "send",
  navigateOnSend = true,
}: {
  onClose: () => void;
  onSent?: (method: "email" | "text" | "link") => void;
  mode?: "send" | "resend" | "test";
  navigateOnSend?: boolean;
}) {
  const router = useRouter();
  const { selected, copied, sending, setCopied, setSending, selectMethod } =
    useSendMethodSelection();
  const contactName = draftInvoice.customer.name;
  const dueDate = previewMeta.dueDate.replace(/^Due /, "");

  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);
  const title =
    mode === "resend"
      ? "Re-send invoice"
      : mode === "test"
        ? "Send test invoice"
        : "Send invoice";
  const includeLink = mode === "send";

  async function handleConfirm() {
    if (!selected || sending) return;
    if (!includeLink && selected === "link") return;
    setSending(true);

    if (selected === "link") {
      try {
        await navigator.clipboard.writeText(DEMO_DESTINATIONS.link);
        setCopied(true);
      } catch {
        // Demo: still proceed even if clipboard is blocked.
      }
      window.setTimeout(() => {
        onSent?.(selected);
        if (navigateOnSend) router.push("/sent");
        else onClose();
      }, 600);
      return;
    }

    window.setTimeout(() => {
      onSent?.(selected);
      if (navigateOnSend) router.push("/sent");
      else onClose();
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
      title={title}
      titleId="send-invoice-title"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      zClass="z-[80]"
      confirmLabel={confirmLabel}
      onConfirm={() => void handleConfirm()}
      confirmDisabled={!selected || sending || (!includeLink && selected === "link")}
      confirmChildren={
        <>
          {selected ? <SendButtonIcon method={selected} /> : null}
          {confirmLabel}
        </>
      }
    >
      {mode === "send" ? (
        <div
          className="rounded-lg border border-[#E8A317]/40 bg-[#FFF8E6] px-4 py-3.5 text-sm leading-5 text-black/80"
          role="status"
        >
          Once you send this invoice, you will no longer be able to edit it.
          You can still void it or mark it uncollectible later if needed.
        </div>
      ) : (
        <p className="text-sm leading-5 text-black/65">
          {mode === "test"
            ? "Send a test copy to yourself or the customer to verify delivery."
            : `Re-send invoice ${previewMeta.invoiceNumber} to ${contactName}.`}
        </p>
      )}

      <div className={mode === "send" ? "mt-6" : "mt-5"}>
        <p className="text-sm font-semibold text-black">
          How do you want to send it?
        </p>
        <p className="mt-1 text-xs text-black/50">
          Choose one option below.
        </p>
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
                      customerName={contactName}
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
                  ? `Send to ${DEMO_DESTINATIONS.phone}`
                  : "No phone on file — add one on the customer page",
                available: textAvailable,
                children: (
                  <MessagePreview>
                    <InvoiceNotificationPreview
                      customerName={contactName}
                      companyName={COMPANY_NAME}
                      dueDate={dueDate}
                    />
                  </MessagePreview>
                ),
              },
              ...(includeLink
                ? [
                    {
                      method: "link" as const,
                      title: "URL link",
                      summary: "Copy a shareable link",
                      available: true,
                      children: (
                        <div className="flex flex-col gap-3">
                          <p className="text-sm leading-6 text-black/70">
                            Copy this link and send it in your own custom email
                            or through your own other means. We will not send
                            anything on your behalf.
                          </p>
                          <p className="break-all rounded-lg border border-black/10 bg-black/[0.02] px-3.5 py-2.5 text-sm text-black/80">
                            {DEMO_DESTINATIONS.link}
                          </p>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
