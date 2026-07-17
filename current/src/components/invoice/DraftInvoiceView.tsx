"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  draftInvoice,
  type PaymentOption,
} from "@/lib/invoice-demo-data";
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
import { TemplatePicker } from "./TemplatePicker";
import { TopNav } from "./TopNav";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { ContactBlock, SectionCard, TertiaryButton, TextLink } from "./ui";

function PaymentOptionRow({
  option,
  onToggle,
}: {
  option: PaymentOption;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-16 shrink-0 items-center">
        <button
          type="button"
          onClick={() => onToggle(option.id)}
          className={`flex h-5 w-5 items-center justify-center rounded-[3px] transition ${
            option.checked
              ? "border border-prime-blue bg-prime-blue"
              : "border border-black/25 bg-transparent"
          }`}
          aria-pressed={option.checked}
          aria-label={`Toggle ${option.label}`}
        >
          {option.checked ? (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
              <path
                d="M1 5.2 4.2 8.5 11 1.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>
      </div>
      <div
        className={`min-w-0 flex-1 rounded-[10px] border px-[30px] py-5 transition ${
          option.checked ? "border-midnight-ink" : "border-black/10"
        }`}
      >
        <p className="text-base font-bold leading-6 text-black">{option.label}</p>
        {option.checked && option.details?.length ? (
          <ul className="mt-2.5 list-disc space-y-1 pl-5 text-sm text-black">
            {option.details.map((detail) => (
              <li key={`${detail.label}-${detail.text}`}>
                <span className={detail.italic ? "italic" : undefined}>
                  <span className="font-bold">{detail.label}:</span>{" "}
                  {detail.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function DraftInvoiceView() {
  const [payments, setPayments] = useState<PaymentOption[]>(
    draftInvoice.paymentOptions,
  );
  const [details, setDetails] = useState<InvoiceDetailsState>({
    invoiceNumber: "3001",
    issueDate: "Send right away",
    dueDate: "Net 30",
    taxMode: "inclusive",
    currency: "CAD",
    referenceNumber: "",
    serviceStart: "",
    serviceEnd: "",
  });
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

  function togglePayment(id: string) {
    setPayments((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, checked: !option.checked } : option,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        {fromQuote ? (
          <div className="mb-5 rounded-lg border border-prime-blue/30 bg-prime-blue/5 px-4 py-3 text-sm text-black/80">
            Created from an accepted quote. Set payment options and due date
            before sending — quotes do not include those.
          </div>
        ) : null}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-display text-[42px] font-bold leading-none tracking-tight">
            Draft Invoice
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <TemplatePicker />
            <MoreActionsMenu actions={moreActions} onAction={handleAction} />
            <Link
              href="/preview"
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

            <SectionCard title="Payment Options">
              <div className="flex flex-col gap-2.5">
                {payments.map((option) => (
                  <PaymentOptionRow
                    key={option.id}
                    option={option}
                    onToggle={togglePayment}
                  />
                ))}
                <TertiaryButton>Add more payment options</TertiaryButton>
              </div>
            </SectionCard>

            <SectionCard title="Note to Customer" className="gap-2.5">
              <CustomerNotesSection />
            </SectionCard>
          </div>

          <aside className="flex flex-col gap-[15px]">
            <SectionCard title="Details">
              <InvoiceDetailsPanel details={details} onChange={setDetails} />
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
