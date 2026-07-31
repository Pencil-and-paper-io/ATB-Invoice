"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { draftInvoice, type Customer } from "@/lib/invoice-demo-data";
import {
  normalizeDueDateOption,
  peekNextInvoiceNumber,
  rememberDocumentNumber,
  todayIso,
} from "@/lib/document-numbers";
import { getCustomerTaxRecommendation } from "@/lib/customer-profile-settings";
import {
  consumeQuoteAcceptance,
  invoiceDetailsFromAcceptedQuote,
} from "@/lib/quote-to-invoice";
import { ensureQuoteTimelineForInvoice } from "@/lib/document-activity";
import { loadQuoteDetails } from "@/lib/quote-details";
import {
  getCustomerCascadeDefaults,
  loadOrganizationSettings,
  orgMissingGstHstNumber,
  type InvoicePaymentOption,
} from "@/lib/organization-settings";
import {
  loadDocumentPayments,
  persistDocumentPayments,
} from "@/lib/draft-document-payments";
import {
  defaultInvoiceDetails,
  loadInvoiceDetails,
  persistInvoiceDetails,
} from "@/lib/invoice-details";
import { GST_HST_REGISTER_URL } from "@/lib/place-of-supply";
import { getActionsForStatus } from "@/lib/invoice-actions";
import { FIRST_INVOICE_PLAYTHROUGH_KEY } from "./OnboardingCompleteModal";
import { BillToSection, defaultDraftCustomer } from "./BillToSection";
import { CustomerNotesSection } from "./CustomerNotesSection";
import { DraftComposerSteps, type DraftComposerStep } from "./DraftComposerSteps";
import {
  DocumentAutomationsEditor,
  type DocumentAutomationsState,
} from "./DocumentAutomationsSection";
import {
  defaultAutomationsFromCascade,
  loadOrInitDocumentAutomations,
  persistDocumentAutomations,
} from "@/lib/document-automations";
import {
  InvoiceDetailsCollapsedSummary,
  InvoiceDetailsPanel,
  type InvoiceDetailsState,
} from "./InvoiceDetailsPanel";
import {
  emptyLineItemsSummary,
  LineItemsCollapsedSummary,
  LineItemsSection,
  summarizeLineItems,
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
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { ContactBlock, TextLink } from "./ui";
import { DEFAULT_SELF_NOTES } from "@/lib/invoice-self-notes";
import type { CustomerNote } from "@/lib/invoice-demo-data";

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

export function DraftInvoiceView() {
  const [payments, setPayments] = useState<InvoicePaymentOption[]>([]);
  const [defaultTaxLabel, setDefaultTaxLabel] = useState("");
  const [recommendedTaxNote, setRecommendedTaxNote] = useState("");
  const [automations, setAutomations] = useState<DocumentAutomationsState>(() =>
    loadOrInitDocumentAutomations("invoice"),
  );
  const [details, setDetails] = useState<InvoiceDetailsState>(() =>
    defaultInvoiceDetails(),
  );

  const searchParams = useSearchParams();
  const fromQuote = searchParams.get("from") === "quote";
  const [isFirstInvoicePlaythrough, setIsFirstInvoicePlaythrough] = useState(
    () => searchParams.get("fresh") === "1",
  );
  const [acceptedQuoteNumber, setAcceptedQuoteNumber] = useState<string | null>(
    null,
  );
  const [billToCustomer, setBillToCustomer] = useState<Customer | null>(null);
  const [billToSkipped, setBillToSkipped] = useState(false);
  const [lineItemsSummaryInfo, setLineItemsSummaryInfo] =
    useState<LineItemsSummaryInfo>(() => emptyLineItemsSummary());
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [selfNoteSummary, setSelfNoteSummary] = useState(
    () => DEFAULT_SELF_NOTES[0]?.body ?? "",
  );
  const paymentOptionsRef = useRef<PaymentOptionsEditorHandle>(null);
  const useSampleContent = !isFirstInvoicePlaythrough;
  const lineItemCount = lineItemsSummaryInfo.count;

  useEffect(() => {
    window.setTimeout(() => {
      let fresh = searchParams.get("fresh") === "1";
      try {
        if (
          fresh ||
          window.sessionStorage.getItem(FIRST_INVOICE_PLAYTHROUGH_KEY) === "1"
        ) {
          fresh = true;
          window.sessionStorage.setItem(FIRST_INVOICE_PLAYTHROUGH_KEY, "1");
        }
      } catch {
        /* ignore */
      }
      setIsFirstInvoicePlaythrough(fresh);

      setBillToCustomer(fresh ? null : defaultDraftCustomer);
      setBillToSkipped(false);
      setCustomerNotes(fresh ? [] : [...draftInvoice.customerNotes]);
      if (!fresh) {
        setSelfNoteSummary(DEFAULT_SELF_NOTES[0]?.body ?? "");
      }

      const org = loadOrganizationSettings();
      setPayments(loadDocumentPayments("invoice"));
      const cascade = getCustomerCascadeDefaults(org);
      const acceptance =
        !fresh && fromQuote ? consumeQuoteAcceptance() : null;
      if (fromQuote && !fresh) {
        ensureQuoteTimelineForInvoice();
      }
      let nextDetails: InvoiceDetailsState;
      if (acceptance) {
        const fromAccepted = invoiceDetailsFromAcceptedQuote(acceptance);
        nextDetails = {
          ...defaultInvoiceDetails(),
          ...fromAccepted,
          invoiceNumber:
            fromAccepted.invoiceNumber || peekNextInvoiceNumber(),
        };
        setDetails(nextDetails);
        persistInvoiceDetails(nextDetails);
        setAcceptedQuoteNumber(acceptance.quoteNumber);
        if (fromAccepted.invoiceNumber.trim()) {
          rememberDocumentNumber("invoice", fromAccepted.invoiceNumber);
        }
      } else {
        const quoteNumber =
          !fresh && fromQuote
            ? loadQuoteDetails()?.invoiceNumber?.trim() || null
            : null;
        const saved = fresh ? null : loadInvoiceDetails();
        nextDetails = {
          ...(saved ?? defaultInvoiceDetails()),
          invoiceNumber:
            saved?.invoiceNumber?.trim() || peekNextInvoiceNumber(),
          dueDate: normalizeDueDateOption(cascade.paymentTerms),
          serviceStart: saved?.serviceStart || todayIso(),
          referenceNumber: quoteNumber || saved?.referenceNumber || "",
        };
        setDetails(nextDetails);
        persistInvoiceDetails(nextDetails);
        if (quoteNumber) setAcceptedQuoteNumber(quoteNumber);
        rememberDocumentNumber("invoice", nextDetails.invoiceNumber);
      }
      setLineItemsSummaryInfo(
        fresh
          ? emptyLineItemsSummary()
          : summarizeLineItems(
              draftInvoice.lineItems,
              nextDetails.taxMode,
            ),
      );
      setAutomations(
        loadOrInitDocumentAutomations(
          "invoice",
          fresh ? null : (defaultDraftCustomer?.id ?? null),
        ),
      );
      if (!fresh) {
        setAutomations((prev) => ({
          ...prev,
          autoSend: true,
          reminders: true,
          reminderDays: prev.reminderDays.trim() || "3",
          reminderChannel: prev.reminderChannel ?? "email",
        }));
      }
      const customerId = fresh ? null : (defaultDraftCustomer?.id ?? null);
      const taxRec = getCustomerTaxRecommendation(customerId);
      setDefaultTaxLabel(taxRec?.label ?? "");
      setRecommendedTaxNote(taxRec?.note ?? "");
    }, 0);
  }, [fromQuote, searchParams]);

  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
  } = useInvoiceActionHandler("drafted");
  const moreActions = getActionsForStatus(
    "drafted",
    isFirstInvoicePlaythrough
      ? ["edit", "template", "send_test"]
      : ["edit", "send_test"],
  );

  function togglePayment(id: InvoicePaymentOption["id"]) {
    setPayments((prev) => {
      const next = prev.map((option) =>
        option.id === id ? { ...option, checked: !option.checked } : option,
      );
      persistDocumentPayments("invoice", next);
      return next;
    });
  }

  function updatePayments(next: InvoicePaymentOption[]) {
    setPayments(next);
    persistDocumentPayments("invoice", next);
  }

  function updateDetails(next: InvoiceDetailsState) {
    setDetails(next);
    persistInvoiceDetails(next);
    if (next.invoiceNumber.trim()) {
      rememberDocumentNumber("invoice", next.invoiceNumber);
    }
  }

  function handleCustomerChange(customer: Customer | null) {
    setBillToCustomer(customer);
    setBillToSkipped(false);
    const taxRec = getCustomerTaxRecommendation(customer?.id ?? null);
    setDefaultTaxLabel(taxRec?.label ?? "");
    setRecommendedTaxNote(taxRec?.note ?? "");
    const nextAutomations = automationsFromCascade(customer?.id ?? null);
    setAutomations(nextAutomations);
    persistDocumentAutomations("invoice", nextAutomations);
    if (!customer) return;
    const cascade = getCustomerCascadeDefaults();
    updateDetails({
      ...details,
      dueDate: normalizeDueDateOption(cascade.paymentTerms),
    });
  }

  function updateAutomations(next: DocumentAutomationsState) {
    setAutomations(next);
    persistDocumentAutomations("invoice", next);
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
    automations.autoSend ? "Auto-send on issuance date" : null,
    automations.reminders
      ? `Reminders · ${automations.reminderDays.trim() || "3"} days before`
      : null,
  ]
    .filter(Boolean)
    .join(" · ") || "No automations enabled";

  const customerNotesSummary =
    customerNotes.length > 0
      ? `${customerNotes.length} note${customerNotes.length === 1 ? "" : "s"} · ${customerNotes
          .map((note) => note.title)
          .slice(0, 2)
          .join(", ")}${customerNotes.length > 2 ? "…" : ""}`
      : "Optional message on the invoice";

  const selfNoteListSummary = selfNoteSummary.trim()
    ? selfNoteSummary.trim().length > 80
      ? `${selfNoteSummary.trim().slice(0, 80)}…`
      : selfNoteSummary.trim()
    : "Private notes (not shared with the customer)";

  const styleSummary = (
    <div className="mt-1 flex min-w-0 flex-col gap-1">
      <p className="truncate type-paragraph-2 text-black/55">
        {draftInvoice.business.name}
      </p>
      <p className="flex items-center gap-2 type-paragraph-2 text-black/55">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: draftInvoice.business.color }}
        />
        {draftInvoice.business.color}
      </p>
    </div>
  );

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
            <InvoiceDetailsCollapsedSummary details={details} />
          </div>
        ),
        summaryLayout: "block",
        content: (
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-3 type-subtitle-1 text-midnight-ink">Bill to</p>
              <BillToSection
                key={
                  billToSkipped
                    ? "skipped-bill-to"
                    : isFirstInvoicePlaythrough
                      ? "fresh-bill-to"
                      : "demo-bill-to"
                }
                embedded
                defaultCustomer={
                  billToSkipped || isFirstInvoicePlaythrough
                    ? null
                    : defaultDraftCustomer
                }
                onCustomerChange={handleCustomerChange}
              />
            </div>
            <div>
              <p className="mb-3 type-subtitle-1 text-midnight-ink">Details</p>
              <InvoiceDetailsPanel
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
            key={useSampleContent ? "sample-lines" : "fresh-lines"}
            initialItems={useSampleContent ? draftInvoice.lineItems : []}
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
        summary: customerNotesSummary,
        content: (
          <CustomerNotesSection
            key={useSampleContent ? "sample-notes" : "fresh-notes"}
            initialNotes={useSampleContent ? draftInvoice.customerNotes : []}
            onNotesChange={setCustomerNotes}
          />
        ),
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
            documentKind="invoice"
          />
        ),
      },
      {
        id: "noteToSelf",
        title: "Note to self",
        summary: selfNoteListSummary,
        content: (
          <NoteToSelfSection
            autoOpen
            onNoteChange={(note) => setSelfNoteSummary(note?.body ?? "")}
          />
        ),
      },
      {
        id: "style",
        title: "Style",
        summary: styleSummary,
        summaryLayout: "block",
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
    // Content closures intentionally refresh with draft state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      billToSummary,
      billToSkipped,
      isFirstInvoicePlaythrough,
      useSampleContent,
      details,
      lineItemCount,
      lineItemsSummaryInfo,
      customerNotesSummary,
      defaultTaxLabel,
      recommendedTaxNote,
      paymentSummary,
      payments,
      automations,
      automationsSummary,
      selfNoteListSummary,
    ],
  );

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        {fromQuote ? (
          <div className="mb-5 rounded-lg border border-prime-blue/30 bg-prime-blue/5 px-4 py-3 text-sm text-black/80">
            Created from accepted quote
            {acceptedQuoteNumber ? (
              <>
                {" "}
                <span className="font-semibold">{acceptedQuoteNumber}</span>
              </>
            ) : null}
            . Review payment options and due date before sending.
          </div>
        ) : null}
        <GstMissingWarning
          chargingTax={Boolean(
            defaultTaxLabel &&
              defaultTaxLabel !== "Tax Exempt" &&
              defaultTaxLabel !== "No Tax" &&
              defaultTaxLabel !== "Zero-rated - 0%",
          )}
        />
        <div className="mb-8">
          <h1 className="type-page-title">Draft Invoice</h1>
        </div>

        <DraftComposerSteps steps={composerSteps} />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-2.5 lg:px-[158px]">
          {isFirstInvoicePlaythrough ? null : <TemplatePicker />}
          <MoreActionsMenu actions={moreActions} onAction={handleAction} />
          <Link href="/preview" className="ui-btn-primary">
            Save and Preview
          </Link>
        </div>
      </div>

      {feedbackBanner}
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
