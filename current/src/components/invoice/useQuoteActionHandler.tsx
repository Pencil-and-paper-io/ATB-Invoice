"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { QuoteActionKey, QuoteStatus } from "@/lib/quote-actions";
import { duplicateQuoteDetails } from "@/lib/quote-details";
import { markQuoteAcceptedForInvoice } from "@/lib/quote-to-invoice";
import { DownloadPdfModal } from "./DownloadPdfModal";
import { Modal } from "./ui";

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
  return (
    <Modal
      title={title}
      onClose={onClose}
      zClass="z-[70]"
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      confirmDanger={danger}
    >
      <p className="type-body-muted text-center leading-5">{body}</p>
    </Modal>
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

  async function copyDemoLink() {
    try {
      await navigator.clipboard.writeText("https://pay.atb.com/quote/Q-118");
      setFeedback({ kind: "info", message: "Quote link copied." });
    } catch {
      setFeedback({
        kind: "info",
        message: "Quote link ready (clipboard blocked in this browser).",
      });
    }
  }

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
      markQuoteAcceptedForInvoice();
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
    if (action === "copy_link") {
      void copyDemoLink();
      return;
    }

    const messages: Partial<Record<QuoteActionKey, string>> = {
      template: "Saved as template (demo).",
      resend: "Re-send opened (demo).",
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
