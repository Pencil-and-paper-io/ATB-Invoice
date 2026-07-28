"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markQuoteAcceptedForInvoice } from "@/lib/quote-to-invoice";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { Modal } from "./ui";

export type ClientPortalVariant = "review" | "accepted" | "declined";
export type ClientPortalDocumentKind = "quote" | "invoice";

/**
 * Prototype stub for customer-facing document portals.
 * Quote: accept / decline, no payment options.
 * Invoice: payment options only (no accept / decline).
 */
export function ClientQuotePortalView({
  variant = "review",
  documentKind = "quote",
}: {
  variant?: ClientPortalVariant;
  documentKind?: ClientPortalDocumentKind;
}) {
  const router = useRouter();
  const isQuote = documentKind === "quote";
  const [showAccept, setShowAccept] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [printedName, setPrintedName] = useState("");
  const [email, setEmail] = useState("");
  const [attested, setAttested] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const canAccept =
    printedName.trim().length > 0 &&
    email.trim().includes("@") &&
    attested;

  const canDecline = declineReason.trim().length > 0;

  const title = isQuote
    ? variant === "accepted"
      ? "Quote accepted"
      : variant === "declined"
        ? "Quote declined"
        : "Review quote"
    : variant === "review"
      ? "Pay invoice"
      : "Review invoice";

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <header className="border-b border-black/10 bg-white px-4 py-4 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
          Customer {isQuote ? "quote" : "invoice"} portal · prototype stub
        </p>
        <h1 className="type-page-title mt-1">{title}</h1>
      </header>

      <main className="mx-auto max-w-[960px] px-4 py-10 sm:px-8">
        {isQuote && variant === "review" ? (
          <div className="mb-6 rounded-lg border border-prime-blue/25 bg-prime-blue/5 px-4 py-3 text-sm text-black/80">
            Secure customer link (demo). Accept creates a draft invoice for the
            business owner. Decline keeps the quote viewable without actions.
          </div>
        ) : null}

        {!isQuote && variant === "review" ? (
          <div className="mb-6 rounded-lg border border-prime-blue/25 bg-prime-blue/5 px-4 py-3 text-sm text-black/80">
            This is what your customer sees when they open a sent invoice. They
            can pay using the payment options below.
          </div>
        ) : null}

        {isQuote && variant === "accepted" ? (
          <div className="mb-6 rounded-lg border border-[#B7E0C0] bg-[#E8F7EC] px-4 py-3 text-sm text-[#1B7A3A]">
            Thank you — this quote was accepted. The business owner has a draft
            invoice ready to review.
          </div>
        ) : null}

        {isQuote && variant === "declined" ? (
          <div className="mb-6 rounded-lg border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#C62828]">
            You have rejected this quotation. The accept and decline actions are
            no longer available.
          </div>
        ) : null}

        <CustomerInvoiceCard
          shadow="sent"
          documentKind={documentKind}
          showPaymentOptions={!isQuote}
          usePortalPayments={!isQuote}
        />

        {isQuote && variant === "review" ? (
          <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-black/10 bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDecline(true)}
                className="ui-btn-secondary h-11 px-5"
              >
                Decline quote
              </button>
              <button
                type="button"
                onClick={() => setShowAccept(true)}
                className="ui-btn-primary h-11 px-5"
              >
                Accept &amp; sign
              </button>
            </div>
          </div>
        ) : null}

        {isQuote && variant === "accepted" ? (
          <div className="mt-8 flex justify-end">
            <Link href="/?from=quote" className="ui-btn-primary h-11 px-5">
              View draft invoice (owner)
            </Link>
          </div>
        ) : null}
      </main>

      {showAccept ? (
        <Modal
          title="Accept & sign quote"
          titleId="client-accept-title"
          onClose={() => setShowAccept(false)}
          confirmLabel="Sign & accept quote"
          onConfirm={() => {
            if (!canAccept) return;
            markQuoteAcceptedForInvoice();
            setShowAccept(false);
            router.push("/quote/review/accepted");
          }}
          confirmDisabled={!canAccept}
        >
          <div className="flex flex-col gap-3 text-sm">
            <label className="flex flex-col gap-1.5">
              <span className="font-medium">Printed name</span>
              <input
                className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
                value={printedName}
                onChange={(event) => setPrintedName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-medium">Email</span>
              <input
                type="email"
                className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-prime-blue"
                checked={attested}
                onChange={(event) => setAttested(event.target.checked)}
              />
              <span className="text-black/80">
                I agree that typing my name and clicking Sign &amp; Accept
                constitutes a legally binding electronic signature.
              </span>
            </label>
          </div>
        </Modal>
      ) : null}

      {showDecline ? (
        <Modal
          title="Decline quote"
          titleId="client-decline-title"
          onClose={() => setShowDecline(false)}
          confirmLabel="Confirm decline"
          onConfirm={() => {
            if (!canDecline) return;
            setShowDecline(false);
            router.push("/quote/review/declined");
          }}
          confirmDisabled={!canDecline}
          confirmDanger
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Reason for rejection</span>
            <textarea
              className="min-h-[96px] rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder="Tell us why you’re passing on this work"
            />
          </label>
        </Modal>
      ) : null}
    </div>
  );
}

/** @deprecated Use ClientQuotePortalVariant via ClientPortalVariant */
export type ClientQuotePortalVariant = ClientPortalVariant;
