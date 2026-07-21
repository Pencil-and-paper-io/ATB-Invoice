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
import { Modal } from "./ui";

const SENDER_NAME = "Meganne";
const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/quote/0003",
};

export function SendQuoteModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { selected, copied, sending, setCopied, setSending, selectMethod } =
    useSendMethodSelection();
  const contactName = draftInvoice.customer.name;
  const validUntil =
    formatQuoteDate(loadQuoteDetails()?.validUntil ?? "") || "the valid until date";

  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);

  async function handleConfirm() {
    if (!selected || sending) return;
    setSending(true);

    if (selected === "link") {
      try {
        await navigator.clipboard.writeText(DEMO_DESTINATIONS.link);
        setCopied(true);
      } catch {
        // Demo: still proceed even if clipboard is blocked.
      }
      window.setTimeout(() => router.push("/quote/sent"), 600);
      return;
    }

    window.setTimeout(() => router.push("/quote/sent"), 200);
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
      title="Send quote"
      titleId="send-quote-title"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
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
      <div
        className="rounded-lg border border-[#E8A317]/40 bg-[#FFF8E6] px-4 py-3.5 text-sm leading-5 text-black/80"
        role="status"
      >
        Once you send this quote, the customer can accept or reject it.
        Accepting creates a draft invoice you can continue editing.
      </div>

      <div className="mt-6">
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
                    Hello {contactName}, you are receiving a quote from{" "}
                    {SENDER_NAME} at {COMPANY_NAME}, valid until {validUntil}.
                    Click this link to view your quote.
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
                    {SENDER_NAME} from {COMPANY_NAME} has sent you a quote,
                    valid until {validUntil}. View it at this link.
                  </MessagePreview>
                ),
              },
              {
                method: "link",
                title: "URL link",
                summary: "Copy a shareable link",
                available: true,
                children: (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm leading-6 text-black/70">
                      Copy this link and send it in your own custom email or
                      through your own other means. We will not send anything
                      on your behalf.
                    </p>
                    <p className="break-all rounded-lg border border-black/10 bg-black/[0.02] px-3.5 py-2.5 text-sm text-black/80">
                      {DEMO_DESTINATIONS.link}
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
