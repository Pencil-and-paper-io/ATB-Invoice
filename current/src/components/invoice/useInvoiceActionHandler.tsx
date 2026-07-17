"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  UNCOLLECTIBLE_REASON_CODES,
  type InvoiceActionKey,
  type InvoiceStatus,
} from "@/lib/invoice-actions";
import { DownloadPdfModal } from "./DownloadPdfModal";
import { CloseIcon } from "./ui";

type Feedback = { kind: "info" | "danger"; message: string } | null;

function ConfirmModal({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-[10px] bg-white p-6 text-black shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-black/40 transition hover:bg-black/5"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
        <h2 className="pr-8 type-section-title">{title}</h2>
        <p className="mt-3 text-sm leading-5 text-black/70">{body}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            className="ui-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`h-11 rounded px-5 text-sm font-semibold text-white ${
              danger ? "bg-delete-red" : "bg-prime-blue hover:bg-prime-blue-hover"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useInvoiceActionHandler(status: InvoiceStatus) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showUncollectible, setShowUncollectible] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "void" | null>(null);
  const [reason, setReason] = useState<(typeof UNCOLLECTIBLE_REASON_CODES)[number]>(
    UNCOLLECTIBLE_REASON_CODES[0],
  );
  const [otherReason, setOtherReason] = useState("");
  const isDraft = status === "drafted";

  function handleAction(key: string) {
    const action = key as InvoiceActionKey;

    if (action === "uncollectible") {
      setShowUncollectible(true);
      return;
    }
    if (action === "delete" || action === "void") {
      setConfirm(action);
      return;
    }
    if (action === "mark_viewed") {
      router.push("/sent/viewed");
      return;
    }
    if (action === "edit") {
      router.push("/");
      return;
    }
    if (action === "download") {
      setShowDownload(true);
      return;
    }

    const messages: Partial<Record<InvoiceActionKey, string>> = {
      template: "Saved as template (demo).",
      duplicate: "Invoice duplicated (demo).",
      resend: "Re-send opened (demo).",
      copy_link: "Invoice link copied (demo).",
      send_test: "Test invoice sent (demo).",
      view_history: "Opening history (demo).",
    };

    setFeedback({
      kind: "info",
      message: messages[action] ?? "Action completed (demo).",
    });
  }

  function confirmUncollectible() {
    if (reason === "Other" && !otherReason.trim()) {
      setFeedback({
        kind: "danger",
        message: "Please enter a reason for “Other”.",
      });
      return;
    }
    setShowUncollectible(false);
    router.push("/sent/uncollectible");
  }

  const feedbackBanner = feedback ? (
    <div
      className={`fixed bottom-28 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        feedback.kind === "danger"
          ? "bg-delete-red text-white"
          : "bg-midnight-ink text-white"
      }`}
      role="status"
    >
      {feedback.message}
      <button
        type="button"
        className="ml-3 underline"
        onClick={() => setFeedback(null)}
      >
        Dismiss
      </button>
    </div>
  ) : null;

  const uncollectibleModal = showUncollectible ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="uncollectible-title"
        className="w-full max-w-md rounded-[10px] bg-white p-6 text-black shadow-xl"
      >
        <h2 id="uncollectible-title" className="type-section-title">
          Mark as Uncollectible
        </h2>
        {(status === "overdue_under_90" ||
          status === "overdue_over_90" ||
          status === "viewed" ||
          status === "partially_paid") && (
          <p className="mt-3 text-sm leading-5 text-black/70">
            Are you sure you want to write this off? Marking this invoice as
            uncollectible will record it as bad debt in your reports. If this
            invoice was simply created in error, you should Void it instead.
          </p>
        )}
        <label className="mt-5 flex flex-col gap-2 text-sm">
          <span className="font-medium">Reason code</span>
          <select
            className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue focus:bg-input-grey"
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value as (typeof UNCOLLECTIBLE_REASON_CODES)[number],
              )
            }
          >
            {UNCOLLECTIBLE_REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        {reason === "Other" ? (
          <label className="mt-3 flex flex-col gap-2 text-sm">
            <span className="font-medium">Other reason</span>
            <input
              className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue focus:bg-input-grey"
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value)}
              placeholder="Describe the reason"
            />
          </label>
        ) : null}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            className="ui-btn-secondary"
            onClick={() => setShowUncollectible(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-11 rounded bg-delete-red px-5 text-sm font-semibold text-white"
            onClick={confirmUncollectible}
          >
            Mark Uncollectible
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const confirmModal =
    confirm === "delete" ? (
      <ConfirmModal
        title="Delete draft invoice?"
        body="Are you sure you want to permanently delete this draft invoice? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          setFeedback({
            kind: "danger",
            message: "Draft invoice deleted (demo).",
          });
        }}
      />
    ) : confirm === "void" ? (
      <ConfirmModal
        title="Void invoice?"
        body="Voiding invalidates the customer payment link and keeps this invoice on record."
        confirmLabel="Void invoice"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          router.push("/sent/void");
        }}
      />
    ) : null;

  const downloadModal = showDownload ? (
    <DownloadPdfModal
      documentKind="invoice"
      isDraft={isDraft}
      onClose={() => setShowDownload(false)}
    />
  ) : null;

  return {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
  };
}
