"use client";

import { useState } from "react";
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
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
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
  overdue: "overdue_under_90",
  overdue_90: "overdue_over_90",
  void: "void",
  uncollectible: "uncollectible",
};

function ActivityTimeline({
  items,
}: {
  items: { id: string; time: string; text: string }[];
}) {
  return (
    <div className="relative flex flex-col gap-4">
      {items.length > 1 ? (
        <span
          className="absolute left-[2.5px] top-2 bottom-8 w-px bg-midnight-ink"
          aria-hidden
        />
      ) : null}
      {items.map((item) => (
        <div key={item.id} className="relative flex flex-col gap-1">
          <div className="flex items-center gap-5">
            <span className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-midnight-ink" />
            <span className="text-sm text-black">{item.time}</span>
          </div>
          <p className="pl-[26px] text-sm text-[#666666]">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

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
  } = useInvoiceActionHandler(status);
  const [showPayment, setShowPayment] = useState(false);
  const moreActions = getActionsForStatus(status);

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
                  {formatMoney(previewMeta.amount)}
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
              <ActivityTimeline items={meta.activity} />
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
        <RecordPaymentModal onClose={() => setShowPayment(false)} />
      ) : null}
      {feedbackBanner}
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
