"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { draftInvoice, previewMeta } from "@/lib/invoice-demo-data";
import {
  MessagePreview,
  SendButtonIcon,
  SendMethodAccordion,
  useSendMethodSelection,
} from "./SendMethodAccordion";
import { CloseIcon } from "./ui";

const SENDER_NAME = "Meganne";
const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/invoice/3001",
};

export function SendInvoiceModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { selected, copied, sending, setCopied, setSending, selectMethod } =
    useSendMethodSelection();
  const contactName = draftInvoice.customer.name;
  const dueDate = previewMeta.dueDate.replace(/^Due /, "");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
      window.setTimeout(() => router.push("/sent"), 600);
      return;
    }

    window.setTimeout(() => router.push("/sent"), 200);
  }

  const confirmLabel = (() => {
    if (copied) return "Copied!";
    if (selected === "email") return "Send via email";
    if (selected === "text") return "Send via text";
    if (selected === "link") return "Copy link";
    return "Send";
  })();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-invoice-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
          aria-label="Close send modal"
        >
          <CloseIcon />
        </button>

        <h2
          id="send-invoice-title"
          className="pr-10 type-modal-title"
        >
          Send invoice
        </h2>

        <div
          className="mt-4 rounded-lg border border-[#E8A317]/40 bg-[#FFF8E6] px-4 py-3.5 text-sm leading-5 text-black/80"
          role="status"
        >
          Once you send this invoice, you will no longer be able to edit it.
          You can still void it or mark it uncollectible later if needed.
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
                      Hello {contactName}, you are receiving an invoice from{" "}
                      {SENDER_NAME} at {COMPANY_NAME}, due {dueDate}. Click
                      this link to view your invoice.
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
                      {SENDER_NAME} from {COMPANY_NAME} has sent you an invoice,
                      due {dueDate}. View it at this link.
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

        <div className="mt-8 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || sending}
            onClick={() => void handleConfirm()}
            className="inline-flex h-11 items-center gap-2 rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-prime-blue-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {selected ? <SendButtonIcon method={selected} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
