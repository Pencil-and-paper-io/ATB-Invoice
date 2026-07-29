"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { draftInvoice, type Customer } from "@/lib/invoice-demo-data";
import {
  addDaysToIso,
  allocateNextQuoteNumber,
  normalizeDueDateOption,
  rememberDocumentNumber,
  todayIso,
} from "@/lib/document-numbers";
import {
  getCustomerCascadeDefaults,
  orgMissingGstHstNumber,
  type InvoicePaymentOption,
} from "@/lib/organization-settings";
import {
  loadDocumentPayments,
  persistDocumentPayments,
} from "@/lib/draft-document-payments";
import { GST_HST_REGISTER_URL } from "@/lib/place-of-supply";
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
import { PaymentOptionsSection } from "./PaymentOptionsSection";
import { TemplatePicker } from "./TemplatePicker";
import { TopNav } from "./TopNav";
import { useQuoteActionHandler } from "./useQuoteActionHandler";
import { ContactBlock, SectionCard, TextLink } from "./ui";
import { getCustomerTaxRecommendation } from "@/lib/customer-profile-settings";
import {
  DocumentAutomationsSection,
  type DocumentAutomationsState,
} from "./DocumentAutomationsSection";
import {
  defaultAutomationsFromCascade,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
} from "@/lib/document-automations";

function automationsFromCascade(
  customerId?: string | null,
): DocumentAutomationsState {
  return defaultAutomationsFromCascade(customerId);
}

function GstMissingWarning({ chargingTax }: { chargingTax: boolean }) {
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setMissing(chargingTax && orgMissingGstHstNumber());
  }, [chargingTax]);
  if (!missing) return null;
  return (
    <div className="mb-5 rounded-lg border border-[#E6B800]/40 bg-[#FFF8E1] px-4 py-3 text-sm text-black/80">
      You&apos;re charging GST/HST but your GST/HST number isn&apos;t on file
      yet.{" "}
      <a
        href={GST_HST_REGISTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-prime-blue underline underline-offset-2"
      >
        Register with the CRA
      </a>
      , then add the number in Organization Settings.
    </div>
  );
}

function buildQuoteDefaults(): InvoiceDetailsState {
  const today = todayIso();
  const cascade = getCustomerCascadeDefaults();
  const expiryDays = Number(cascade.quoteExpiryDays) || 45;
  return {
    invoiceNumber: allocateNextQuoteNumber(),
    issueDate: today,
    dueDate: normalizeDueDateOption(cascade.paymentTerms),
    taxMode: "inclusive",
    currency: "CAD",
    validUntil: addDaysToIso(today, expiryDays),
    serviceStart: today,
    serviceEnd: "",
  };
}

