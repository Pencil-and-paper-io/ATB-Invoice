"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  customers,
  customerInvoices,
  customerQuotes,
  formatMoney,
  hrefForCustomerInvoice,
  hrefForCustomerQuote,
  type CustomerInvoiceRow,
  type CustomerQuoteRow,
} from "@/lib/invoice-demo-data";
import { TopNav } from "./TopNav";
import { UI_CLASS } from "@/lib/design-tokens";

type DirectoryKind = "invoices" | "quotes";

function customerName(customerId: string) {
  return customers.find((entry) => entry.id === customerId)?.name ?? "—";
}

function SortHeader({ label }: { label: string }) {
  return <span>{label}</span>;
}

function StatusFilter({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <select
      className="h-11 rounded-md border border-black/15 bg-white px-3 text-sm text-black outline-none focus:border-prime-blue"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filter by status"
    >
      <option value="all">All statuses</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function DocumentDirectoryView({ kind }: { kind: DirectoryKind }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const isInvoices = kind === "invoices";
  const title = isInvoices ? "Invoices" : "Quotes";
  const createHref = isInvoices ? "/" : "/quote";
  const createLabel = isInvoices ? "Create invoice" : "Create quote";

  const invoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerInvoices.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      const name = customerName(row.customerId).toLowerCase();
      return (
        row.number.toLowerCase().includes(q) ||
        name.includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const quotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerQuotes.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      const name = customerName(row.customerId).toLowerCase();
      return (
        row.number.toLowerCase().includes(q) ||
        name.includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const statusOptions = useMemo(() => {
    const rows = isInvoices ? customerInvoices : customerQuotes;
    return Array.from(new Set(rows.map((row) => row.status))).sort();
  }, [isInvoices]);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="type-page-title">{title}</h1>
          <Link href={createHref} className={`${UI_CLASS.btnPrimary} h-11 px-5`}>
            {createLabel}
          </Link>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="h-11 min-w-0 flex-1 rounded-md border border-black/15 bg-white px-3 text-sm outline-none focus:border-prime-blue"
            placeholder={
              isInvoices
                ? "Search invoices, customers, or status…"
                : "Search quotes, customers, or status…"
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <StatusFilter
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
        </div>

        <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
          {isInvoices ? (
            <InvoiceTable rows={invoices} />
          ) : (
            <QuoteTable rows={quotes} />
          )}
        </div>
      </main>
    </div>
  );
}

function InvoiceTable({ rows }: { rows: CustomerInvoiceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-[0.8fr_1.4fr_1fr_1fr_1fr_1.1fr_1fr] gap-3 border-b border-black/10 bg-cloud-grey px-5 py-3 text-xs font-semibold text-black/55">
        <SortHeader label="Invoice #" />
        <SortHeader label="Customer" />
        <SortHeader label="Issued" />
        <SortHeader label="Due" />
        <SortHeader label="Total" />
        <SortHeader label="Balance" />
        <SortHeader label="Status" />
      </div>
      {rows.length > 0 ? (
        <ul className="min-w-[760px]">
          {rows.map((invoice, index) => (
            <li key={invoice.id}>
              <Link
                href={hrefForCustomerInvoice(invoice.status)}
                className={`grid w-full grid-cols-[0.8fr_1.4fr_1fr_1fr_1fr_1.1fr_1fr] gap-3 px-5 py-3.5 text-sm text-black transition hover:bg-prime-blue/5 ${
                  index < rows.length - 1 ? "border-b border-black/10" : ""
                }`}
              >
                <span className="font-medium">{invoice.number}</span>
                <span className="truncate">
                  {customerName(invoice.customerId)}
                </span>
                <span>{invoice.dateIssued}</span>
                <span>{invoice.dueDate}</span>
                <span className="font-medium">
                  {formatMoney(invoice.amount)}
                </span>
                <span className="font-medium">
                  {formatMoney(invoice.balanceOutstanding)}
                </span>
                <span>{invoice.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          label="No invoices match your filters."
          href="/"
          cta="Create invoice"
        />
      )}
    </div>
  );
}

function QuoteTable({ rows }: { rows: CustomerQuoteRow[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-[0.9fr_1.4fr_1.1fr_1.1fr_1fr_0.9fr] gap-3 border-b border-black/10 bg-cloud-grey px-5 py-3 text-xs font-semibold text-black/55">
        <SortHeader label="Quote #" />
        <SortHeader label="Customer" />
        <SortHeader label="Created" />
        <SortHeader label="Expiry" />
        <SortHeader label="Total" />
        <SortHeader label="Status" />
      </div>
      {rows.length > 0 ? (
        <ul className="min-w-[700px]">
          {rows.map((quote, index) => (
            <li key={quote.id}>
              <Link
                href={hrefForCustomerQuote(quote.status)}
                className={`grid w-full grid-cols-[0.9fr_1.4fr_1.1fr_1.1fr_1fr_0.9fr] gap-3 px-5 py-3.5 text-sm text-black transition hover:bg-prime-blue/5 ${
                  index < rows.length - 1 ? "border-b border-black/10" : ""
                }`}
              >
                <span className="font-medium">{quote.number}</span>
                <span className="truncate">
                  {customerName(quote.customerId)}
                </span>
                <span>{quote.dateCreated}</span>
                <span>{quote.expiryDate}</span>
                <span className="font-medium">
                  {formatMoney(quote.amount)}
                </span>
                <span>{quote.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          label="No quotes match your filters."
          href="/quote"
          cta="Create quote"
        />
      )}
    </div>
  );
}

function EmptyState({
  label,
  href,
  cta,
}: {
  label: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="type-body-muted">{label}</p>
      <Link
        href={href}
        className="type-link mt-3 inline-block text-sm font-semibold text-prime-blue"
      >
        {cta}
      </Link>
    </div>
  );
}
