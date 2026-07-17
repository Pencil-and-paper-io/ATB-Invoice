"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { QuoteActionKey, QuoteStatus } from "@/lib/quote-actions";
import { duplicateQuoteDetails } from "@/lib/quote-details";
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
        <h2 className="pr-8 text-lg font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-5 text-black/70">{body}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            className="h-11 rounded-[5px] border border-midnight-ink px-5 text-sm font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`h-11 rounded px-5 text-sm font-semibold text-white ${
              danger ? "bg-delete-red" : "bg-prime-blue hover:bg-[#0063d1]"
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

export function useQuoteActionHandler(status: QuoteStatus) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "void" | "mark_rejected" | null>(
    null,
  );
  const isDraft = status === "drafted";

  function handleAction(key: string) {
    const action = key as QuoteActionKey;

    if (action === "delete" || action === "void" || action === "mark_rejected") {
      setConfirm(action);
      return;
    }
    if (action === "mark_viewed") {
      router.push("/quote/viewed");
      return;
    }
    if (action === "mark_accepted") {
      router.push("/?from=quote");
      return;
    }
    if (action === "edit") {
      router.push("/quote");
      return;
    }
    if (action === "download") {
      setShowDownload(true);
      return;
    }
    if (action === "duplicate") {
      duplicateQuoteDetails();
      router.push("/quote");
      return;
    }

    const messages: Partial<Record<QuoteActionKey, string>> = {
      template: "Saved as template (demo).",
      resend: "Re-send opened (demo).",
      copy_link: "Quote link copied (demo).",
      send_test: "Test quote sent (demo).",
      view_history: "Opening history (demo).",
    };

    setFeedback({
      kind: "info",
      message: messages[action] ?? "Action completed (demo).",
    });
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

  const confirmModal =
    confirm === "delete" ? (
      <ConfirmModal
        title="Delete draft quote?"
        body="Are you sure you want to permanently delete this draft quote? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          setFeedback({
            kind: "danger",
            message: "Draft quote deleted (demo).",
          });
        }}
      />
    ) : confirm === "void" ? (
      <ConfirmModal
        title="Void quote?"
        body="Voiding blocks the customer from accepting this quote and keeps it on record."
        confirmLabel="Void quote"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          router.push("/quote/void");
        }}
      />
    ) : confirm === "mark_rejected" ? (
      <ConfirmModal
        title="Mark quote as rejected?"
        body="Use this when the customer declined offline. No invoice will be created."
        confirmLabel="Mark as rejected"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          router.push("/quote/rejected");
        }}
      />
    ) : null;

  const downloadModal = showDownload ? (
    <DownloadPdfModal
      documentKind="quote"
      isDraft={isDraft}
      onClose={() => setShowDownload(false)}
    />
  ) : null;

  return { handleAction, feedbackBanner, confirmModal, downloadModal };
}
