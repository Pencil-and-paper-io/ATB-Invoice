"use client";

import { draftInvoice, formatMoney, previewMeta } from "@/lib/invoice-demo-data";

const COMPANY_NAME = draftInvoice.business.name;

/** Matches product notification copy for invoice sends/reminders. */
export function InvoiceNotificationPreview({
  customerName = draftInvoice.customer.name,
  companyName = COMPANY_NAME,
  invoiceNumber = previewMeta.invoiceNumber,
  amount = previewMeta.amount,
  dueDate = previewMeta.dueDate.replace(/^Due\s+/i, ""),
}: {
  customerName?: string;
  companyName?: string;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
}) {
  const amountLabel = `${formatMoney(amount)} CAD`;

  return (
    <div className="flex flex-col gap-3">
      <p>Hi {customerName},</p>
      <p>
        {companyName} has sent you invoice{" "}
        <strong>{invoiceNumber}</strong> for <strong>{amountLabel}</strong>, due{" "}
        <strong>{dueDate}</strong>.
      </p>
      <p>Payment is pending. View and pay your invoice here:</p>
    </div>
  );
}

/** Quote variant of the same notification shape. */
export function QuoteNotificationPreview({
  customerName = draftInvoice.customer.name,
  companyName = COMPANY_NAME,
  quoteNumber = "QTE - 1001",
  amount = previewMeta.amount,
  validUntil = previewMeta.dueDate.replace(/^Due\s+/i, ""),
}: {
  customerName?: string;
  companyName?: string;
  quoteNumber?: string;
  amount?: number;
  validUntil?: string;
}) {
  const amountLabel = `${formatMoney(amount)} CAD`;

  return (
    <div className="flex flex-col gap-3">
      <p>Hi {customerName},</p>
      <p>
        {companyName} has sent you quote <strong>{quoteNumber}</strong> for{" "}
        <strong>{amountLabel}</strong>, valid until <strong>{validUntil}</strong>
        .
      </p>
      <p>A response is pending. View your quote here:</p>
    </div>
  );
}
