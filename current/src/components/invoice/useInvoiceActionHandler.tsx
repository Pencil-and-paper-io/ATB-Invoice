"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { exportSingleInvoiceCsv } from "@/lib/csv-export";
import {
  UNCOLLECTIBLE_REASON_CODES,
  type InvoiceActionKey,
  type InvoiceStatus,
} from "@/lib/invoice-actions";
import { DownloadPdfModal } from "./DownloadPdfModal";
import { ManualReceiptModal } from "./ManualReceiptModal";
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

export function useInvoiceActionHandler(status: InvoiceStatus) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showUncollectible, setShowUncollectible] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [confirm, setConfirm] = useState<"delete" | "void" | "send_reminder" | null>(
    null,
  );
  const [reason, setReason] = useState<(typeof UNCOLLECTIBLE_REASON_CODES)[number]>(
    UNCOLLECTIBLE_REASON_CODES[0],
  );
  const [otherReason, setOtherReason] = useState("");
  const isDraft = status === "drafted";

  async function copyDemoLink() {
    try {
      await navigator.clipboard.writeText("https://pay.atb.com/invoice/3001");
      setFeedback({ kind: "info", message: "Invoice link copied." });
    } catch {
      setFeedback({
        kind: "info",
        message: "Invoice link ready (clipboard blocked in this browser).",
      });
    }
  }

  function handleAction(key: string) {
    const action = key as InvoiceActionKey;

    if (action === "uncollectible") {
      setShowUncollectible(true);
      return;
    }
    if (action === "delete" || action === "void" || action === "send_reminder") {
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
    if (action === "send_receipt") {
      setShowReceipt(true);
      return;
    }
    if (action === "export_csv") {
      exportSingleInvoiceCsv("3001");
      setFeedback({ kind: "info", message: "CSV exported." });
      return;
    }
    if (action === "copy_link") {
      void copyDemoLink();
      return;
    }

    const messages: Partial<Record<InvoiceActionKey, string>> = {
      template: "Saved as template (demo).",
      duplicate: "Invoice duplicated (demo).",
      resend: "Re-send opened (demo).",
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
    <Modal
      title="Mark as Uncollectible"
      titleId="uncollectible-title"
      onClose={() => setShowUncollectible(false)}
      zClass="z-[70]"
      confirmLabel="Mark Uncollectible"
      onConfirm={confirmUncollectible}
      confirmDanger
    >
      {(status === "overdue_under_90" ||
        status === "overdue_over_90" ||
        status === "viewed" ||
        status === "partially_paid") && (
        <p className="type-body-muted text-center leading-5">
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
    </Modal>
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
    ) : confirm === "send_reminder" ? (
      <ConfirmModal
        title="Send reminder?"
        body="Send a payment reminder to this customer for the outstanding balance on this invoice."
        confirmLabel="Send reminder"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          setFeedback({
            kind: "info",
            message: "Reminder sent (demo).",
          });
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

  const receiptModal = showReceipt ? (
    <ManualReceiptModal
      onClose={() => setShowReceipt(false)}
      onSent={() =>
        setFeedback({ kind: "info", message: "Receipt sent (demo)." })
      }
    />
  ) : null;

  return {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
    receiptModal,
  };
}
