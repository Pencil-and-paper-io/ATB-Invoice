"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getQuoteActionsForStatus,
  type QuoteStatus,
} from "@/lib/quote-actions";
import { markQuoteAcceptedForInvoice } from "@/lib/quote-to-invoice";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { TopNav } from "./TopNav";
import { useQuoteActionHandler } from "./useQuoteActionHandler";
import { Modal } from "./ui";

export type QuoteSentVariant =
  | "awaiting"
  | "viewed"
  | "rejected"
  | "expired"
  | "void";

const VARIANT_STATUS: Record<QuoteSentVariant, QuoteStatus> = {
  awaiting: "sent",
  viewed: "viewed",
  rejected: "rejected",
  expired: "expired",
  void: "void",
};

const VARIANT_META: Record<
  QuoteSentVariant,
  {
    title: string;
    badge: { label: string; className: string };
    showDecision: boolean;
    showEdit: boolean;
  }
> = {
  awaiting: {
    title: "Quote Sent",
    badge: {
      label: "Awaiting Decision",
      className: "border-[#CCCCCC] bg-[#3C6CFF]/10 text-[#3C6CFF]",
    },
    showDecision: true,
    showEdit: true,
  },
  viewed: {
    title: "Quote Viewed",
    badge: {
      label: "Viewed",
      className: "border-[#CCCCCC] bg-[#3C6CFF]/10 text-[#3C6CFF]",
    },
    showDecision: true,
    showEdit: true,
  },
  rejected: {
    title: "Quote Rejected",
    badge: {
      label: "Rejected",
      className: "border-[#F5C2C0] bg-[#FDECEC] text-[#C62828]",
    },
    showDecision: false,
    showEdit: false,
  },
  expired: {
    title: "Quote Expired",
    badge: {
      label: "Expired",
      className: "border-[#F5C2C0] bg-[#FDECEC] text-[#C62828]",
    },
    showDecision: false,
    showEdit: true,
  },
  void: {
    title: "Quote Void",
    badge: {
      label: "Void",
      className: "border-[#CCCCCC] bg-[#EEEEEE] text-[#666666]",
    },
    showDecision: false,
    showEdit: false,
  },
};

const ACTIVITY: Record<
  QuoteSentVariant,
  { id: string; time: string; text: string }[]
> = {
  awaiting: [
    {
      id: "q2",
      time: "July 4, 9:01am",
      text: "You sent the quote totalling $3,555.99 via email",
    },
    {
      id: "q1",
      time: "July 3, 7:01pm",
      text: "Quote was created for $3,555.99",
    },
  ],
  viewed: [
    {
      id: "q3",
      time: "July 4, 3:33pm",
      text: "Quote was viewed by the customer for the first time",
    },
    {
      id: "q2",
      time: "July 4, 9:01am",
      text: "You sent the quote totalling $3,555.99 via email",
    },
    {
      id: "q1",
      time: "July 3, 7:01pm",
      text: "Quote was created for $3,555.99",
    },
  ],
  rejected: [
    {
      id: "r1",
      time: "July 8, 11:20am",
      text: "Customer rejected the quote",
    },
    {
      id: "r2",
      time: "July 4, 3:33pm",
      text: "Quote was viewed by the customer for the first time",
    },
    {
      id: "r3",
      time: "July 4, 9:01am",
      text: "You sent the quote totalling $3,555.99 via email",
    },
  ],
  expired: [
    {
      id: "e1",
      time: "Aug 5, 12:00am",
      text: "Quote expired (past Valid Until)",
    },
    {
      id: "e2",
      time: "July 4, 9:01am",
      text: "You sent the quote totalling $3,555.99 via email",
    },
  ],
  void: [
    {
      id: "v1",
      time: "July 8, 10:00am",
      text: "Quote was voided",
    },
    {
      id: "v2",
      time: "July 4, 9:01am",
      text: "You sent the quote totalling $3,555.99 via email",
    },
  ],
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

function RecordDecisionModal({
  onClose,
  onAccept,
  onReject,
}: {
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Modal title="Record decision" titleId="record-decision-title" onClose={onClose}>
      <p className="type-body-muted text-center">
        Choose how the customer responded to this quote.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onAccept}
          className="rounded-lg border border-prime-blue bg-prime-blue/5 px-4 py-3.5 text-left transition hover:bg-prime-blue/10"
        >
          <span className="block text-sm font-semibold text-black">
            Quote Accepted
          </span>
          <span className="mt-0.5 block text-sm text-black/60">
            Creates a draft invoice. Add payment options and due date there.
          </span>
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg border border-black/15 bg-white px-4 py-3.5 text-left transition hover:border-black/30"
        >
          <span className="block text-sm font-semibold text-black">
            Quote Rejected
          </span>
          <span className="mt-0.5 block text-sm text-black/60">
            Marks this quote as declined. No invoice is created.
          </span>
        </button>
      </div>
    </Modal>
  );
}

export function SentQuoteView({
  variant = "awaiting",
}: {
  variant?: QuoteSentVariant;
}) {
  const router = useRouter();
  const status = VARIANT_STATUS[variant];
  const meta = VARIANT_META[variant];
  const { handleAction, feedbackBanner, confirmModal, downloadModal, sendModal } =
    useQuoteActionHandler(status);
  const [showDecision, setShowDecision] = useState(false);
  // Edit is a surface button when available — keep it out of More Actions.
  const moreActions = getQuoteActionsForStatus(status, ["edit"]);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="type-page-title">
            {meta.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            {meta.showEdit ? (
              <Link
                href="/quote"
                className="ui-btn-secondary"
              >
                Edit
              </Link>
            ) : null}
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            {meta.showDecision ? (
              <button
                type="button"
                onClick={() => setShowDecision(true)}
                className="ui-btn-primary"
              >
                Record Decision
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[15px]">
            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Status</h2>
              <span
                className={`inline-flex w-fit items-center rounded border px-2.5 py-1.5 text-base font-semibold ${meta.badge.className}`}
              >
                {meta.badge.label}
              </span>
            </section>

            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Activity</h2>
              <ActivityTimeline items={ACTIVITY[variant]} />
            </section>

            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Note to Self</h2>
              <NoteToSelfSection />
            </section>
          </aside>

          <CustomerInvoiceCard
            shadow="sent"
            documentKind="quote"
            isExpired={variant === "expired"}
          />
        </div>
      </main>

      {showDecision ? (
        <RecordDecisionModal
          onClose={() => setShowDecision(false)}
          onAccept={() => {
            setShowDecision(false);
            markQuoteAcceptedForInvoice();
            router.push("/?from=quote");
          }}
          onReject={() => {
            setShowDecision(false);
            router.push("/quote/rejected");
          }}
        />
      ) : null}
      {feedbackBanner}
      {confirmModal}
      {downloadModal}
      {sendModal}
    </div>
  );
}
