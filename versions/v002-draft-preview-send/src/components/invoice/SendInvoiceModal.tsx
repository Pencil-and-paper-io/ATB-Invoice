"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { draftInvoice } from "@/lib/invoice-demo-data";
import { CloseIcon } from "./ui";

export type SendMethod = "email" | "text" | "link";

type SendDestination = {
  email: string | null;
  phone: string | null;
  /** Public invoice URL used for “Copy link”. */
  link: string;
};

/** Demo destinations — in product these come from customer/settings pages. */
const DEMO_DESTINATIONS: SendDestination = {
  email: draftInvoice.customer.email,
  phone: draftInvoice.customer.phone,
  link: "https://pay.atb.com/invoice/3001",
};

function MethodIcon({ method }: { method: SendMethod }) {
  if (method === "email") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 6.5h16v11H4v-11Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="m4.5 7 7.5 6 7.5-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (method === "text") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 4h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4l-4 3v-3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a4 4 0 0 0 5.66.1l2.12-2.12a4 4 0 0 0-5.66-5.66L11 7.44"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 10a4 4 0 0 0-5.66-.1L6.22 12a4 4 0 0 0 5.66 5.66L13 16.56"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MethodOption({
  method,
  title,
  detail,
  available,
  selected,
  onSelect,
}: {
  method: SendMethod;
  title: string;
  detail: string;
  available: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!available}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition ${
        !available
          ? "cursor-not-allowed border-black/10 bg-black/[0.02] opacity-60"
          : selected
            ? "border-prime-blue bg-prime-blue/5"
            : "border-black/15 bg-white hover:border-black/30"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-prime-blue bg-prime-blue text-white"
            : "border-black/25 bg-white"
        }`}
        aria-hidden
      >
        {selected ? (
          <span className="h-2 w-2 rounded-full bg-white" />
        ) : null}
      </span>
      <span className="mt-0.5 shrink-0 text-midnight-ink">
        <MethodIcon method={method} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-black">{title}</span>
        <span className="mt-0.5 block text-sm text-black/60">{detail}</span>
      </span>
    </button>
  );
}

export function SendInvoiceModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const destinations = DEMO_DESTINATIONS;
  const [method, setMethod] = useState<SendMethod | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const emailAvailable = Boolean(destinations.email);
  const textAvailable = Boolean(destinations.phone);
  const canConfirm = method !== null && !sending;

  async function handleConfirm() {
    if (!method) return;
    setSending(true);

    if (method === "link") {
      try {
        await navigator.clipboard.writeText(destinations.link);
        setCopied(true);
      } catch {
        // Demo: still proceed even if clipboard is blocked.
      }
    }

    // Push (not replace) so browser back / ← can return to preview & draft while iterating.
    window.setTimeout(() => {
      router.push("/sent");
    }, method === "link" ? 600 : 200);
  }

  const confirmLabel =
    method === "link"
      ? copied
        ? "Copied — sending…"
        : "Copy link & send"
      : method === "email"
        ? "Send via email"
        : method === "text"
          ? "Send via text"
          : "Send";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-invoice-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
          aria-label="Close send modal"
        >
          <CloseIcon />
        </button>

        <h2
          id="send-invoice-title"
          className="pr-8 font-display text-xl font-bold text-black"
        >
          Send invoice
        </h2>

        <div
          className="mt-4 rounded-lg border border-[#E8A317]/40 bg-[#FFF8E6] px-3.5 py-3 text-sm leading-5 text-black/80"
          role="status"
        >
          Once you send this invoice, you will no longer be able to edit it.
          You can still void it or mark it uncollectible later if needed.
          <span className="mt-1.5 block text-black/55">
            While building, use your browser back button (or ← on the next
            screen) to return to preview or draft.
          </span>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-black">How do you want to send it?</p>
          <div className="mt-3 flex flex-col gap-2.5" role="radiogroup" aria-label="Send method">
            <MethodOption
              method="email"
              title="Email"
              detail={
                emailAvailable
                  ? `Send to ${destinations.email}`
                  : "No email on file — add one on the customer page"
              }
              available={emailAvailable}
              selected={method === "email"}
              onSelect={() => setMethod("email")}
            />
            <MethodOption
              method="text"
              title="Text message"
              detail={
                textAvailable
                  ? `Send to ${destinations.phone}`
                  : "No phone on file — add one on the customer page"
              }
              available={textAvailable}
              selected={method === "text"}
              onSelect={() => setMethod("text")}
            />
            <MethodOption
              method="link"
              title="Copy link"
              detail="Copy a shareable link you can paste anywhere"
              available
              selected={method === "link"}
              onSelect={() => setMethod("link")}
            />
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-black/10 bg-page-grey px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
            Available contact info
          </p>
          <dl className="mt-2.5 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-black/55">Email</dt>
              <dd className="text-right font-medium text-black">
                {destinations.email ?? "Not set up"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-black/55">Phone</dt>
              <dd className="text-right font-medium text-black">
                {destinations.phone ?? "Not set up"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-black/55">Customer</dt>
              <dd className="text-right font-medium text-black">
                {draftInvoice.customer.name}
              </dd>
            </div>
          </dl>
          <p className="mt-2.5 text-xs text-black/45">
            Managed on the customer profile. Changes there will show up here.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[5px] border border-midnight-ink px-5 text-sm font-semibold text-midnight-ink transition hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => void handleConfirm()}
            className="h-11 rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-[#0063d1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
