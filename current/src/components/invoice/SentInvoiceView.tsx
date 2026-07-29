"use client";

import { useEffect, useState } from "react";
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
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { DocumentActivityTimeline } from "./DocumentActivityTimeline";
import { ModeBackButton } from "./ModeBackButton";
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

export function SentInvoiceView({
  variant = "sent",
}: {
  variant?: SentViewVariant;
}) {
  const status = VARIANT_STATUS[variant];
  const meta = sentVariantMeta[variant];
  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
    receiptModal,
    reminderModal,
    sendModal,
  } = useInvoiceActionHandler(status);
  const [showPayment, setShowPayment] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    mergeInvoiceActivity(meta.activity),
  );
  const [paymentToast, setPaymentToast] = useState<string | null>(null);
  const moreActions = getActionsForStatus(status);
  const balanceDue =
    variant === "partially_paid"
      ? Math.max(0, Number((previewMeta.amount - 1500).toFixed(2)))
      : previewMeta.amount;
  const dueAnchor = previewMeta.dueDate.replace(/^Due\s+/i, "");

  useEffect(() => {
    setActivity(mergeInvoiceActivity(meta.activity));
  }, [meta.activity, variant]);

  useEffect(() => {
    const pending = consumePendingInvoiceToast();
    if (pending) setPaymentToast(pending);
  }, [variant]);

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

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <ModeBackButton label="Back to preview" fallbackHref="/preview" />
            <h1 className="type-page-title">
              {meta.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            {meta.showRecordPayment ? (
              <button
                type="button"
                onClick={() => setShowPayment(true)}
                className="ui-btn-primary"
              >
                Record Payment
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[15px]">
            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">
                {meta.amountLabel}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="type-amount">
                  {formatMoney(balanceDue)}
                </p>
                <span
                  className={`inline-flex items-center rounded border px-2.5 py-1.5 text-base font-semibold ${meta.badge.className}`}
                >
                  {meta.badge.label}
                </span>
              </div>
            </section>

            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Activity</h2>
              <DocumentActivityTimeline
                documentKind="invoice"
                pastItems={activity}
                anchorLabel={dueAnchor}
                customerId="acme"
                showScheduledReminder={SHOW_SCHEDULED_REMINDER[variant]}
              />
            </section>

            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Note to Self</h2>
              <NoteToSelfSection />
            </section>
          </aside>

          <CustomerInvoiceCard shadow="sent" />
        </div>
      </main>
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
