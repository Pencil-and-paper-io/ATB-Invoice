"use client";

import { useEffect, useState } from "react";
import { previewMeta } from "@/lib/invoice-demo-data";
import { loadQuoteDetails } from "@/lib/quote-details";
import type { DocumentKind } from "@/lib/document-automations";
import { DocumentActivityTimeline } from "./DocumentActivityTimeline";

function formatIsoAnchor(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Preview activity: created event + optional shared scheduled reminder. */
export function PreviewDocumentActivity({
  documentKind = "invoice",
}: {
  documentKind?: DocumentKind;
}) {
  const isQuote = documentKind === "quote";
  const [anchorLabel, setAnchorLabel] = useState(
    isQuote ? "August 5, 2026" : previewMeta.dueDate.replace(/^Due\s+/i, ""),
  );

  useEffect(() => {
    if (!isQuote) {
      setAnchorLabel(previewMeta.dueDate.replace(/^Due\s+/i, ""));
      return;
    }
    const validUntil = loadQuoteDetails()?.validUntil?.trim();
    if (validUntil) {
      setAnchorLabel(
        /^\d{4}-\d{2}-\d{2}$/.test(validUntil)
          ? formatIsoAnchor(validUntil)
          : validUntil,
      );
    }
  }, [documentKind, isQuote]);

  const created = {
    id: "preview-created",
    time: isQuote ? "July 3, 2026" : "July 3, 7:01pm",
    text: isQuote
      ? "Quote was created for $353.00"
      : "Invoice was created for $353.00",
  };

  return (
    <DocumentActivityTimeline
      documentKind={documentKind}
      pastItems={[created]}
      anchorLabel={anchorLabel}
    />
  );
}

/** @deprecated Prefer PreviewDocumentActivity */
export function PreviewInvoiceActivity() {
  return <PreviewDocumentActivity documentKind="invoice" />;
}
