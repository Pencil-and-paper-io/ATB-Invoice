"use client";

import { getActionsForStatus } from "@/lib/invoice-actions";
import { formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { ModeBackButton } from "./ModeBackButton";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { TopNav } from "./TopNav";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";

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

export function SentInvoiceView() {
  const { handleAction, feedbackBanner, uncollectibleModal } =
    useInvoiceActionHandler("sent");

  // Sent matrix: Void, Template, Duplicate
  const moreActions = getActionsForStatus("sent");

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <ModeBackButton label="Back to preview" fallbackHref="/preview" />
            <h1 className="font-display text-[42px] font-bold leading-none tracking-tight">
              Invoice Sent
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-[#0063d1]"
            >
              Record Payment
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[15px]">
            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Amount Due</h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-2xl font-bold text-black">
                  {formatMoney(previewMeta.amount)}
                </p>
                <span className="inline-flex items-center rounded border border-[#CCCCCC] bg-[#3C6CFF]/10 px-2.5 py-1.5 text-base font-semibold text-[#3C6CFF]">
                  Due
                </span>
              </div>
            </section>

            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Activity</h2>
              <ActivityTimeline items={previewMeta.activity} />
            </section>

            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Note to Self</h2>
              <NoteToSelfSection />
            </section>
          </aside>

          <CustomerInvoiceCard shadow="sent" />
        </div>
      </main>
      {feedbackBanner}
      {uncollectibleModal}
    </div>
  );
}
