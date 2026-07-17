"use client";

import { useEffect } from "react";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";
import { CloseIcon } from "./ui";

export function DownloadPdfModal({
  documentKind,
  isDraft,
  onClose,
}: {
  documentKind: "invoice" | "quote";
  isDraft: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = isDraft
    ? `Draft ${documentKind === "quote" ? "quote" : "invoice"} PDF`
    : `${documentKind === "quote" ? "Quote" : "Invoice"} PDF`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-pdf-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="download-pdf-title"
            className="type-modal-title text-white"
          >
            {title}
            {isDraft ? (
              <span className="ml-2 text-sm font-semibold text-white/70">
                — includes DRAFT watermark
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close PDF preview"
          >
            <CloseIcon />
          </button>
        </div>
        <CustomerInvoiceCard
          shadow="preview"
          documentKind={documentKind}
          showDraftWatermark={isDraft}
        />
        <p className="mt-3 text-center text-sm text-white/60">
          Demo preview of the downloaded PDF.
        </p>
      </div>
    </div>
  );
}
