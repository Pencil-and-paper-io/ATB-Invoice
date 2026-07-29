"use client";

import Link from "next/link";
import { useState } from "react";
import { getQuoteActionsForStatus } from "@/lib/quote-actions";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { PreviewDocumentActivity } from "./PreviewInvoiceActivity";
import { SendQuoteModal } from "./SendQuoteModal";
import { TopNav } from "./TopNav";
import { useQuoteActionHandler } from "./useQuoteActionHandler";

function ActionButton({
  children,
  variant = "secondary",
  href,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "secondary" | "primary";
  href?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex h-11 items-center justify-center rounded px-5 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-prime-blue text-white hover:bg-prime-blue-hover"
      : "border border-midnight-ink text-midnight-ink hover:bg-black/5 rounded-[5px]";

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles}`}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function PreviewQuoteView() {
  const { handleAction, feedbackBanner, confirmModal, downloadModal } =
    useQuoteActionHandler("drafted");
  const [showSendModal, setShowSendModal] = useState(false);
  const moreActions = getQuoteActionsForStatus("drafted", ["edit"]);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="type-page-title">
            Preview Quote
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <ActionButton href="/quote">Edit</ActionButton>
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            <ActionButton
              variant="primary"
              onClick={() => setShowSendModal(true)}
            >
              Send
            </ActionButton>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[15px]">
            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Status</h2>
              <span className="inline-flex w-fit items-center rounded border border-[#CCCCCC] bg-[#EEEEEE] px-2.5 py-1.5 text-base font-semibold text-[#666666]">
                Draft
              </span>
            </section>

            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Activity</h2>
              <PreviewDocumentActivity documentKind="quote" />
            </section>

            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Note to Self</h2>
              <NoteToSelfSection />
            </section>
          </aside>

          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-sunshine-yellow/60 bg-sunshine-yellow/35 px-4 py-4">
              <p className="type-headline-5 text-midnight-ink">
                Below is what your customer will see:
              </p>
              <p className="mt-2 type-paragraph-1 text-midnight-ink">
                Once you send this quote, you can still make adjustments until
                the customer accepts it. Payment options are hidden on quotes
                because customers can’t pay them here—they’ll appear when this
                quote becomes an invoice.
              </p>
            </div>
            <CustomerInvoiceCard
              shadow="preview"
              documentKind="quote"
              showPaymentOptions={false}
            />
          </div>
        </div>
      </main>
      {showSendModal ? (
        <SendQuoteModal onClose={() => setShowSendModal(false)} />
      ) : null}
      {feedbackBanner}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
