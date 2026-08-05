"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  appendInvoiceActivityExtra,
  formatActivityNow,
  setPendingInvoiceToast,
} from "@/lib/document-activity";
import { draftInvoice, previewMeta } from "@/lib/invoice-demo-data";
import {
  enableInvoicePassword,
  generateInvoicePassword,
  invoiceShareUrl,
} from "@/lib/invoice-password";
import {
  MessagePreview,
  SendButtonIcon,
  SendMethodAccordion,
  useSendMethodSelection,
} from "./SendMethodAccordion";
import { InvoiceNotificationPreview } from "./NotificationMessagePreview";
import { InvoicePasswordSentPanel } from "./InvoicePasswordSentPanel";
import { ShareableLinkHelp } from "./ShareableLinkHelp";
import { InfoTooltip, Modal } from "./ui";
import { useIsDesktopLg } from "./useIsDesktopLg";

const COMPANY_NAME = draftInvoice.business.name;

const DEMO_DESTINATIONS = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
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

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.5 8A5.5 5.5 0 1 1 11.3 3.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 2.5v2.75H13.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PasswordProtectControls({
  enabled,
  password,
  onEnabledChange,
  onPasswordChange,
  onGenerate,
}: {
  enabled: boolean;
  password: string;
  onEnabledChange: (enabled: boolean) => void;
  onPasswordChange: (password: string) => void;
  onGenerate: () => void;
}) {
  const [copiedPassword, setCopiedPassword] = useState(false);

  async function copyPassword() {
    const value = password.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedPassword(true);
      window.setTimeout(() => setCopiedPassword(false), 1600);
    } catch {
      // Demo: ignore clipboard failures.
    }
  }

  return (
    <div className="rounded-[10px] border border-black/10 bg-white px-4 py-4">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-prime-blue"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-midnight-ink">
            Require a password to open
            <InfoTooltip text="Customers must enter this password before they can view the invoice or pay online." />
          </span>
          <span className="mt-1 block text-sm leading-5 text-black/60">
            Your customer will need a password to view the invoice
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="mt-4 border-t border-dashed border-black/15 pt-4">
          <label
            htmlFor="invoice-share-password"
            className="type-label text-black"
          >
            Password
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id="invoice-share-password"
                type="text"
                autoComplete="off"
                spellCheck={false}
                className={`${UI_CLASS.input} w-full pr-11`}
                value={password}
                onChange={(event) => {
                  setCopiedPassword(false);
                  onPasswordChange(event.target.value);
                }}
                placeholder="Enter or generate a password"
              />
              <button
                type="button"
                onClick={() => {
                  setCopiedPassword(false);
                  onGenerate();
                }}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-black/45 transition hover:bg-black/5 hover:text-midnight-ink"
                aria-label="Generate new password"
                title="Generate new password"
              >
                <RefreshIcon />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void copyPassword()}
              disabled={!password.trim()}
              className={`${UI_CLASS.btnSecondary} h-11 shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {copiedPassword ? "Copied!" : "Copy"}
            </button>
          </div>
          {!password.trim() ? (
            <p className="type-danger mt-1.5">Enter a password to continue.</p>
          ) : (
            <p className="mt-1.5 text-sm text-black/55">
              Share this password with your customer separately.
            </p>
          )}
        </div>
      ) : null}
    </div>
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
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [sentSummary, setSentSummary] = useState<{
    method: "email" | "text" | "link";
    password: string | null;
    shareUrl: string;
  } | null>(null);
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
  const allowPasswordProtect = mode !== "test";

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

  function finishToSent(method: "email" | "text" | "link") {
    onSent?.(method);
    if (navigateOnSend) router.push("/sent");
    else onClose();
  }

  async function handleConfirm() {
    if (!selected || sending || sentSummary) return;
    if (!includeLink && selected === "link") return;
    if (allowPasswordProtect && passwordProtect && !sharePassword.trim()) {
      return;
    }

    setSending(true);

    const protectedSend = allowPasswordProtect && passwordProtect;
    const password = protectedSend ? sharePassword.trim() : null;
    const shareUrl = invoiceShareUrl(Boolean(password));

    if (password) {
      enableInvoicePassword(password);
    }

    if (selected === "link") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
      } catch {
        // Demo: still proceed even if clipboard is blocked.
      }
    }

    const viaLabel =
      selected === "email"
        ? "via email"
        : selected === "text"
          ? "via text"
          : "via shareable link";

    appendInvoiceActivityExtra({
      id: `send-pw-${Date.now()}`,
      time: formatActivityNow(),
      text: password
        ? `You sent the invoice ${viaLabel} (password protected)`
        : `You sent the invoice ${viaLabel}`,
      sendDestination:
        selected === "email"
          ? DEMO_DESTINATIONS.email
          : selected === "text"
            ? DEMO_DESTINATIONS.phone
            : shareUrl,
    });

    setPendingInvoiceToast(
      password
        ? `Invoice sent with password protection. Password: ${password}`
        : selected === "link"
          ? "Shareable link copied."
          : "Invoice sent.",
    );

    window.setTimeout(() => {
      setSending(false);
      setSentSummary({
        method: selected,
        password,
        shareUrl,
      });
    }, selected === "link" ? 400 : 200);
  }

  const confirmLabel = (() => {
    if (copied) return "Copied!";
    if (selected === "email") return "Send via email";
    if (selected === "text") return "Send via text";
    if (selected === "link") return "Copy link";
    return "Send";
  })();

  const passwordBlocking =
    allowPasswordProtect && passwordProtect && !sharePassword.trim();

  const confirmDisabled =
    !selected ||
    sending ||
    (!includeLink && selected === "link") ||
    passwordBlocking;

  const successBody = sentSummary ? (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-lg border border-prime-blue/25 bg-prime-blue/5 px-4 py-3.5 text-sm leading-5 text-black/80"
        role="status"
      >
        {sentSummary.method === "link"
          ? "Shareable link copied to your clipboard."
          : sentSummary.method === "email"
            ? `Invoice emailed to ${DEMO_DESTINATIONS.email}.`
            : `Invoice texted to ${DEMO_DESTINATIONS.phone}.`}
      </div>

      {sentSummary.password ? (
        <InvoicePasswordSentPanel
          password={sentSummary.password}
          shareUrl={sentSummary.shareUrl}
        />
      ) : null}
    </div>
  ) : null;

  const body = sentSummary ? (
    successBody
  ) : (
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

      {allowPasswordProtect ? (
        <div className="mt-5">
          <PasswordProtectControls
            enabled={passwordProtect}
            password={sharePassword}
            onEnabledChange={(enabled) => {
              setPasswordProtect(enabled);
              if (enabled && !sharePassword.trim()) {
                setSharePassword(generateInvoicePassword());
              }
            }}
            onPasswordChange={setSharePassword}
            onGenerate={() => setSharePassword(generateInvoicePassword())}
          />
        </div>
      ) : null}
    </>
  );

  if (isDesktop === null) return null;

  if (isDesktop) {
    return (
      <Modal
        title={sentSummary ? "Invoice sent" : title}
        titleId="send-invoice-title"
        onClose={onClose}
        maxWidthClass="max-w-2xl"
        zClass="z-[80]"
        cancelLabel="Cancel"
        hideCancel={Boolean(sentSummary)}
        confirmLabel={sentSummary ? "View sent invoice" : confirmLabel}
        onConfirm={() => {
          if (sentSummary) {
            finishToSent(sentSummary.method);
            return;
          }
          void handleConfirm();
        }}
        confirmDisabled={sentSummary ? false : confirmDisabled}
        confirmChildren={
          sentSummary ? undefined : (
            <>
              {selected ? <SendButtonIcon method={selected} /> : null}
              {confirmLabel}
            </>
          )
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
            {sentSummary ? "Invoice sent" : title}
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
          {sentSummary ? null : (
            <button
              type="button"
              onClick={onClose}
              className={`${UI_CLASS.btnSecondary} h-11 px-5`}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (sentSummary) {
                finishToSent(sentSummary.method);
                return;
              }
              void handleConfirm();
            }}
            disabled={sentSummary ? false : confirmDisabled}
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {sentSummary ? null : selected ? (
              <SendButtonIcon method={selected} />
            ) : null}
            {sentSummary ? "View sent invoice" : confirmLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
