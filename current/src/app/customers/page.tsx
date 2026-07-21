"use client";

import Link from "next/link";
import { customers } from "@/lib/invoice-demo-data";
import { TopNav } from "@/components/invoice/TopNav";
import { UI_CLASS } from "@/lib/design-tokens";

export default function CustomersDirectoryPage() {
  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">Customers</h1>
            <p className="mt-2 type-body-muted">
              Customer directory for invoicing and quoting.
            </p>
          </div>
          <Link
            href="/customers/new"
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center justify-center px-5`}
          >
            + Create new customer
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <div className="grid grid-cols-[1.4fr_1.2fr_1fr] gap-3 border-b border-black/10 bg-black/[0.02] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black/45">
            <span>Legal name</span>
            <span>Email</span>
            <span>Phone</span>
          </div>
          <ul>
            {customers.map((customer, index) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/new?id=${customer.id}`}
                  className={`grid grid-cols-[1.4fr_1.2fr_1fr] gap-3 px-5 py-3.5 text-sm transition hover:bg-prime-blue/5 ${
                    index < customers.length - 1
                      ? "border-b border-black/10"
                      : ""
                  }`}
                >
                  <span className="font-semibold text-black">
                    {customer.name}
                  </span>
                  <span className="truncate text-black/70">{customer.email}</span>
                  <span className="text-black/70">{customer.phone}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
