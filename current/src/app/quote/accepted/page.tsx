"use client";

import Link from "next/link";
import { CustomerInvoiceCard } from "@/components/invoice/CustomerInvoiceCard";
import { NoteToSelfSection } from "@/components/invoice/NoteToSelfSection";
import { TopNav } from "@/components/invoice/TopNav";

/** Owner view after a quote is accepted (US2.3 / US2.9). */
export default function QuoteAcceptedPage() {
  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-8 lg:px-[158px] lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="type-page-title">Quote Accepted</h1>
          <Link href="/?from=quote" className="ui-btn-primary h-11 px-5">
            View draft invoice
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-[15px]">
            <section className="flex flex-col gap-5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Status</h2>
              <span className="inline-flex w-fit items-center rounded border border-[#B7E0C0] bg-[#E8F7EC] px-2.5 py-1.5 text-base font-semibold text-[#1B7A3A]">
                Accepted
              </span>
              <p className="text-sm text-black/70">
                A draft invoice was created from this quote. Review payment
                options and due date before sending.
              </p>
            </section>
            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-[30px]">
              <h2 className="text-base font-semibold text-black">Note to Self</h2>
              <NoteToSelfSection />
            </section>
          </aside>
          <CustomerInvoiceCard shadow="sent" documentKind="quote" />
        </div>
      </main>
    </div>
  );
}
