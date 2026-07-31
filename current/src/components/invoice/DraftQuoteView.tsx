"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { DraftComposerSteps, type DraftComposerStep } from "./DraftComposerSteps";
import {
  InvoiceDetailsCollapsedSummary,
  InvoiceDetailsPanel,
  type InvoiceDetailsState,
} from "./InvoiceDetailsPanel";
import {
  emptyLineItemsSummary,
  LineItemsCollapsedSummary,
  LineItemsSection,
  type LineItemsSummaryInfo,
} from "./LineItemsSection";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { NoteToSelfSection } from "./NoteToSelfSection";
import {
  PaymentOptionsEditor,
  type PaymentOptionsEditorHandle,
} from "./AddPaymentOptionsModal";
import { TemplatePicker } from "./TemplatePicker";
import { TopNav } from "./TopNav";
import { useQuoteActionHandler } from "./useQuoteActionHandler";
import { ContactBlock, TextLink } from "./ui";
import { getCustomerTaxRecommendation } from "@/lib/customer-profile-settings";
import {
  DocumentAutomationsEditor,
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
  const [billToCustomer, setBillToCustomer] = useState<Customer | null>(
    defaultDraftCustomer,
  );
  const [billToSkipped, setBillToSkipped] = useState(false);
  const [lineItemsSummaryInfo, setLineItemsSummaryInfo] =
    useState<LineItemsSummaryInfo>(() => emptyLineItemsSummary());
  const lineItemCount = lineItemsSummaryInfo.count;
  const paymentOptionsRef = useRef<PaymentOptionsEditorHandle>(null);

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
      setBillToCustomer(defaultDraftCustomer);
      setBillToSkipped(false);
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
    setBillToCustomer(customer);
    setBillToSkipped(false);
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

  const billToSummary = billToCustomer
    ? billToCustomer.name
    : billToSkipped
      ? "Skipped — add a customer later"
      : "Choose a customer or skip";

  const paymentSummary =
    payments
      .filter((option) => option.checked)
      .map((option) => option.label)
      .join(", ") || "No payment options selected";

  const automationsSummary = [
    automations.autoSendInvoice ? "Auto-send invoice when accepted" : null,
    automations.reminders
      ? `Reminders · ${automations.reminderDays.trim() || "3"} days`
      : null,
  ]
    .filter(Boolean)
    .join(" · ") || "No automations enabled";

  const composerSteps: DraftComposerStep[] = useMemo(
    () => [
      {
        id: "customerDetails",
        title: "Customer & details",
        summary: (
          <div className="min-w-0">
            <p className="mt-1 truncate type-paragraph-2 text-black/55">
              {billToSummary}
            </p>
            <InvoiceDetailsCollapsedSummary
              details={details}
              documentKind="quote"
            />
          </div>
        ),
        summaryLayout: "block",
        content: (
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 type-subtitle-1 text-midnight-ink">Bill to</p>
              <BillToSection
                key={billToSkipped ? "skipped-bill-to" : "demo-bill-to"}
                embedded
                defaultCustomer={billToSkipped ? null : defaultDraftCustomer}
                onCustomerChange={handleCustomerChange}
              />
            </div>
            <div>
              <p className="mb-3 type-subtitle-1 text-midnight-ink">Details</p>
              <InvoiceDetailsPanel
                documentKind="quote"
                details={details}
                onChange={updateDetails}
                inlineEdit
              />
            </div>
          </div>
        ),
      },
      {
        id: "lineItems",
        title: "Line items",
        summary: (
          <LineItemsCollapsedSummary summary={lineItemsSummaryInfo} />
        ),
        summaryLayout: "block",
        canSave: lineItemCount > 0,
        content: (
          <LineItemsSection
            taxMode={details.taxMode}
            currency={details.currency}
            defaultTaxLabel={defaultTaxLabel}
            recommendedTaxNote={recommendedTaxNote}
            onSummaryChange={setLineItemsSummaryInfo}
          />
        ),
      },
      {
        id: "customerNote",
        title: "Add Note",
        summary: "Optional message on the quote",
        content: <CustomerNotesSection documentKind="quote" />,
      },
      {
        id: "payments",
        title: "Payment options",
        summary: paymentSummary,
        content: (
          <PaymentOptionsEditor
            ref={paymentOptionsRef}
            currentPayments={payments}
            onChange={updatePayments}
          />
        ),
        onBeforeSave: () => {
          paymentOptionsRef.current?.commit();
        },
      },
      {
        id: "automations",
        title: "Automations",
        summary: automationsSummary,
        content: (
          <DocumentAutomationsEditor
            value={automations}
            onChange={updateAutomations}
            documentKind="quote"
          />
        ),
      },
      {
        id: "noteToSelf",
        title: "Note to self",
        summary: "Private notes (not shared with the customer)",
        content: <NoteToSelfSection autoOpen />,
      },
      {
        id: "style",
        title: "Style",
        summary: draftInvoice.business.name,
        content: (
          <div className="flex flex-col gap-4">
            <div className="rounded-[10px] border border-black/10 p-5 sm:p-[30px]">
              <ContactBlock {...draftInvoice.business} />
              <div className="mt-2.5">
                <TextLink>Edit Business Info</TextLink>
              </div>
            </div>
            <div className="rounded-[10px] border border-black/10 p-5 sm:p-[30px]">
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
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      billToSummary,
      billToSkipped,
      details,
      lineItemCount,
      lineItemsSummaryInfo,
      defaultTaxLabel,
      recommendedTaxNote,
      paymentSummary,
      payments,
      automations,
      automationsSummary,
    ],
  );

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <GstMissingWarning
          chargingTax={Boolean(
            defaultTaxLabel &&
              defaultTaxLabel !== "Tax Exempt" &&
              defaultTaxLabel !== "No Tax" &&
              defaultTaxLabel !== "Zero-rated - 0%",
          )}
        />
        <div className="mb-8">
          <h1 className="type-page-title">Draft Quote</h1>
        </div>

        <DraftComposerSteps steps={composerSteps} />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-2.5 lg:px-[158px]">
          <TemplatePicker />
          <MoreActionsMenu actions={moreActions} onAction={handleAction} />
          <Link href="/quote/preview" className="ui-btn-primary">
            Save and Preview
          </Link>
        </div>
      </div>

      {feedbackBanner}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