export function DraftQuoteView() {
  const [details, setDetails] = useState<InvoiceDetailsState>(() => ({
    invoiceNumber: "",
    issueDate: todayIso(),
    dueDate: "Net 30",
    taxMode: "inclusive",
    currency: "CAD",
    validUntil: "",
    serviceStart: todayIso(),
    serviceEnd: "",
  }));
  const [payments, setPayments] = useState<InvoicePaymentOption[]>([]);
  const [defaultTaxLabel, setDefaultTaxLabel] = useState("");
  const [recommendedTaxNote, setRecommendedTaxNote] = useState("");
  const [automations, setAutomations] = useState<DocumentAutomationsState>(() =>
    loadOrInitDocumentAutomations("quote"),
  );

  useEffect(() => {
    window.setTimeout(() => {
      setPayments(loadDocumentPayments("quote"));
      const cascade = getCustomerCascadeDefaults();
      const expiryDays = Number(cascade.quoteExpiryDays) || 45;
      const saved = loadQuoteDetails();
      const base = saved ?? buildQuoteDefaults();
      const quoteDate = /^\d{4}-\d{2}-\d{2}$/.test(base.issueDate)
        ? base.issueDate
        : todayIso();
      const next: InvoiceDetailsState = {
        ...base,
        dueDate: normalizeDueDateOption(cascade.paymentTerms),
        validUntil:
          base.validUntil || addDaysToIso(quoteDate, expiryDays),
        serviceStart: base.serviceStart || todayIso(),
      };
      setDetails(next);
      persistQuoteDetails(next);
      rememberDocumentNumber("quote", next.invoiceNumber);
      setAutomations(
        loadOrInitDocumentAutomations(
          "quote",
          defaultDraftCustomer?.id ?? null,
        ),
      );
      const taxRec = getCustomerTaxRecommendation(
        defaultDraftCustomer?.id ?? null,
      );
      setDefaultTaxLabel(taxRec?.label ?? "");
      setRecommendedTaxNote(taxRec?.note ?? "");
    }, 0);
  }, []);

  function updateDetails(next: InvoiceDetailsState) {
    setDetails(next);
    persistQuoteDetails(next);
    rememberDocumentNumber("quote", next.invoiceNumber);
  }

  function handleCustomerChange(customer: Customer | null) {
    const taxRec = getCustomerTaxRecommendation(customer?.id ?? null);
    setDefaultTaxLabel(taxRec?.label ?? "");
    setRecommendedTaxNote(taxRec?.note ?? "");
    const nextAutomations = automationsFromCascade(customer?.id ?? null);
    setAutomations(nextAutomations);
    persistDocumentAutomations("quote", nextAutomations);
    if (!customer) return;
    const cascade = getCustomerCascadeDefaults();
    const expiryDays = Number(cascade.quoteExpiryDays) || 45;
    const quoteDate = /^\d{4}-\d{2}-\d{2}$/.test(details.issueDate)
      ? details.issueDate
      : todayIso();
    updateDetails({
      ...details,
      dueDate: normalizeDueDateOption(cascade.paymentTerms),
      validUntil: addDaysToIso(quoteDate, expiryDays),
    });
  }

  function updateAutomations(next: DocumentAutomationsState) {
    setAutomations(next);
    persistDocumentAutomations("quote", next);
  }

  const { handleAction, feedbackBanner, confirmModal, downloadModal } =
    useQuoteActionHandler("drafted");
  const moreActions = getQuoteActionsForStatus("drafted", ["edit", "template"]);

  function togglePayment(id: InvoicePaymentOption["id"]) {
    setPayments((prev) => {
      const next = prev.map((option) =>
        option.id === id ? { ...option, checked: !option.checked } : option,
      );
      persistDocumentPayments("quote", next);
      return next;
    });
  }

  function updatePayments(next: InvoicePaymentOption[]) {
    setPayments(next);
    persistDocumentPayments("quote", next);
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <GstMissingWarning
          chargingTax={Boolean(
            defaultTaxLabel &&
              defaultTaxLabel !== "Tax Exempt" &&
              defaultTaxLabel !== "No Tax" &&
              defaultTaxLabel !== "Zero-rated - 0%",
          )}
        />
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="type-page-title">Draft Quote</h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <TemplatePicker />
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            <Link href="/quote/preview" className="ui-btn-primary">
              Save and Preview
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_331px]">
          <div className="flex flex-col gap-2.5">
            <BillToSection
              defaultCustomer={defaultDraftCustomer}
              onCustomerChange={handleCustomerChange}
            />

            <SectionCard title="Line Items" className="gap-2.5">
              <LineItemsSection
                taxMode={details.taxMode}
                currency={details.currency}
                defaultTaxLabel={defaultTaxLabel}
                recommendedTaxNote={recommendedTaxNote}
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

            <PaymentOptionsSection
              payments={payments}
              onToggle={togglePayment}
              onChange={updatePayments}
              compact
            />

            <DocumentAutomationsSection
              value={automations}
              onChange={updateAutomations}
              documentKind="quote"
            />

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
