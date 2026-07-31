"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UI_CLASS } from "@/lib/design-tokens";
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
import { useIsDesktopLg } from "./useIsDesktopLg";

const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/invoice/3001",
};

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const isDesktop = useIsDesktopLg();
  const [entered, setEntered] = useState(false);
  const { selected, copied, sending, setCopied, setSending, selectMethod } =
    useSendMethodSelection();
  const contactName = draftInvoice.customer.name;
  const dueDate = previewMeta.dueDate.replace(/^Due /, "");

  const emailAvailable = Boolean(DEMO_DESTINATIONS.email);
  const textAvailable = Boolean(DEMO_DESTINATIONS.phone);
  const title =
    mode === "resend"
      ? "Re-Send Invoice"
      : mode === "test"
        ? "Send Test Invoice"
        : "Send Invoice";
  const includeLink = mode !== "test";

  useEffect(() => {
    if (isDesktop !== false) return;
    setEntered(false);
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const confirmDisabled =
    !selected || sending || (!includeLink && selected === "link");

  const body = (
    <>
      {mode === "send" ? (
        <div
          className="rounded-lg border border-[#E8A317]/40 bg-[#FFF8E6] px-4 py-3.5 text-sm leading-5 text-black/80"
          role="status"
        >
          Once you send this invoice, you will no longer be able to edit it. You
          can still void it or mark it uncollectible later if needed.
        </div>
      ) : (
        <p className="text-sm leading-5 text-black/65">
          {mode === "test"
            ? "Send a test copy to yourself or the customer to verify delivery."
            : `Re-send invoice ${previewMeta.invoiceNumber} to ${contactName}.`}
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
    </>
  );

  if (isDesktop === null) return null;

  if (isDesktop) {
    return (
      <Modal
        title={title}
        titleId="send-invoice-title"
        onClose={onClose}
        maxWidthClass="max-w-2xl"
        zClass="z-[80]"
        confirmLabel={confirmLabel}
        onConfirm={() => void handleConfirm()}
        confirmDisabled={confirmDisabled}
        confirmChildren={
          <>
            {selected ? <SendButtonIcon method={selected} /> : null}
            {confirmLabel}
          </>
        }
      >
        {body}
      </Modal>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col bg-white transition duration-300 ease-out ${
        entered ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-invoice-title"
    >
      <header className="shrink-0 border-b border-black/10 bg-white">
        <div className="flex items-center gap-3 px-8 py-4 sm:px-12 lg:px-16 lg:py-5">
          <button
            type="button"
            onClick={onClose}
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-midnight-ink transition hover:bg-black/5"
            aria-label="Back"
          >
            <BackIcon />
          </button>
          <h2
            id="send-invoice-title"
            className="min-w-0 type-headline-5 text-midnight-ink"
          >
            {title}
          </h2>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-8 py-6 sm:px-12 sm:py-8 lg:px-16">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
            {body}
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-black/10 bg-white">
        <div className="flex flex-wrap items-center justify-end gap-3 px-8 py-4 sm:px-12 lg:px-16">
          <button
            type="button"
            onClick={onClose}
            className={`${UI_CLASS.btnSecondary} h-11 px-5`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={confirmDisabled}
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {selected ? <SendButtonIcon method={selected} /> : null}
            {confirmLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
