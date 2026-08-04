"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getActionsForStatus } from "@/lib/invoice-actions";
import { loadSelfNotes } from "@/lib/invoice-self-notes";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import {
  FullscreenDetailCards,
  type FullscreenDetailCard,
} from "./FullscreenDetailCards";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { PreviewDocumentActivity } from "./PreviewInvoiceActivity";
import { SendInvoiceModal } from "./SendInvoiceModal";
import { TopNav } from "./TopNav";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { useIsDesktopLg } from "./useIsDesktopLg";

function ActionButton({
  children,
  variant = "secondary",
  href,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "secondary" | "primary";
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const base =
    "inline-flex h-11 items-center justify-center rounded px-5 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-prime-blue text-white hover:bg-prime-blue-hover"
      : "border border-midnight-ink text-midnight-ink hover:bg-black/5 rounded-[5px]";

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`.trim()}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${styles} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

function DraftBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded border border-[#CCCCCC] bg-[#EEEEEE] px-2.5 py-1.5 text-sm font-semibold text-[#666666] sm:text-base ${className}`}
    >
      Draft
    </span>
  );
}

function truncateSummary(text: string, max = 80) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function PreviewInvoiceView() {
  const isDesktop = useIsDesktopLg();
  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
    sendModal,
  } = useInvoiceActionHandler("drafted");
  const [showSendModal, setShowSendModal] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selfNoteSummary, setSelfNoteSummary] = useState(
    "Add a private note",
  );

  // Still drafted until Send — Edit is a surface button.
  const moreActions = getActionsForStatus("drafted", ["edit"]);

  useEffect(() => {
    window.setTimeout(() => {
      const body = loadSelfNotes()[0]?.body?.trim() ?? "";
      setSelfNoteSummary(body ? truncateSummary(body) : "Add a private note");
    }, 0);
  }, []);

  const metaCards: FullscreenDetailCard[] = useMemo(
    () => [
      {
        id: "activity",
        title: "Activity",
        summary: "Invoice was created",
        canSave: false,
        content: <PreviewDocumentActivity documentKind="invoice" />,
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
    [selfNoteSummary],
  );

  function renderActions(menuPlacement: "top" | "bottom" = "bottom") {
    return (
      <>
        <ActionButton href="/">Edit</ActionButton>
        <MoreActionsMenu
          actions={moreActions}
          onAction={handleAction}
          placement={menuPlacement}
        />
        <ActionButton variant="primary" onClick={() => setShowSendModal(true)}>
          Send
        </ActionButton>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-10 sm:px-8 lg:px-[158px] lg:pb-24 lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="type-page-title">Preview Invoice</h1>
            <DraftBadge className="lg:hidden" />
          </div>
          <div className="hidden flex-wrap items-center gap-2.5 lg:flex">
            {renderActions()}
          </div>
        </div>

        {isDesktop === false ? (
          <div className="mb-5">
            <FullscreenDetailCards
              listLabel="Invoice details"
              cards={metaCards}
              onActiveChange={setPanelOpen}
            />
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          {isDesktop ? (
            <aside className="flex flex-col gap-[15px]">
              <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
                <h2 className="text-base font-semibold text-black">Status</h2>
                <DraftBadge />
              </section>

              <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
                <h2 className="text-base font-semibold text-black">Activity</h2>
                <PreviewDocumentActivity documentKind="invoice" />
              </section>

              <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
                <h2 className="text-base font-semibold text-black">
                  Note to Self
                </h2>
                <NoteToSelfSection />
              </section>
            </aside>
          ) : null}

          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-sunshine-yellow/60 bg-sunshine-yellow/35 px-4 py-4 sm:px-5">
              <p className="text-base font-semibold leading-snug text-midnight-ink sm:text-lg">
                Below is what your customer will see:
              </p>
              <p className="mt-2 text-sm leading-relaxed text-midnight-ink sm:text-base">
                Once you send this invoice, you will not be able to edit it
                further. Your customer will be able to view your invoice details
                and pay online using the payment options shown below.
              </p>
            </div>
            <CustomerInvoiceCard shadow="preview" />
          </div>
        </div>
      </main>

      {!panelOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-8 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-2.5">
            {renderActions("top")}
          </div>
        </div>
      ) : null}

      {showSendModal ? (
        <SendInvoiceModal onClose={() => setShowSendModal(false)} />
      ) : null}
      {feedbackBanner}
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
      {sendModal}
    </div>
  );
}
