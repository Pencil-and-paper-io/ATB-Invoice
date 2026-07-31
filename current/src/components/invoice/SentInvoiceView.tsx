"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getActionsForStatus,
  type InvoiceStatus,
} from "@/lib/invoice-actions";
import {
  formatMoney,
  previewMeta,
  sentVariantMeta,
  type SentViewVariant,
} from "@/lib/invoice-demo-data";
import {
  consumePendingInvoiceToast,
  mergeInvoiceActivity,
  type ActivityItem,
} from "@/lib/document-activity";
import { loadSelfNotes } from "@/lib/invoice-self-notes";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { DocumentActivityTimeline } from "./DocumentActivityTimeline";
import { DownloadMenuButton } from "./DownloadMenuButton";
import {
  FullscreenDetailCards,
  type FullscreenDetailCard,
} from "./FullscreenDetailCards";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { TopNav } from "./TopNav";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";

const VARIANT_STATUS: Record<SentViewVariant, InvoiceStatus> = {
  sent: "sent",
  viewed: "viewed",
  paid: "paid",
  partially_paid: "partially_paid",
  overdue: "overdue_under_90",
  overdue_90: "overdue_over_90",
  void: "void",
  uncollectible: "uncollectible",
};

const SHOW_SCHEDULED_REMINDER: Record<SentViewVariant, boolean> = {
  sent: true,
  viewed: true,
  paid: false,
  partially_paid: true,
  overdue: true,
  overdue_90: true,
  void: false,
  uncollectible: false,
};

function truncateSummary(text: string, max = 80) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded border px-2.5 py-1.5 text-sm font-semibold sm:text-base ${className}`}
    >
      {label}
    </span>
  );
}

export function SentInvoiceView({
  variant = "sent",
}: {
  variant?: SentViewVariant;
}) {
  const status = VARIANT_STATUS[variant];
  const meta = sentVariantMeta[variant];
  const dueAnchor = previewMeta.dueDate.replace(/^Due\s+/i, "");
  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
    receiptModal,
    reminderModal,
    sendModal,
  } = useInvoiceActionHandler(status, {
    anchorLabel: dueAnchor,
    allowSendNow: true,
  });
  const [showPayment, setShowPayment] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    mergeInvoiceActivity(meta.activity),
  );
  const [paymentToast, setPaymentToast] = useState<string | null>(null);
  const [selfNoteSummary, setSelfNoteSummary] = useState(
    "Add a private note",
  );
  const moreActions = getActionsForStatus(status, [
    "view_history",
    "copy_link",
    "download",
    "export_csv",
  ]);
  const balanceDue =
    variant === "partially_paid"
      ? Math.max(0, Number((previewMeta.amount - 1500).toFixed(2)))
      : previewMeta.amount;

  useEffect(() => {
    setActivity(mergeInvoiceActivity(meta.activity));
  }, [meta.activity, variant]);

  useEffect(() => {
    const pending = consumePendingInvoiceToast();
    if (pending) setPaymentToast(pending);
  }, [variant]);

  useEffect(() => {
    window.setTimeout(() => {
      const body = loadSelfNotes()[0]?.body?.trim() ?? "";
      setSelfNoteSummary(body ? truncateSummary(body) : "Add a private note");
    }, 0);
  }, []);

  const activitySummary =
    activity[0]?.text?.trim() || "No activity yet";

  const metaCards: FullscreenDetailCard[] = useMemo(
    () => [
      {
        id: "activity",
        title: "Activity",
        summary: truncateSummary(activitySummary),
        canSave: false,
        content: (
          <DocumentActivityTimeline
            documentKind="invoice"
            pastItems={activity}
            onPastItemsChange={setActivity}
            anchorLabel={dueAnchor}
            customerId="acme"
            showScheduledReminder={SHOW_SCHEDULED_REMINDER[variant]}
            showRevokeAllAccess={SHOW_SCHEDULED_REMINDER[variant]}
            allowSendNow
          />
        ),
      },
      {
        id: "noteToSelf",
        title: "Note to Self",
        summary: selfNoteSummary,
        content: (
          <NoteToSelfSection
            onNoteChange={(note) => {
              const body = note?.body?.trim() ?? "";
              setSelfNoteSummary(
                body ? truncateSummary(body) : "Add a private note",
              );
            }}
          />
        ),
      },
    ],
    [
      activity,
      activitySummary,
      dueAnchor,
      selfNoteSummary,
      variant,
    ],
  );

  function renderActions() {
    return (
      <>
        <MoreActionsMenu actions={moreActions} onAction={handleAction} />
        <DownloadMenuButton
          onDownloadPdf={() => handleAction("download")}
          onDownloadCsv={() => handleAction("export_csv")}
        />
        {meta.showRecordPayment ? (
          <button
            type="button"
            onClick={() => setShowPayment(true)}
            className="ui-btn-primary"
          >
            Record Payment
          </button>
        ) : null}
      </>
    );
  }

  const paymentToastBanner = paymentToast ? (
    <div
      className="fixed bottom-28 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-lg bg-midnight-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
      role="status"
    >
      {paymentToast}
      <button
        type="button"
        className="ml-3 underline"
        onClick={() => setPaymentToast(null)}
      >
        Dismiss
      </button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-10 sm:px-8 lg:px-[158px] lg:pb-24 lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="type-page-title">{meta.title}</h1>
            <StatusBadge
              label={meta.badge.label}
              className={`lg:hidden ${meta.badge.className}`}
            />
          </div>
          <div className="hidden flex-wrap items-center gap-2.5 lg:flex">
            {renderActions()}
          </div>
        </div>

        <div className="mb-5">
          <FullscreenDetailCards
            listLabel="Invoice details"
            cards={metaCards}
            onActiveChange={setPanelOpen}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden flex-col gap-[15px] lg:flex">
            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">
                {meta.amountLabel}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="type-amount">{formatMoney(balanceDue)}</p>
                <StatusBadge
                  label={meta.badge.label}
                  className={meta.badge.className}
                />
              </div>
            </section>
          </aside>

          <CustomerInvoiceCard shadow="sent" />
        </div>
      </main>

      {!panelOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-8 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-2.5">
            {renderActions()}
          </div>
        </div>
      ) : null}

      {showPayment ? (
        <RecordPaymentModal
          balanceDue={balanceDue}
          onClose={() => setShowPayment(false)}
        />
      ) : null}
      {paymentToastBanner}
      {feedbackBanner}
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
      {receiptModal}
      {reminderModal}
      {sendModal}
    </div>
  );
}
