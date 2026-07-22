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
import { getCustomerDefaultTaxLabel } from "@/lib/customer-profile-settings";
import {
  getCustomerCascadeDefaults,
  getInvoicePaymentOptions,
  loadOrganizationSettings,
  orgMissingGstHstNumber,
  type InvoicePaymentOption,
} from "@/lib/organization-settings";
import { GST_HST_REGISTER_URL } from "@/lib/place-of-supply";
import { getActionsForStatus } from "@/lib/invoice-actions";
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
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { ContactBlock, SectionCard, TextLink } from "./ui";

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
  const [details, setDetails] = useState<InvoiceDetailsState>({
    invoiceNumber: "",
    issueDate: "Send right away",
    dueDate: "Net 30",
    taxMode: "inclusive",
    currency: "CAD",
    referenceNumber: "",
    serviceStart: todayIso(),
    serviceEnd: "",
  });

  useEffect(() => {
    window.setTimeout(() => {
      const org = loadOrganizationSettings();
      setPayments(getInvoicePaymentOptions(org));
      const cascade = getCustomerCascadeDefaults(org);
      setDetails((prev) => ({
        ...prev,
        invoiceNumber: prev.invoiceNumber || peekNextInvoiceNumber(),
        dueDate: normalizeDueDateOption(cascade.paymentTerms),
        serviceStart: prev.serviceStart || todayIso(),
      }));
      setDefaultTaxLabel(
        getCustomerDefaultTaxLabel(defaultDraftCustomer?.id ?? null),
      );
    }, 0);
  }, []);

  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
  } = useInvoiceActionHandler("drafted");
  const moreActions = getActionsForStatus("drafted", ["edit", "template"]);
  const searchParams = useSearchParams();
  const fromQuote = searchParams.get("from") === "quote";

  function togglePayment(id: InvoicePaymentOption["id"]) {
    setPayments((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, checked: !option.checked } : option,
      ),
    );
  }

  function updatePayments(next: InvoicePaymentOption[]) {
    setPayments(next);
  }

  function updateDetails(next: InvoiceDetailsState) {
    setDetails(next);
    if (next.invoiceNumber.trim()) {
      rememberDocumentNumber("invoice", next.invoiceNumber);
    }
  }

  function handleCustomerChange(customer: Customer | null) {
    setDefaultTaxLabel(getCustomerDefaultTaxLabel(customer?.id ?? null));
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
            Created from an accepted quote. Review payment options and due date
            before sending.
          </div>
        ) : null}
        <GstMissingWarning chargingTax={Boolean(defaultTaxLabel)} />
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="type-page-title">Draft Invoice</h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <TemplatePicker />
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            <Link href="/preview" className="ui-btn-primary">
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
              />
            </SectionCard>

            <PaymentOptionsSection
              payments={payments}
              onToggle={togglePayment}
              onChange={updatePayments}
            />

            <SectionCard title="Note to Customer" className="gap-2.5">
              <CustomerNotesSection />
            </SectionCard>
          </div>

          <aside className="flex flex-col gap-[15px]">
            <SectionCard title="Details">
              <InvoiceDetailsPanel
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
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
    </div>
  );
}
