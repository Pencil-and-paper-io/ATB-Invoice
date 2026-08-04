"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { computeInvoiceTotals } from "@/lib/alberta-tax";
import {
  draftInvoice,
  formatMoney,
  previewMeta,
} from "@/lib/invoice-demo-data";
import {
  customerPortalPaymentOptions,
  eftCustomerReferenceNote,
  loadDocumentPayments,
} from "@/lib/draft-document-payments";
import { loadInvoiceDetails } from "@/lib/invoice-details";
import { loadOrganizationSettings } from "@/lib/organization-settings";
import type { InvoicePaymentOption } from "@/lib/organization-settings";
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
  gstHstNumber,
}: {
  label: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstHstNumber?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2.5">
      <p className="text-sm text-black/40">{label}</p>
      <div>
        <p className="text-base font-bold text-black">{name}</p>
        <p className="text-sm text-black">{address}</p>
        {gstHstNumber ? (
          <p className="mt-1 text-sm text-black">
            GST/HST #: {gstHstNumber}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 text-sm text-black">
          <PhoneIcon />
          <span>{phone}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-black">
          <MailIcon />
          <span className="min-w-0 break-words">{email}</span>
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
    <div className="flex flex-col gap-4 rounded-[10px] border border-black/10 px-4 py-4 sm:gap-5 sm:px-[30px] sm:py-5">
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:gap-[30px]">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-black">{name}</p>
          <p className="mt-2.5 text-sm text-black">{description}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right sm:gap-[30px]">
          <div className="min-w-0 sm:w-[65px]">
            <p className="text-sm text-black/40">Unit Price</p>
            <p className="mt-2.5 break-words text-sm text-black">
              {formatMoney(unitPrice)}
            </p>
          </div>
          <div className="min-w-0 sm:w-[65px]">
            <p className="text-sm text-black/40">Qty</p>
            <p className="mt-2.5 text-sm text-black">{qty}</p>
          </div>
          <div className="min-w-0 sm:w-[65px]">
            <p className="text-sm text-black/40">Total</p>
            <p className="mt-2.5 break-words text-sm text-black">
              {formatMoney(total)}
            </p>
          </div>
        </div>
      </div>
      {badges.length ? (
        <div className="flex flex-wrap gap-2 sm:gap-5">
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
    <div className="flex h-10 items-center justify-end gap-3 px-4 sm:gap-5 sm:px-[30px]">
      <span className="text-base text-black">{label}</span>
      <span className="w-28 shrink-0 text-right text-base font-semibold text-black sm:w-40">
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
  showPaymentOptions,
  usePortalPayments = false,
}: {
  shadow?: "preview" | "sent";
  documentKind?: "invoice" | "quote";
  showDraftWatermark?: boolean;
  isExpired?: boolean;
  /** Override payment block visibility (quotes in portal hide; invoices show). */
  showPaymentOptions?: boolean;
  /** Force Interac + EFT options (customer pay-invoice demo). */
  usePortalPayments?: boolean;
}) {
  const [quoteDetails, setQuoteDetails] = useState<InvoiceDetailsState | null>(
    null,
  );
  const [invoiceDetails, setInvoiceDetails] =
    useState<InvoiceDetailsState | null>(null);
  const [gstHstNumber, setGstHstNumber] = useState("");
  const [paymentOptions, setPaymentOptions] = useState<InvoicePaymentOption[]>(
    [],
  );

  useEffect(() => {
    window.setTimeout(() => {
      if (documentKind === "quote") {
        setQuoteDetails(loadQuoteDetails());
      } else {
        setInvoiceDetails(loadInvoiceDetails());
      }
      setPaymentOptions(
        usePortalPayments
          ? customerPortalPaymentOptions()
          : loadDocumentPayments(documentKind).filter(
              (option) => option.checked,
            ),
      );
      const org = loadOrganizationSettings();
      setGstHstNumber(
        org.gstRegistrationStatus === "registered" && org.gstHstNumber.trim()
          ? org.gstHstNumber.trim()
          : "",
      );
    }, 0);
  }, [documentKind, usePortalPayments]);

  const previewTotals = useMemo(
    () =>
      computeInvoiceTotals(
        draftInvoice.lineItems.map((item) => ({
          unitPrice: item.unitPrice,
          qty: item.qty,
          discount: item.discount,
          discountType: "fixed" as const,
          total: item.total,
          taxBadges: item.badges,
        })),
        "exclusive",
      ),
    [],
  );

  const money = formatMoney(draftInvoice.totals.subtotal);
  const shadowClass =
    shadow === "sent"
      ? "shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)]"
      : "shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]";
  const documentNumber =
    documentKind === "quote"
      ? `QT - ${quoteDetails?.invoiceNumber ?? "0003"}`
      : invoiceDetails?.invoiceNumber?.trim()
        ? invoiceDetails.invoiceNumber.trim()
        : previewMeta.invoiceNumber;
  const invoiceNumberForEft =
    documentKind === "invoice"
      ? invoiceDetails?.invoiceNumber?.trim() ||
        previewMeta.invoiceNumber.replace(/\s+/g, " ")
      : documentNumber;
  const eftNote = eftCustomerReferenceNote(invoiceNumberForEft);
  const showPayment =
    showPaymentOptions === false ? false : paymentOptions.length > 0;

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
      className={`relative flex flex-col gap-5 overflow-hidden border-y-8 border-brand-orange bg-white px-3 py-8 sm:px-6 sm:py-[50px] lg:px-10 ${shadowClass}`}
    >
      {showDraftWatermark ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-hidden
        >
          <span className="select-none -rotate-[35deg] border-[6px] border-black/20 px-8 py-2 font-display text-[56px] font-bold leading-none tracking-[0.2em] text-black/20 sm:text-[72px] md:text-[96px]">
            DRAFT
          </span>
        </div>
      ) : null}
      <div className="flex flex-col items-start gap-5 px-3 sm:flex-row sm:items-center sm:gap-5 sm:px-[30px]">
        <div className="flex w-full max-w-[295px] flex-col gap-2.5">
          <Image
            src="/brand/company-style.png"
            alt="Company logo"
            width={160}
            height={100}
            className="h-[100px] w-[160px] rounded object-cover"
          />
          <p className="type-doc-id text-[24px] leading-tight sm:text-[30px] sm:leading-[1.15]">
            {documentNumber}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 rounded-md border-2 border-brand-orange/50 p-5 sm:w-[312px] sm:p-10">
          <p className="type-amount text-[20px] sm:text-[24px]">
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

      <div className="flex flex-col gap-5 px-3 py-5 sm:flex-row sm:px-[30px]">
        <PartyBlock
          label="From"
          {...draftInvoice.business}
          gstHstNumber={gstHstNumber}
        />
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
        <SummaryRow
          label={`Tax (${previewTotals.federalTaxLabel})`}
          value={money}
        />
        {previewTotals.pst > 0 ? (
          <SummaryRow label="Tax (PST)" value={money} />
        ) : null}
      </div>

      <DashedDivider />

      <div className="flex min-w-0 items-center justify-end gap-2.5 px-3 sm:px-[30px]">
        <div className="min-w-0 text-right">
          <p className="text-base font-bold text-black">Total</p>
          <p className="text-sm text-black/40">(Tax exclusive)</p>
        </div>
        <p className="w-[140px] shrink-0 text-right type-amount text-[20px] sm:w-[180px] sm:text-[24px]">
          {formatMoney(previewMeta.amount)}
        </p>
      </div>

      {draftInvoice.customerNotes.map((note) => (
        <div key={note.id} className="flex flex-col gap-5 px-3 sm:px-[30px]">
          <div>
            <p className="text-base font-bold text-black">{note.title}</p>
            <p className="mt-2.5 text-sm leading-5 text-black">{note.body}</p>
          </div>
        </div>
      ))}

      {showPayment ? (
        <div className="flex flex-col gap-5 px-3 sm:px-[30px]">
          <p className="text-base font-bold text-black">Payment Options</p>
          <div className="flex flex-col gap-4">
            {paymentOptions.map((option) => {
              return (
                <div
                  key={option.id}
                  className="flex flex-col gap-1.5 rounded-[10px] border border-black/10 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-black">
                    {option.label}
                  </p>
                  {option.id === "interac" ? (
                    <div>
                      <button type="button" className="ui-btn-primary">
                        E-Transfer
                      </button>
                    </div>
                  ) : null}
                  {option.id === "eft" ? (
                    <div className="flex flex-col gap-2.5">
                      <button type="button" className="ui-btn-primary w-fit">
                        Email me direct deposit info
                      </button>
                      {eftNote ? (
                        <div className="rounded-lg border border-sunshine-yellow/60 bg-sunshine-yellow/35 px-3.5 py-3 text-sm leading-5 text-midnight-ink">
                          {eftNote}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
