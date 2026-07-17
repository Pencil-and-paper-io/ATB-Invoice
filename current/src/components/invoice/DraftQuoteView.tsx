"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { draftInvoice } from "@/lib/invoice-demo-data";
import { getQuoteActionsForStatus } from "@/lib/quote-actions";
import { loadQuoteDetails, persistQuoteDetails } from "@/lib/quote-details";
import { BillToSection, defaultDraftCustomer } from "./BillToSection";
import { CustomerNotesSection } from "./CustomerNotesSection";
import {
  InvoiceDetailsPanel,
  type InvoiceDetailsState,
} from "./InvoiceDetailsPanel";
import { LineItemsSection } from "./LineItemsSection";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import { TemplatePicker } from "./TemplatePicker";
import { TopNav } from "./TopNav";
import { useQuoteActionHandler } from "./useQuoteActionHandler";
import { ContactBlock, SectionCard, TextLink } from "./ui";

export function DraftQuoteView() {
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();
  const [details, setDetails] = useState<InvoiceDetailsState>({
    invoiceNumber: "0003",
    issueDate: today,
    dueDate: "Net 30",
    taxMode: "inclusive",
    currency: "CAD",
    validUntil: "",
    serviceStart: today,
    serviceEnd: "",
  });

  useEffect(() => {
    const saved = loadQuoteDetails();
    if (saved) {
      window.setTimeout(() => setDetails(saved), 0);
    } else {
      // Seed storage so the preview reflects the defaults before any edits.
      persistQuoteDetails({
        invoiceNumber: "0003",
        issueDate: today,
        dueDate: "Net 30",
        taxMode: "inclusive",
        currency: "CAD",
        validUntil: "",
        serviceStart: today,
        serviceEnd: "",
      });
    }
  }, [today]);

  function updateDetails(next: InvoiceDetailsState) {
    setDetails(next);
    persistQuoteDetails(next);
  }

  const { handleAction, feedbackBanner, confirmModal, downloadModal } =
    useQuoteActionHandler("drafted");
  const moreActions = getQuoteActionsForStatus("drafted", ["edit", "template"]);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-display text-[42px] font-bold leading-none tracking-tight">
            Draft Quote
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <TemplatePicker />
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            <Link
              href="/quote/preview"
              className="inline-flex h-11 items-center justify-center rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-[#0063d1]"
            >
              Preview
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_331px]">
          <div className="flex flex-col gap-2.5">
            <BillToSection defaultCustomer={defaultDraftCustomer} />

            <SectionCard title="Line Items" className="gap-2.5">
              <LineItemsSection
                taxMode={details.taxMode}
                currency={details.currency}
              />
            </SectionCard>

            <SectionCard title="Note to Customer" className="gap-2.5">
              <CustomerNotesSection documentKind="quote" />
            </SectionCard>
          </div>

          <aside className="flex flex-col gap-[15px]">
            <SectionCard title="Details">
              <InvoiceDetailsPanel
                documentKind="quote"
                details={details}
                onChange={updateDetails}
              />
            </SectionCard>

            <SectionCard title="Note to Self" className="gap-2.5">
              <NoteToSelfSection />
            </SectionCard>

            <SectionCard title="Style" className="gap-2.5">
              <div className="rounded-[10px] border border-black/10 p-[30px]">
                <ContactBlock {...draftInvoice.business} />
                <div className="mt-2.5">
                  <TextLink>Edit Business Info</TextLink>
                </div>
              </div>

              <div className="rounded-[10px] border border-black/10 p-[30px]">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <p className="text-sm text-black">Company Color</p>
                    <div className="mt-2.5 flex items-center gap-2.5 text-sm text-black">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: draftInvoice.business.color }}
                      />
                      <span>{draftInvoice.business.color}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-black">Company Style</p>
                    <Image
                      src="/brand/company-style.png"
                      alt="Company style preview"
                      width={80}
                      height={50}
                      className="mt-2.5 h-[50px] w-20 rounded object-cover"
                    />
                  </div>
                </div>
                <div className="mt-2.5">
                  <TextLink>Edit Company Style</TextLink>
                </div>
              </div>
            </SectionCard>
          </aside>
        </div>
      </main>

      {feedbackBanner}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
