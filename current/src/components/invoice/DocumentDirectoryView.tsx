"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { exportInvoicesCsv, exportQuotesCsv } from "@/lib/csv-export";
import {
  clearInvoiceFilterTag,
  clearQuoteFilterTag,
  defaultInvoiceFilters,
  defaultQuoteFilters,
  invoiceFilterCount,
  invoiceFilterTags,
  matchesAmount,
  matchesInvoiceStatus,
  matchesOptionalDate,
  quoteFilterCount,
  quoteFilterTags,
  type InvoiceDirectoryFilters,
  type InvoiceStatusOption,
  type QuoteDirectoryFilters,
  type QuoteStatusOption,
} from "@/lib/directory-filters";
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
import {
  getActionsForStatus,
  type InvoiceStatus,
} from "@/lib/invoice-actions";
import {
  getQuoteActionsForStatus,
  type QuoteStatus,
} from "@/lib/quote-actions";
import { DirectoryFilterPanel } from "./DirectoryFilterPanel";
import {
  DirectoryFilterTags,
  FilterIconButton,
} from "./DirectoryFilterTags";
import { RowKebabMenu } from "./RowKebabMenu";
import { TopNav } from "./TopNav";
import { CreatePlusIcon } from "./ui";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { useQuoteActionHandler } from "./useQuoteActionHandler";
import {
  ColumnContextMenu,
  DirectoryColumnHeader,
  DirectoryPagination,
  DirectoryViewToggle,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW_STICKY,
  DIRECTORY_PAGE_SIZE,
  MoneyCell,
  DateCell,
  SearchField,
  SortHeaderButton,
  useDirectoryColumns,
  type DirectoryColumnDef,
  type DirectoryViewMode,
} from "./directory-table";
import { UI_CLASS } from "@/lib/design-tokens";

type DirectoryKind = "invoices" | "quotes";
type SortDir = "asc" | "desc";

function invoiceStatusFromParam(value: string | null): InvoiceStatusOption {
  if (!value) return "All";
  const options: InvoiceStatusOption[] = [
    "All",
    "Outstanding",
    "Draft",
    "Sent",
    "Viewed",
    "Partially Paid",
    "Paid",
    "Overdue",
    "Uncollectible",
  ];
  return (
    options.find((tab) => tab.toLowerCase() === value.toLowerCase()) ?? "All"
  );
}

function quoteStatusFromParam(value: string | null): QuoteStatusOption {
  if (!value) return "All";
  const options: QuoteStatusOption[] = [
    "All",
    "Draft",
    "Sent",
    "Viewed",
    "Accepted",
    "Rejected",
    "Expired",
  ];
  return (
    options.find((tab) => tab.toLowerCase() === value.toLowerCase()) ?? "All"
  );
}

type InvoiceColumnId =
  | "number"
  | "customer"
  | "issued"
  | "due"
  | "total"
  | "paid"
  | "outstanding"
  | "status";

type QuoteColumnId =
  | "number"
  | "customer"
  | "created"
  | "expiry"
  | "total"
  | "status";

const INVOICE_COLUMNS: DirectoryColumnDef<InvoiceColumnId>[] = [
  { id: "number", label: "Invoice #", minWidth: 88, defaultWidth: 100 },
  { id: "status", label: "Status", minWidth: 96, defaultWidth: 120 },
  { id: "customer", label: "Customer", minWidth: 120, defaultWidth: 220 },
  { id: "issued", label: "Issued", minWidth: 88, defaultWidth: 110 },
  { id: "due", label: "Due", minWidth: 88, defaultWidth: 110 },
  { id: "total", label: "Total", minWidth: 88, defaultWidth: 110 },
  { id: "paid", label: "Paid", minWidth: 80, defaultWidth: 100 },
  { id: "outstanding", label: "Outstanding", minWidth: 96, defaultWidth: 120 },
];

