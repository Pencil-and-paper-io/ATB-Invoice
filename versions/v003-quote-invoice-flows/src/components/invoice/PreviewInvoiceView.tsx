"use client";

import Link from "next/link";
import { useState } from "react";
import { getActionsForStatus } from "@/lib/invoice-actions";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { SendInvoiceModal } from "./SendInvoiceModal";
import { TopNav } from "./TopNav";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";

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
      ? "bg-prime-blue text-white hover:bg-[#0063d1]"
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

export function PreviewInvoiceView() {
  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
  } = useInvoiceActionHandler("drafted");
  const [showSendModal, setShowSendModal] = useState(false);

  // Still drafted until Send — Edit is a surface button.
  const moreActions = getActionsForStatus("drafted", ["edit"]);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-display text-[42px] font-bold leading-none tracking-tight">
            Preview Invoice
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <ActionButton href="/">Edit</ActionButton>
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
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-midnight-ink" />
                  <span className="text-sm text-black">July 3, 7:01pm</span>
                </div>
                <p className="pl-[26px] text-sm text-[#666666]">
                  Invoice was created for $353.00
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Note to Self</h2>
              <NoteToSelfSection />
            </section>
          </aside>

          <div className="flex flex-col gap-5">
            <p className="text-base font-semibold text-black">
              Below is a preview of what your customer will receive:
            </p>
            <CustomerInvoiceCard shadow="preview" />
          </div>
        </div>
      </main>
      {showSendModal ? (
        <SendInvoiceModal onClose={() => setShowSendModal(false)} />
      ) : null}
      {feedbackBanner}
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
