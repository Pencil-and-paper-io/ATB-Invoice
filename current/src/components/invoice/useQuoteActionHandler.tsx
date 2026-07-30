"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  appendQuoteActivityExtra,
  formatActivityNow,
} from "@/lib/document-activity";
import {
  channelLabel,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
} from "@/lib/document-automations";
import { exportSingleQuoteCsv } from "@/lib/csv-export";
import type { QuoteActionKey, QuoteStatus } from "@/lib/quote-actions";
import { duplicateQuoteDetails } from "@/lib/quote-details";
import { markQuoteAcceptedForInvoice } from "@/lib/quote-to-invoice";
import type { DocumentAutomationsState } from "./DocumentAutomationsSection";
import { DownloadPdfModal } from "./DownloadPdfModal";
import { EditScheduledReminderModal } from "./ScheduledReminderPanel";
import { SendQuoteModal } from "./SendQuoteModal";
import { Modal } from "./ui";

type Feedback = { kind: "info" | "danger"; message: string } | null;
type SendModalMode = "resend" | "test" | null;

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
      body={body}
    />
  );
}

export function useQuoteActionHandler(
  initialStatus: QuoteStatus = "sent",
  options?: {
    anchorLabel?: string;
    customerId?: string | null;
    allowSendNow?: boolean;
  },
) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const anchorLabel = options?.anchorLabel ?? "August 5, 2026";
  const customerId = options?.customerId ?? null;
  const allowSendNow = options?.allowSendNow ?? true;

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderSchedule, setReminderSchedule] =
    useState<DocumentAutomationsState | null>(null);
  const [sendModal, setSendModal] = useState<SendModalMode>(null);
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

  function openReminderEditor() {
    setReminderSchedule(loadOrInitDocumentAutomations("quote", customerId));
    setShowReminder(true);
  }

  function logReminderActivity(text: string) {
    appendQuoteActivityExtra({
      id: `rem-${Date.now()}`,
      time: formatActivityNow(),
      text,
    });
  }

  function applyReminderSchedule(next: DocumentAutomationsState) {
    if (next.reminderSendDate === "now") {
      const cleared = {
        ...next,
        reminders: false,
        reminderSendDate: null,
        reminderChannel: null as DocumentAutomationsState["reminderChannel"],
      };
      persistDocumentAutomations("quote", cleared);
      setReminderSchedule(cleared);
      setShowReminder(false);
      logReminderActivity(`${channelLabel(next.reminderChannel)} reminder sent`);
      setFeedback({
        kind: "info",
        message: `${channelLabel(next.reminderChannel)} reminder sent.`,
      });
      return;
    }

    persistDocumentAutomations("quote", next);
    setReminderSchedule(next);
    setShowReminder(false);
    setFeedback({
      kind: "info",
      message: next.reminders
        ? "Scheduled reminder saved."
        : "Reminder updated.",
    });
  }

  function removeReminderSchedule() {
    if (!reminderSchedule) {
      setShowReminder(false);
      return;
    }
    const next = {
      ...reminderSchedule,
      reminders: false,
      reminderChannel: null,
      reminderSendDate: null,
    };
    persistDocumentAutomations("quote", next);
    setReminderSchedule(next);
    setShowReminder(false);
    setFeedback({ kind: "info", message: "Scheduled reminder removed." });
  }

  function handleAction(key: string, forStatus?: QuoteStatus) {
    if (forStatus) setStatus(forStatus);
    const action = key as QuoteActionKey;

    if (action === "delete" || action === "void" || action === "mark_rejected") {
      setConfirm(action);
      return;
    }
    if (action === "send_reminder") {
      openReminderEditor();
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
    if (action === "export_csv") {
      exportSingleQuoteCsv();
      setFeedback({ kind: "info", message: "CSV exported." });
      return;
    }
    if (action === "duplicate") {
      duplicateQuoteDetails();
      setFeedback({
        kind: "info",
        message: "Quote duplicated (demo).",
      });
      return;
    }
    if (action === "copy_link") {
      void copyDemoLink();
      return;
    }
    if (action === "resend") {
      setSendModal("resend");
      return;
    }
    if (action === "send_test") {
      setSendModal("test");
      return;
    }

    const messages: Partial<Record<QuoteActionKey, string>> = {
      template: "Saved as template (demo).",
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

  const reminderModal =
    showReminder && reminderSchedule ? (
      <EditScheduledReminderModal
        documentKind="quote"
        value={reminderSchedule}
        anchorLabel={anchorLabel}
        allowSendNow={allowSendNow}
        onClose={() => setShowReminder(false)}
        onSave={applyReminderSchedule}
        onRemove={removeReminderSchedule}
      />
    ) : null;

  const sendModalNode = sendModal ? (
    <SendQuoteModal
      mode={sendModal}
      navigateOnSend={false}
      onClose={() => setSendModal(null)}
      onSent={(method) =>
        setFeedback({
          kind: "info",
          message:
            method === "email"
              ? `${sendModal === "test" ? "Test quote" : "Quote"} emailed.`
              : method === "text"
                ? `${sendModal === "test" ? "Test quote" : "Quote"} texted.`
                : "Quote link copied.",
        })
      }
    />
  ) : null;

  return {
    handleAction,
    feedbackBanner,
    confirmModal,
    downloadModal,
    reminderModal,
    sendModal: sendModalNode,
  };
}