const QUOTE_COLUMNS: DirectoryColumnDef<QuoteColumnId>[] = [
  { id: "number", label: "Quote #", minWidth: 88, defaultWidth: 100 },
  { id: "status", label: "Status", minWidth: 96, defaultWidth: 120 },
  { id: "customer", label: "Customer", minWidth: 120, defaultWidth: 240 },
  { id: "created", label: "Created", minWidth: 88, defaultWidth: 110 },
  { id: "expiry", label: "Expiry", minWidth: 88, defaultWidth: 110 },
  { id: "total", label: "Total", minWidth: 88, defaultWidth: 110 },
];

/** Soft fill status chips (no outline). */
const STATUS_BADGE: Record<string, string> = {
  Draft: "bg-[#F3F3F3] text-[#666666]",
  Sent: "bg-[#3C6CFF]/10 text-[#3C6CFF]",
  Viewed: "bg-[#3C6CFF]/10 text-[#3C6CFF]",
  Accepted: "bg-[#E8F7EC] text-[#1B7A3A]",
  Rejected: "bg-[#FDECEC] text-[#C62828]",
  Expired: "bg-[#FDECEC] text-[#C62828]",
  "Partially Paid": "bg-[#FFF8E6] text-[#8A6A00]",
  Paid: "bg-[#E8F7EC] text-[#1B7A3A]",
  Overdue: "bg-[#FDECEC] text-[#C62828]",
  "Overdue 90+": "bg-[#FDECEC] text-[#C62828]",
  Uncollectible: "bg-[#F3F3F3] text-[#666666]",
  Void: "bg-[#F3F3F3] text-[#666666]",
};

function customerName(customerId: string) {
  return customers.find((entry) => entry.id === customerId)?.name ?? "—";
}

function invoicePaid(row: CustomerInvoiceRow) {
  return Math.max(0, row.amount - row.balanceOutstanding);
}

function mapDirectoryInvoiceStatus(status: string): InvoiceStatus {
  const key = status.trim().toLowerCase();
  if (key === "draft") return "drafted";
  if (key === "sent") return "sent";
  if (key === "viewed") return "viewed";
  if (key === "partially paid") return "partially_paid";
  if (key === "paid") return "paid";
  if (key === "overdue 90+" || key === "overdue_90") return "overdue_over_90";
  if (key.startsWith("overdue")) return "overdue_under_90";
  if (key === "uncollectible") return "uncollectible";
  if (key === "void") return "void";
  return "sent";
}

function mapDirectoryQuoteStatus(status: string): QuoteStatus {
  const key = status.trim().toLowerCase();
  if (key === "draft") return "drafted";
  if (key === "sent") return "sent";
  if (key === "viewed") return "viewed";
  if (key === "accepted") return "accepted";
  if (key === "rejected") return "rejected";
  if (key === "expired") return "expired";
  if (key === "void") return "void";
  return "sent";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const q = query.trim();
  if (!q) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-sunshine-yellow/80 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}

function StatusBadge({
  status,
  query = "",
}: {
  status: string;
  query?: string;
}) {
  const className = STATUS_BADGE[status] ?? "bg-[#F3F3F3] text-[#666666]";
  return (
    <span
      className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      <HighlightText text={status} query={query} />
    </span>
  );
}

function CreatePrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5`}
    >
      <CreatePlusIcon />
      {children}
    </Link>
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
      <div className="mt-4 flex justify-center">
        <CreatePrimaryLink href={href}>{cta}</CreatePrimaryLink>
      </div>
    </div>
  );
}

function compareValues(left: string | number, right: string | number, dir: SortDir) {
  if (left < right) return dir === "asc" ? -1 : 1;
  if (left > right) return dir === "asc" ? 1 : -1;
  return 0;
}

export function DocumentDirectoryView({ kind }: { kind: DirectoryKind }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceDirectoryFilters>(
    () => defaultInvoiceFilters(invoiceStatusFromParam(statusParam)),
  );
  const [quoteFilters, setQuoteFilters] = useState<QuoteDirectoryFilters>(() =>
    defaultQuoteFilters(quoteStatusFromParam(statusParam)),
  );
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const isInvoices = kind === "invoices";
  const title = isInvoices ? "Invoices" : "Quotes";
  const subtitle = isInvoices
    ? "Bills you send to collect payment from customers."
    : "Estimates of proposed work — convert to an invoice when accepted.";
  const createHref = isInvoices ? "/" : "/quote";
  const createLabel = isInvoices ? "Create Invoice" : "Create Quote";

  useEffect(() => {
    if (isInvoices) {
      setInvoiceFilters((prev) => ({
        ...prev,
        status: invoiceStatusFromParam(statusParam),
      }));
    } else {
      setQuoteFilters((prev) => ({
        ...prev,
        status: quoteStatusFromParam(statusParam),
      }));
    }
  }, [isInvoices, statusParam]);

  function syncStatusToUrl(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "All") params.delete("status");
    else params.set("status", next);
    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "?", { scroll: false });
  }

  function applyInvoiceFilters(next: InvoiceDirectoryFilters) {
    setInvoiceFilters(next);
    setPage(1);
    syncStatusToUrl(next.status);
  }

  function applyQuoteFilters(next: QuoteDirectoryFilters) {
    setQuoteFilters(next);
    setPage(1);
    syncStatusToUrl(next.status);
  }

  const invoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerInvoices.filter((row) => {
      if (!matchesInvoiceStatus(row, invoiceFilters.status)) return false;
      if (
        invoiceFilters.customerId &&
        row.customerId !== invoiceFilters.customerId
      ) {
        return false;
      }
      if (!matchesOptionalDate(row.dateIssued, invoiceFilters.issued)) return false;
      if (!matchesOptionalDate(row.dueDate, invoiceFilters.due)) return false;
      if (!matchesAmount(row.amount, invoiceFilters.total)) return false;
      if (!matchesAmount(row.balanceOutstanding, invoiceFilters.outstanding)) {
        return false;
      }
      if (!q) return true;
      const name = customerName(row.customerId).toLowerCase();
      return (
        row.number.toLowerCase().includes(q) ||
        name.includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.dateIssued.toLowerCase().includes(q) ||
        row.dueDate.toLowerCase().includes(q) ||
        formatMoney(row.amount).toLowerCase().includes(q) ||
        formatMoney(invoicePaid(row)).toLowerCase().includes(q) ||
        formatMoney(row.balanceOutstanding).toLowerCase().includes(q)
      );
    });
  }, [query, invoiceFilters]);

  const quotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerQuotes.filter((row) => {
      if (
        quoteFilters.status !== "All" &&
        row.status !== quoteFilters.status
      ) {
        return false;
      }
      if (
        quoteFilters.customerId &&
        row.customerId !== quoteFilters.customerId
      ) {
        return false;
      }
      if (!matchesOptionalDate(row.dateCreated, quoteFilters.created)) {
        return false;
      }
      if (!matchesOptionalDate(row.expiryDate, quoteFilters.expiry)) {
        return false;
      }
      if (!matchesAmount(row.amount, quoteFilters.total)) return false;
      if (!q) return true;
      const name = customerName(row.customerId).toLowerCase();
      return (
        row.number.toLowerCase().includes(q) ||
        name.includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.dateCreated.toLowerCase().includes(q) ||
        row.expiryDate.toLowerCase().includes(q) ||
        formatMoney(row.amount).toLowerCase().includes(q)
      );
    });
  }, [query, quoteFilters]);

  useEffect(() => {
    setPage(1);
  }, [query, kind, viewMode]);

  const totalItems = isInvoices ? invoices.length : quotes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / DIRECTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedInvoices = useMemo(() => {
    const start = (safePage - 1) * DIRECTORY_PAGE_SIZE;
    return invoices.slice(start, start + DIRECTORY_PAGE_SIZE);
  }, [invoices, safePage]);

  const pagedQuotes = useMemo(() => {
    const start = (safePage - 1) * DIRECTORY_PAGE_SIZE;
    return quotes.slice(start, start + DIRECTORY_PAGE_SIZE);
  }, [quotes, safePage]);

  const activeTags = isInvoices
    ? invoiceFilterTags(invoiceFilters, customerName)
    : quoteFilterTags(quoteFilters, customerName);
  const activeFilterCount = isInvoices
    ? invoiceFilterCount(invoiceFilters, customerName)
    : quoteFilterCount(quoteFilters, customerName);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">{title}</h1>
            <p className="mt-2 type-subtitle-1 text-black/55">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="ui-btn-secondary"
              onClick={() => {
                if (isInvoices) exportInvoicesCsv(invoices);
                else exportQuotesCsv(quotes);
              }}
            >
              Export CSV
            </button>
            <CreatePrimaryLink href={createHref}>{createLabel}</CreatePrimaryLink>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <SearchField
              id={`${kind}-search`}
              value={query}
              onChange={(next) => {
                setQuery(next);
                setPage(1);
              }}
              placeholder={
                isInvoices
                  ? "Search invoices or customers…"
                  : "Search quotes or customers…"
              }
              label={isInvoices ? "Search invoices" : "Search quotes"}
            />
          </div>
          <FilterIconButton
            activeCount={activeFilterCount}
            onClick={() => setFilterOpen(true)}
          />
          <DirectoryViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        <DirectoryFilterTags
          tags={activeTags}
          onRemove={(id) => {
            if (isInvoices) {
              applyInvoiceFilters(clearInvoiceFilterTag(invoiceFilters, id));
            } else {
              applyQuoteFilters(clearQuoteFilterTag(quoteFilters, id));
            }
          }}
          onClearAll={() => {
            if (isInvoices) applyInvoiceFilters(defaultInvoiceFilters());
            else applyQuoteFilters(defaultQuoteFilters());
          }}
        />

        {viewMode === "card" ? (
          isInvoices ? (
            <InvoiceCardGrid rows={pagedInvoices} query={query} />
          ) : (
            <QuoteCardGrid rows={pagedQuotes} query={query} />
          )
        ) : (
          <div className="rounded-[10px] border border-black/10 bg-white">
            {isInvoices ? (
              <InvoiceTable rows={pagedInvoices} query={query} />
            ) : (
              <QuoteTable rows={pagedQuotes} query={query} />
            )}
          </div>
        )}

        <DirectoryPagination
          page={safePage}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </main>

      <DirectoryFilterPanel
        kind={kind}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        invoiceFilters={invoiceFilters}
        quoteFilters={quoteFilters}
        onApplyInvoice={applyInvoiceFilters}
        onApplyQuote={applyQuoteFilters}
      />
    </div>
  );
}

function InvoiceCardGrid({
  rows,
  query,
}: {
  rows: CustomerInvoiceRow[];
  query: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
        <EmptyState
          label="No invoices match your filters."
          href="/"
          cta="Create Invoice"
        />
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((invoice) => (
        <li key={invoice.id}>
          <Link
            href={hrefForCustomerInvoice(invoice.status)}
            className="flex h-full flex-col gap-3 rounded-[10px] border border-black/10 bg-white p-5 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-midnight-ink">
                  <HighlightText text={`#${invoice.number}`} query={query} />
                </p>
                <p className="mt-1 truncate text-sm text-black/60">
                  <HighlightText
                    text={customerName(invoice.customerId)}
                    query={query}
                  />
                </p>
              </div>
              <StatusBadge status={invoice.status} query={query} />
            </div>
            <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-black/45">Issued</dt>
                <dd className="mt-0.5 text-black/75">
                  <DateCell value={invoice.dateIssued} query={query} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-black/45">Due</dt>
                <dd className="mt-0.5 text-black/75">
                  <DateCell value={invoice.dueDate} query={query} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-black/45">Total</dt>
                <dd className="mt-0.5 font-medium">
                  <MoneyCell amount={invoice.amount} variant="total" />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-black/45">Outstanding</dt>
                <dd className="mt-0.5 font-medium">
                  <MoneyCell
                    amount={invoice.balanceOutstanding}
                    variant="outstanding"
                  />
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QuoteCardGrid({
  rows,
  query,
}: {
  rows: CustomerQuoteRow[];
  query: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
        <EmptyState
          label="No quotes match your filters."
          href="/quote"
          cta="Create Quote"
        />
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((quote) => (
        <li key={quote.id}>
          <Link
            href={hrefForCustomerQuote(quote.status)}
            className="flex h-full flex-col gap-3 rounded-[10px] border border-black/10 bg-white p-5 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-midnight-ink">
                  <HighlightText text={quote.number} query={query} />
                </p>
                <p className="mt-1 truncate text-sm text-black/60">
                  <HighlightText
                    text={customerName(quote.customerId)}
                    query={query}
                  />
                </p>
              </div>
              <StatusBadge status={quote.status} query={query} />
            </div>
            <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-black/45">Created</dt>
                <dd className="mt-0.5 text-black/75">
                  <DateCell value={quote.dateCreated} query={query} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-black/45">Expiry</dt>
                <dd className="mt-0.5 text-black/75">
                  <DateCell value={quote.expiryDate} query={query} />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-black/45">Total</dt>
                <dd className="mt-0.5 font-medium">
                  <MoneyCell amount={quote.amount} variant="total" />
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function InvoiceTable({
  rows,
  query,
}: {
  rows: CustomerInvoiceRow[];
  query: string;
}) {
  const [sortKey, setSortKey] = useState<InvoiceColumnId>("number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const {
    handleAction,
    feedbackBanner,
    uncollectibleModal,
    confirmModal,
    downloadModal,
    receiptModal,
    reminderModal,
    sendModal,
  } = useInvoiceActionHandler("sent");

  const columns = useMemo(() => INVOICE_COLUMNS, []);
  const {
    visibleColumns,
    gridTemplateColumns,
    contextMenu,
    setContextMenu,
    onHeaderDragStart,
    onHeaderDrop,
    startResize,
    hideColumn,
    showColumn,
    showAllColumns,
    hiddenHideable,
  } = useDirectoryColumns("atb-invoice-directory-columns-v3", columns, {
    fluid: true,
  });

  const tableGridTemplate = `${gridTemplateColumns} 44px`;

  useDismissOnOutsideClick(
    contextMenuRef,
    () => setContextMenu(null),
    Boolean(contextMenu),
  );

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const sortValue = (row: CustomerInvoiceRow): string | number => {
        switch (sortKey) {
          case "number":
            return row.number.toLowerCase();
          case "customer":
            return customerName(row.customerId).toLowerCase();
          case "issued":
            return row.dateIssued.toLowerCase();
          case "due":
            return row.dueDate.toLowerCase();
          case "total":
            return row.amount;
          case "paid":
            return invoicePaid(row);
          case "outstanding":
            return row.balanceOutstanding;
          case "status":
            return row.status.toLowerCase();
        }
      };
      const cmp = compareValues(sortValue(a), sortValue(b), sortDir);
      if (cmp !== 0) return cmp;
      return a.number.localeCompare(b.number);
    });
  }, [rows, sortDir, sortKey]);

  function toggleSort(key: InvoiceColumnId) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function renderCell(row: CustomerInvoiceRow, columnId: InvoiceColumnId) {
    switch (columnId) {
      case "number":
        return (
          <HighlightText text={row.number} query={query} className="font-medium" />
        );
      case "customer":
        return (
          <HighlightText
            text={customerName(row.customerId)}
            query={query}
            className="block truncate"
          />
        );
      case "issued":
        return <DateCell value={row.dateIssued} query={query} />;
      case "due":
        return <DateCell value={row.dueDate} query={query} />;
      case "total":
        return <MoneyCell amount={row.amount} variant="total" query={query} />;
      case "paid":
        return (
          <MoneyCell amount={invoicePaid(row)} variant="paid" query={query} />
        );
      case "outstanding":
        return (
          <MoneyCell
            amount={row.balanceOutstanding}
            variant="outstanding"
            query={query}
          />
        );
      case "status":
        return <StatusBadge status={row.status} query={query} />;
    }
  }

  return (
    <>
    <div className="w-full">
      <div
        className={DIRECTORY_HEADER_ROW_STICKY}
        style={{ display: "grid", gridTemplateColumns: tableGridTemplate, gap: "1rem" }}
      >
          {visibleColumns.map((column, index) => (
            <DirectoryColumnHeader
              key={column.id}
              label={column.label}
              isLast={false}
              onDragStart={() => onHeaderDragStart(column.id)}
              onDrop={() => onHeaderDrop(column.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  columnId: column.id,
                });
              }}
              onResizeStart={(clientX) => startResize(column.id, clientX)}
            >
              <SortHeaderButton
                label={column.label}
                active={sortKey === column.id}
                dir={sortDir}
                onClick={() => toggleSort(column.id)}
                align={
                  column.id === "total" ||
                  column.id === "paid" ||
                  column.id === "outstanding"
                    ? "right"
                    : "left"
                }
              />
            </DirectoryColumnHeader>
          ))}
          <div className="flex items-center justify-end pr-1" aria-hidden>
            <span className="sr-only">Actions</span>
          </div>
      </div>

        {sortedRows.length > 0 ? (
          <ul>
            {sortedRows.map((invoice, index) => {
              const actionStatus = mapDirectoryInvoiceStatus(invoice.status);
              const actions = getActionsForStatus(actionStatus);
              return (
              <li key={invoice.id}>
                <div
                  className={`${DIRECTORY_BODY_ROW} ${
                    index < sortedRows.length - 1 ? "border-b border-black/10" : ""
                  }`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: tableGridTemplate,
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  {visibleColumns.map((column) => (
                    <Link
                      key={column.id}
                      href={hrefForCustomerInvoice(invoice.status)}
                      className="min-w-0 overflow-hidden"
                    >
                      {renderCell(invoice, column.id)}
                    </Link>
                  ))}
                  <RowKebabMenu
                    label={`Actions for invoice ${invoice.number}`}
                    actions={actions}
                    onAction={(key) => handleAction(key, actionStatus)}
                  />
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            label="No invoices match your filters."
            href="/"
            cta="Create Invoice"
          />
        )}
    </div>

      <ColumnContextMenu
        menuRef={contextMenuRef}
        contextMenu={contextMenu}
        columnLabel={
          INVOICE_COLUMNS.find((c) => c.id === contextMenu?.columnId)?.label ??
          ""
        }
        canHide={Boolean(
          contextMenu &&
            INVOICE_COLUMNS.find((c) => c.id === contextMenu.columnId)
              ?.hideable !== false,
        )}
        hiddenHideable={hiddenHideable}
        onHide={() => contextMenu && hideColumn(contextMenu.columnId)}
        onShow={(id) => showColumn(id as InvoiceColumnId)}
        onShowAll={showAllColumns}
        onClose={() => setContextMenu(null)}
      />
      {feedbackBanner}
      {uncollectibleModal}
      {confirmModal}
      {downloadModal}
      {receiptModal}
      {reminderModal}
      {sendModal}
  </>
  );
}

function QuoteTable({
  rows,
  query,
}: {
  rows: CustomerQuoteRow[];
  query: string;
}) {
  const [sortKey, setSortKey] = useState<QuoteColumnId>("number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const {
    handleAction,
    feedbackBanner,
    confirmModal,
    downloadModal,
    sendModal,
  } = useQuoteActionHandler("sent");

  const columns = useMemo(() => QUOTE_COLUMNS, []);
  const {
    visibleColumns,
    gridTemplateColumns,
    contextMenu,
    setContextMenu,
    onHeaderDragStart,
    onHeaderDrop,
    startResize,
    hideColumn,
    showColumn,
    showAllColumns,
    hiddenHideable,
  } = useDirectoryColumns("atb-quote-directory-columns-v3", columns, {
    fluid: true,
  });

  const tableGridTemplate = `${gridTemplateColumns} 44px`;

  useDismissOnOutsideClick(
    contextMenuRef,
    () => setContextMenu(null),
    Boolean(contextMenu),
  );

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const sortValue = (row: CustomerQuoteRow): string | number => {
        switch (sortKey) {
          case "number":
            return row.number.toLowerCase();
          case "customer":
            return customerName(row.customerId).toLowerCase();
          case "created":
            return row.dateCreated.toLowerCase();
          case "expiry":
            return row.expiryDate.toLowerCase();
          case "total":
            return row.amount;
          case "status":
            return row.status.toLowerCase();
        }
      };
      const cmp = compareValues(sortValue(a), sortValue(b), sortDir);
      if (cmp !== 0) return cmp;
      return a.number.localeCompare(b.number);
    });
  }, [rows, sortDir, sortKey]);

  function toggleSort(key: QuoteColumnId) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function renderCell(row: CustomerQuoteRow, columnId: QuoteColumnId) {
    switch (columnId) {
      case "number":
        return (
          <HighlightText text={row.number} query={query} className="font-medium" />
        );
      case "customer":
        return (
          <HighlightText
            text={customerName(row.customerId)}
            query={query}
            className="block truncate"
          />
        );
      case "created":
        return <DateCell value={row.dateCreated} query={query} />;
      case "expiry":
        return <DateCell value={row.expiryDate} query={query} />;
      case "total":
        return <MoneyCell amount={row.amount} variant="total" query={query} />;
      case "status":
        return <StatusBadge status={row.status} query={query} />;
    }
  }

  return (
    <>
    <div className="w-full">
      <div
        className={DIRECTORY_HEADER_ROW_STICKY}
        style={{ display: "grid", gridTemplateColumns: tableGridTemplate, gap: "1rem" }}
      >
          {visibleColumns.map((column) => (
            <DirectoryColumnHeader
              key={column.id}
              label={column.label}
              isLast={false}
              onDragStart={() => onHeaderDragStart(column.id)}
              onDrop={() => onHeaderDrop(column.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  columnId: column.id,
                });
              }}
              onResizeStart={(clientX) => startResize(column.id, clientX)}
            >
              <SortHeaderButton
                label={column.label}
                active={sortKey === column.id}
                dir={sortDir}
                onClick={() => toggleSort(column.id)}
                align={column.id === "total" ? "right" : "left"}
              />
            </DirectoryColumnHeader>
          ))}
          <div className="flex items-center justify-end pr-1" aria-hidden>
            <span className="sr-only">Actions</span>
          </div>
      </div>

        {sortedRows.length > 0 ? (
          <ul>
            {sortedRows.map((quote, index) => {
              const actionStatus = mapDirectoryQuoteStatus(quote.status);
              const actions = getQuoteActionsForStatus(actionStatus);
              return (
              <li key={quote.id}>
                <div
                  className={`${DIRECTORY_BODY_ROW} ${
                    index < sortedRows.length - 1 ? "border-b border-black/10" : ""
                  }`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: tableGridTemplate,
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  {visibleColumns.map((column) => (
                    <Link
                      key={column.id}
                      href={hrefForCustomerQuote(quote.status)}
                      className="min-w-0 overflow-hidden"
                    >
                      {renderCell(quote, column.id)}
                    </Link>
                  ))}
                  <RowKebabMenu
                    label={`Actions for quote ${quote.number}`}
                    actions={actions}
                    onAction={(key) => handleAction(key, actionStatus)}
                  />
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            label="No quotes match your filters."
            href="/quote"
            cta="Create Quote"
          />
        )}
    </div>

      <ColumnContextMenu
        menuRef={contextMenuRef}
        contextMenu={contextMenu}
        columnLabel={
          QUOTE_COLUMNS.find((c) => c.id === contextMenu?.columnId)?.label ?? ""
        }
        canHide={Boolean(
          contextMenu &&
            QUOTE_COLUMNS.find((c) => c.id === contextMenu.columnId)
              ?.hideable !== false,
        )}
        hiddenHideable={hiddenHideable}
        onHide={() => contextMenu && hideColumn(contextMenu.columnId)}
        onShow={(id) => showColumn(id as QuoteColumnId)}
        onShowAll={showAllColumns}
        onClose={() => setContextMenu(null)}
      />
      {feedbackBanner}
      {confirmModal}
      {downloadModal}
      {sendModal}
    </>
  );
}
