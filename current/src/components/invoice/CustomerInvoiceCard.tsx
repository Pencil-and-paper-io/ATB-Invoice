"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  draftInvoice,
  formatMoney,
  previewMeta,
} from "@/lib/invoice-demo-data";
import {
  formatQuoteDate,
  loadQuoteDetails,
} from "@/lib/quote-details";
import type { InvoiceDetailsState } from "./InvoiceDetailsPanel";

function DashedDivider() {
  return <div className="h-px w-full border-t-2 border-dashed border-brand-orange" />;
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-30">
      <path
        d="M3.5 2.5h2l1 3-1.5 1a8 8 0 0 0 4.5 4.5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A10.5 10.5 0 0 1 2 4A1.5 1.5 0 0 1 3.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-30">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="m2.5 4.5 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PartyBlock({
  label,
  name,
  address,
  phone,
  email,
}: {
  label: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2.5">
      <p className="text-sm text-black/40">{label}</p>
      <div>
        <p className="text-base font-bold text-black">{name}</p>
        <p className="text-sm text-black">{address}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 text-sm text-black">
          <PhoneIcon />
          <span>{phone}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-black">
          <MailIcon />
          <span>{email}</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceLineItem({
  name,
  description,
  unitPrice,
  qty,
  total,
  badges,
}: {
  name: string;
  description: string;
  unitPrice: number;
  qty: number;
  total: number;
  badges: { label: string }[];
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[10px] border border-black/10 px-[30px] py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-[30px]">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-black">{name}</p>
          <p className="mt-2.5 text-sm text-black">{description}</p>
        </div>
        <div className="grid grid-cols-3 gap-[30px] text-right">
          <div className="w-[65px]">
            <p className="text-sm text-black/40">Unit Price</p>
            <p className="mt-2.5 text-sm text-black">{formatMoney(unitPrice)}</p>
          </div>
          <div className="w-[65px]">
            <p className="text-sm text-black/40">Qty</p>
            <p className="mt-2.5 text-sm text-black">{qty}</p>
          </div>
          <div className="w-[65px]">
            <p className="text-sm text-black/40">Total</p>
            <p className="mt-2.5 text-sm text-black">{formatMoney(total)}</p>
          </div>
        </div>
      </div>
      {badges.length ? (
        <div className="flex flex-wrap gap-5">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="rounded bg-midnight-ink/10 px-1.5 text-sm font-semibold text-midnight-ink/80"
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-10 items-center justify-end gap-5 px-[30px]">
      <span className="text-base text-black">{label}</span>
      <span className="w-40 text-right text-base font-semibold text-black">
        {value}
      </span>
    </div>
  );
}

export function CustomerInvoiceCard({
  shadow = "preview",
  documentKind = "invoice",
  showDraftWatermark = false,
  isExpired = false,
}: {
  shadow?: "preview" | "sent";
  documentKind?: "invoice" | "quote";
  showDraftWatermark?: boolean;
  isExpired?: boolean;
}) {
  const [quoteDetails, setQuoteDetails] = useState<InvoiceDetailsState | null>(
    null,
  );

  useEffect(() => {
    if (documentKind !== "quote") return;
    const loaded = loadQuoteDetails();
    window.setTimeout(() => setQuoteDetails(loaded), 0);
  }, [documentKind]);

  const money = formatMoney(draftInvoice.totals.subtotal);
  const shadowClass =
    shadow === "sent"
      ? "shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)]"
      : "shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]";
  const documentNumber =
    documentKind === "quote"
      ? `QT - ${quoteDetails?.invoiceNumber ?? "0003"}`
      : previewMeta.invoiceNumber;
  const showPayment = documentKind === "invoice";

  const validUntilValue = quoteDetails?.validUntil
    ? formatQuoteDate(quoteDetails.validUntil)
    : isExpired
      ? "June 30, 2026"
      : null;

  const quoteDates: {
    label: string;
    value: string;
    expired?: boolean;
  }[] =
    documentKind === "quote"
      ? [
          validUntilValue
            ? {
                label: "Valid until",
                value: validUntilValue,
                expired: isExpired,
              }
            : null,
          quoteDetails?.serviceStart
            ? {
                label: "Service start",
                value: formatQuoteDate(quoteDetails.serviceStart),
              }
            : null,
          quoteDetails?.serviceEnd
            ? {
                label: "Service end",
                value: formatQuoteDate(quoteDetails.serviceEnd),
              }
            : null,
        ].filter(
          (
            entry,
          ): entry is { label: string; value: string; expired?: boolean } =>
            Boolean(entry),
        )
      : [];

  return (
    <div
      className={`relative flex flex-col gap-5 overflow-hidden border-y-8 border-brand-orange bg-white px-6 py-[50px] sm:px-10 ${shadowClass}`}
    >
      {showDraftWatermark ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <span className="select-none -rotate-[35deg] border-[6px] border-black/20 px-8 py-2 font-display text-[72px] font-bold leading-none tracking-[0.2em] text-black/20 sm:text-[96px]">
            DRAFT
          </span>
        </div>
      ) : null}
      <div className="flex flex-col items-start gap-5 px-4 sm:flex-row sm:items-center sm:gap-5 sm:px-[30px]">
        <div className="flex w-[295px] max-w-full flex-col gap-2.5">
          <Image
            src="/brand/company-style.png"
            alt="Company logo"
            width={160}
            height={100}
            className="h-[100px] w-[160px] rounded object-cover"
          />
          <p className="type-doc-id">
            {documentNumber}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 rounded-md border-2 border-brand-orange/50 p-10 sm:w-[312px]">
          <p className="type-amount">
            {formatMoney(previewMeta.amount)}
          </p>
          <div>
            {documentKind === "quote" ? (
              <>
                <p className="text-base font-bold text-black">
                  Quote for{" "}
                  {quoteDetails?.issueDate
                    ? formatQuoteDate(quoteDetails.issueDate)
                    : "July 5, 2028"}
                </p>
                {quoteDates.map((entry) =>
                  entry.expired ? (
                    <div
                      key={entry.label}
                      className="mt-1 flex flex-wrap items-center gap-2"
                    >
                      <p className="text-sm font-semibold text-delete-red">
                        {entry.label}: {entry.value}
                      </p>
                      <span className="inline-flex items-center rounded border border-[#F5C2C0] bg-[#FDECEC] px-1.5 py-0.5 text-xs font-semibold text-[#C62828]">
                        Expired
                      </span>
                    </div>
                  ) : (
                    <p key={entry.label} className="text-sm text-black">
                      {entry.label}: {entry.value}
                    </p>
                  ),
                )}
              </>
            ) : (
              <>
                <p className="text-base font-bold text-black">
                  {previewMeta.dueDate}
                </p>
                <p className="text-sm text-black">{previewMeta.issuedDate}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 sm:flex-row sm:px-[30px]">
        <PartyBlock label="From" {...draftInvoice.business} />
        <PartyBlock label="Billed To" {...draftInvoice.customer} />
      </div>

      <DashedDivider />

      <div className="flex flex-col gap-5">
        {draftInvoice.lineItems.map((item) => (
          <InvoiceLineItem key={item.id} {...item} />
        ))}
      </div>

      <div className="flex flex-col">
        <SummaryRow label="Subtotal" value={money} />
        <SummaryRow label="Item Discount" value={money} />
        <SummaryRow label="Tax (GST)" value={money} />
        <SummaryRow label="Tax (PST)" value={money} />
      </div>

      <DashedDivider />

      <div className="flex items-center justify-end gap-2.5 px-4 sm:px-[30px]">
        <div className="text-right">
          <p className="text-base font-bold text-black">Total</p>
          <p className="text-sm text-black/40">(Tax exclusive)</p>
        </div>
        <p className="w-[180px] text-right type-amount">
          {formatMoney(previewMeta.amount)}
        </p>
      </div>

      <DashedDivider />

      {showPayment ? (
        <div className="flex flex-col gap-5 px-4 sm:px-[30px]">
          <p className="text-base font-bold text-black">Payment Options</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-black">Pay by e-transfer</span>
            <button
              type="button"
              className="ui-btn-primary"
            >
              E-Transfer
            </button>
          </div>
        </div>
      ) : null}

      {draftInvoice.customerNotes.map((note) => (
        <div key={note.id} className="flex flex-col gap-5 px-4 sm:px-[30px]">
          <div>
            <p className="text-base font-bold text-black">{note.title}</p>
            <p className="mt-2.5 text-sm leading-5 text-black">{note.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
