"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getQuoteActionsForStatus,
  type QuoteStatus,
} from "@/lib/quote-actions";
import { markQuoteAcceptedForInvoice } from "@/lib/quote-to-invoice";
import {
  formatActivityNow,
  mergeQuoteActivity,
  type ActivityItem,
} from "@/lib/document-activity";
import { loadQuoteDetails } from "@/lib/quote-details";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { DocumentActivityTimeline } from "./DocumentActivityTimeline";
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

const ACTIVITY: Record<QuoteSentVariant, ActivityItem[]> = {
  awaiting: [
    {
      id: "q-link",
      time: "July 4, 4:12pm",
      text: "You sent the quote by copying a shareable URL",
      kind: "sent_link",
      // Demo: ~11m 47s left when the page loads
      linkRemainingSeconds: 11 * 60 + 47,
    },
    {
      id: "q2",
      time: "July 4, 9:01am",
      text: "You sent the quote via email",
    },
    {
      id: "q1",
      time: "July 3, 7:01pm",
      text: "Quote was created",
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
      text: "You sent the quote via email",
    },
    {
      id: "q1",
      time: "July 3, 7:01pm",
      text: "Quote was created",
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
      text: "You sent the quote via email",
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
      text: "You sent the quote via email",
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
      text: "You sent the quote via email",
    },
  ],
};

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
    <Modal
      title="Record decision"
      titleId="record-decision-title"
      onClose={onClose}
      body="Choose how the customer responded to this quote."
    >
      <div className="flex flex-col gap-2.5">
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
  const [showDecision, setShowDecision] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    mergeQuoteActivity(ACTIVITY[variant]),
  );
  const [expiryAnchor, setExpiryAnchor] = useState("August 5, 2026");
  const {
    handleAction,
    feedbackBanner,
    confirmModal,
    downloadModal,
    reminderModal,
    sendModal,
  } = useQuoteActionHandler(status, {
    anchorLabel: expiryAnchor,
    allowSendNow: true,
  });
  // Edit is a surface button when available — keep it out of More Actions.
  const moreActions = getQuoteActionsForStatus(status, [
    "edit",
    "view_history",
    "copy_link",
  ]);
  const showScheduledReminder =
    variant === "awaiting" || variant === "viewed";

  useEffect(() => {
    setActivity(mergeQuoteActivity(ACTIVITY[variant]));
  }, [variant]);

  useEffect(() => {
    const validUntil = loadQuoteDetails()?.validUntil?.trim();
    if (validUntil) {
      setExpiryAnchor(
        /^\d{4}-\d{2}-\d{2}$/.test(validUntil)
          ? new Date(`${validUntil}T12:00:00`).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : validUntil,
      );
    }
  }, []);

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
              <DocumentActivityTimeline
                documentKind="quote"
                pastItems={activity}
                onPastItemsChange={setActivity}
                anchorLabel={expiryAnchor}
                customerId="acme"
                showScheduledReminder={showScheduledReminder}
                showRevokeAllAccess={showScheduledReminder}
                allowSendNow
              />
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
            markQuoteAcceptedForInvoice(undefined, [
              {
                id: `q-accept-${Date.now()}`,
                time: formatActivityNow(),
                text: "Customer accepted the quote",
              },
              ...ACTIVITY[variant],
            ]);
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
      {reminderModal}
      {sendModal}
    </div>
  );
}
