"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { loadQuoteDetails } from "@/lib/quote-details";
import {
  getCustomerCascadeDefaults,
  loadOrganizationSettings,
  orgMissingGstHstNumber,
  type InvoicePaymentOption,
} from "@/lib/organization-settings";
import {
  eftPaymentSelected,
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
import {
  DocumentAutomationsSection,
  type DocumentAutomationsState,
} from "./DocumentAutomationsSection";
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
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { ContactBlock, SectionCard, TextLink } from "./ui";

function automationsFromCascade(): DocumentAutomationsState {
  const cascade = getCustomerCascadeDefaults();
  return {
    autoSend: cascade.autoSend,
    reminders: cascade.reminders,
    reminderDays: cascade.reminderDays,
    receipts: cascade.receipts,
  };
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
    automationsFromCascade(),
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

      const org = loadOrganizationSettings();
      setPayments(loadDocumentPayments("invoice"));
      const cascade = getCustomerCascadeDefaults(org);
      const acceptance =
        !fresh && fromQuote ? consumeQuoteAcceptance() : null;
      if (acceptance) {
        const fromAccepted = invoiceDetailsFromAcceptedQuote(acceptance);
        const next = {
          ...defaultInvoiceDetails(),
          ...fromAccepted,
          invoiceNumber:
            fromAccepted.invoiceNumber || peekNextInvoiceNumber(),
        };
        setDetails(next);
        persistInvoiceDetails(next);
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
        const next: InvoiceDetailsState = {
          ...(saved ?? defaultInvoiceDetails()),
          invoiceNumber:
            saved?.invoiceNumber?.trim() || peekNextInvoiceNumber(),
          dueDate: normalizeDueDateOption(cascade.paymentTerms),
          serviceStart: saved?.serviceStart || todayIso(),
          referenceNumber: quoteNumber || saved?.referenceNumber || "",
        };
        setDetails(next);
        persistInvoiceDetails(next);
        if (quoteNumber) setAcceptedQuoteNumber(quoteNumber);
        rememberDocumentNumber("invoice", next.invoiceNumber);
      }
      setAutomations(automationsFromCascade());
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
    isFirstInvoicePlaythrough ? ["edit", "template"] : ["edit"],
  );
  const referenceRequired = eftPaymentSelected(payments);
  const referenceMissing =
    referenceRequired && !details.referenceNumber?.trim();

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
    const taxRec = getCustomerTaxRecommendation(customer?.id ?? null);
    setDefaultTaxLabel(taxRec?.label ?? "");
    setRecommendedTaxNote(taxRec?.note ?? "");
    setAutomations(automationsFromCascade());
    if (!customer) return;
    const cascade = getCustomerCascadeDefaults();
    updateDetails({
      ...details,
      dueDate: normalizeDueDateOption(cascade.paymentTerms),
    });
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        {fromQuote ? (
          <div className="mb-5 rounded-lg border border-prime-blue/30 bg-prime-blue/5 px-4 py-3 text-sm text-black/80">
            Created from accepted quote
            {acceptedQuoteNumber ? (
              <>
                {" "}
                <span className="font-semibold">{acceptedQuoteNumber}</span>
              </>
            ) : null}
            . Reference # is set to the quote number. Review payment options and
            due date before sending.
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
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="type-page-title">Draft Invoice</h1>
          <div className="flex flex-wrap items-center gap-2.5">
            {isFirstInvoicePlaythrough ? null : <TemplatePicker />}
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            {referenceMissing ? (
              <button
                type="button"
                disabled
                className="ui-btn-primary cursor-not-allowed opacity-40"
                title="Add a reference number to use EFT"
              >
                Save and Preview
              </button>
            ) : (
              <Link href="/preview" className="ui-btn-primary">
                Save and Preview
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_331px]">
          <div className="flex flex-col gap-2.5">
            <BillToSection
              key={isFirstInvoicePlaythrough ? "fresh-bill-to" : "demo-bill-to"}
              defaultCustomer={
                isFirstInvoicePlaythrough ? null : defaultDraftCustomer
              }
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

            <PaymentOptionsSection
              payments={payments}
              onToggle={togglePayment}
              onChange={updatePayments}
            />

            <SectionCard title="Automations" className="gap-2.5">
              <DocumentAutomationsSection
                value={automations}
                onChange={setAutomations}
                documentKind="invoice"
              />
            </SectionCard>

            <SectionCard title="Note to Customer" className="gap-2.5">
              <CustomerNotesSection />
            </SectionCard>
          </div>

          <aside className="flex flex-col gap-[15px]">
            <SectionCard title="Details">
              <InvoiceDetailsPanel
                details={details}
                onChange={updateDetails}
                referenceRequired={referenceRequired}
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
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
