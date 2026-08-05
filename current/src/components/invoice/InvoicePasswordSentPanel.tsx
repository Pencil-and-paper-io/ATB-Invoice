"use client";

import { useState } from "react";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  DEMO_SHARE_PATH,
  invoiceShareUrl,
} from "@/lib/invoice-password";

/** Shared password summary shown after send and from the sent-invoice lock. */
export function InvoicePasswordSentPanel({
  password,
  shareUrl,
}: {
  password: string;
  shareUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resolvedUrl = shareUrl ?? invoiceShareUrl(true);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Demo: ignore clipboard failures.
    }
  }

  return (
    <div className="rounded-[10px] border border-black/10 px-4 py-4">
      <p className="text-sm font-semibold text-midnight-ink">
        Password protected
      </p>
      <p className="mt-1 text-sm leading-5 text-black/65">
        Your customer will need this password to open the invoice.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 rounded-md bg-black/[0.04] px-3 py-2 font-mono text-base font-semibold tracking-wide text-midnight-ink">
          {password}
        </p>
        <button
          type="button"
          onClick={() => void copyPassword()}
          className={`${UI_CLASS.btnSecondary} h-11 shrink-0 px-4`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-3 break-all text-xs text-black/45">
        Link: {resolvedUrl}
      </p>
      <p className="mt-2 text-xs text-black/45">
        Demo unlock page: {DEMO_SHARE_PATH}
      </p>
    </div>
  );
}

export function PasswordLockButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-black/15 bg-white text-midnight-ink transition hover:border-prime-blue hover:text-prime-blue"
      aria-label="View invoice password"
      title="Password protected — view password"
    >
      <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden>
        <rect
          x="2.5"
          y="7.5"
          width="11"
          height="9"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 7.5V5.25a3 3 0 0 1 6 0V7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="12" r="1.25" fill="currentColor" />
      </svg>
    </button>
  );
}
