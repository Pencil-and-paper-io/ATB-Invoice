"use client";

import { useState } from "react";
import {
  UNCOLLECTIBLE_REASON_CODES,
  type InvoiceActionKey,
  type InvoiceStatus,
} from "@/lib/invoice-actions";

type Feedback = { kind: "info" | "danger"; message: string } | null;

export function useInvoiceActionHandler(status: InvoiceStatus) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showUncollectible, setShowUncollectible] = useState(false);
  const [reason, setReason] = useState<(typeof UNCOLLECTIBLE_REASON_CODES)[number]>(
    UNCOLLECTIBLE_REASON_CODES[0],
  );
  const [otherReason, setOtherReason] = useState("");

  function handleAction(key: InvoiceActionKey) {
    if (key === "uncollectible") {
      setShowUncollectible(true);
      return;
    }

    const messages: Record<Exclude<InvoiceActionKey, "uncollectible">, string> = {
      edit: "Opening editor…",
      download: "Download started (demo).",
      delete: "Draft invoice deleted (demo).",
      void: "Invoice voided (demo).",
      template: "Saved as template (demo).",
      duplicate: "Invoice duplicated (demo).",
    };

    setFeedback({
      kind: key === "delete" || key === "void" ? "danger" : "info",
      message: messages[key],
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
    setFeedback({
      kind: "danger",
      message: `Marked uncollectible (${reason === "Other" ? otherReason.trim() : reason}) — demo.`,
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

  const uncollectibleModal = showUncollectible ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="uncollectible-title"
        className="w-full max-w-md rounded-[10px] bg-white p-6 text-black shadow-xl"
      >
        <h2 id="uncollectible-title" className="text-lg font-semibold">
          Mark as Uncollectible
        </h2>
        {(status === "overdue_under_90" ||
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
            className="h-11 rounded-[5px] border border-midnight-ink px-5 text-sm font-semibold"
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

  return { handleAction, feedbackBanner, uncollectibleModal };
}
