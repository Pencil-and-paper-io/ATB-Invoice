"use client";

import { useRouter } from "next/navigation";
import { draftInvoice } from "@/lib/invoice-demo-data";
import { formatQuoteDate, loadQuoteDetails } from "@/lib/quote-details";
import {
  MessagePreview,
  SendButtonIcon,
  SendMethodAccordion,
  useSendMethodSelection,
} from "./SendMethodAccordion";
import { QuoteNotificationPreview } from "./NotificationMessagePreview";
import { ShareableLinkHelp } from "./ShareableLinkHelp";
import { Modal } from "./ui";

const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/quote/0003",
};

export function SendQuoteModal({
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
  const validUntil =
    formatQuoteDate(loadQuoteDetails()?.validUntil ?? "") || "the valid until date";

  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);
  const title =
    mode === "resend"
      ? "Re-Send Quote"
      : mode === "test"
        ? "Send Test Quote"
        : "Send Quote";
  const includeLink = mode !== "test";

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
        if (navigateOnSend) router.push("/quote/sent");
        else onClose();
      }, 600);
      return;
    }

    window.setTimeout(() => {
      onSent?.(selected);
      if (navigateOnSend) router.push("/quote/sent");
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
      titleId="send-quote-title"
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
          Once you send this quote, the customer can accept or reject it.
          Accepting creates a draft invoice you can continue editing.
        </div>
      ) : (
        <p className="text-sm leading-5 text-black/65">
          {mode === "test"
            ? "Send a test copy to verify delivery before sharing with the customer."
            : `Re-send this quote to ${contactName}.`}
        </p>
      )}

      <div className={mode === "send" ? "mt-6" : "mt-5"}>
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
                  <QuoteNotificationPreview
                    customerName={contactName}
                    companyName={COMPANY_NAME}
                    validUntil={validUntil}
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
                  <QuoteNotificationPreview
                    customerName={contactName}
                    companyName={COMPANY_NAME}
                    validUntil={validUntil}
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
                      <ShareableLinkHelp
                        mode={mode === "resend" ? "resend" : "send"}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>
    </Modal>
  );
}
