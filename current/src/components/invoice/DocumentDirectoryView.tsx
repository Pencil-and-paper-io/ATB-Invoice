"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { exportInvoicesCsv, exportQuotesCsv } from "@/lib/csv-export";
import {
  DEFAULT_DATE_RANGE,
  dateInRange,
  type DateRangeValue,
} from "@/lib/directory-date-range";
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
import { DateRangeFilter } from "./DateRangeFilter";
import { MoreActionsMenu } from "./MoreActionsMenu";
import { TopNav } from "./TopNav";
import { CreatePlusIcon } from "./ui";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import {
  ColumnContextMenu,
  DirectoryColumnHeader,
  DirectoryToolbar,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW,
  MoneyCell,
  SearchField,
  SortHeaderButton,
  StatusToggleTabs,
  useDirectoryColumns,
  type DirectoryColumnDef,
} from "./directory-table";
import { UI_CLASS } from "@/lib/design-tokens";

type DirectoryKind = "invoices" | "quotes";
type SortDir = "asc" | "desc";

const QUOTE_STATUS_TABS = [
  "All",
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
] as const;

const INVOICE_STATUS_TABS = [
  "All",
  "Outstanding",
  "Draft",
  "Sent",
  "Viewed",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Uncollectible",
] as const;

type QuoteStatusTab = (typeof QUOTE_STATUS_TABS)[number];
type InvoiceStatusTab = (typeof INVOICE_STATUS_TABS)[number];

function invoiceTabFromParam(value: string | null): InvoiceStatusTab {
  if (!value) return "All";
  const match = INVOICE_STATUS_TABS.find(
    (tab) => tab.toLowerCase() === value.toLowerCase(),
  );
  return match ?? "All";
}

function quoteTabFromParam(value: string | null): QuoteStatusTab {
  if (!value) return "All";
  const match = QUOTE_STATUS_TABS.find(
    (tab) => tab.toLowerCase() === value.toLowerCase(),
  );
  return match ?? "All";
}

function matchesInvoiceStatus(row: CustomerInvoiceRow, tab: InvoiceStatusTab) {
  if (tab === "All") return true;
  if (tab === "Outstanding") {
    return (
      row.balanceOutstanding > 0 &&
      !/^(draft|paid|void|uncollectible)$/i.test(row.status)
    );
  }
  if (tab === "Overdue") {
    return /^overdue/i.test(row.status);
  }
  return row.status === tab;
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
  { id: "number", label: "Invoice #", minWidth: 100, defaultWidth: 120 },
  { id: "customer", label: "Customer", minWidth: 140, defaultWidth: 200 },
  { id: "issued", label: "Issued", minWidth: 100, defaultWidth: 120 },
  { id: "due", label: "Due", minWidth: 100, defaultWidth: 120 },
  { id: "total", label: "Total", minWidth: 100, defaultWidth: 120 },
  { id: "paid", label: "Paid", minWidth: 90, defaultWidth: 110 },
  { id: "outstanding", label: "Outstanding", minWidth: 110, defaultWidth: 130 },
  { id: "status", label: "Status", minWidth: 110, defaultWidth: 140 },
];

const QUOTE_COLUMNS: DirectoryColumnDef<QuoteColumnId>[] = [
  { id: "number", label: "Quote #", minWidth: 100, defaultWidth: 120 },
  { id: "customer", label: "Customer", minWidth: 140, defaultWidth: 200 },
  { id: "created", label: "Created", minWidth: 100, defaultWidth: 120 },
  { id: "expiry", label: "Expiry", minWidth: 100, defaultWidth: 120 },
  { id: "total", label: "Total", minWidth: 100, defaultWidth: 120 },
  { id: "status", label: "Status", minWidth: 110, defaultWidth: 130 },
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

  const [quoteTab, setQuoteTab] = useState<QuoteStatusTab>(() =>
    quoteTabFromParam(statusParam),
  );
  const [invoiceTab, setInvoiceTab] = useState<InvoiceStatusTab>(() =>
    invoiceTabFromParam(statusParam),
  );
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);

  const isInvoices = kind === "invoices";
  const title = isInvoices ? "Invoices" : "Quotes";
  const subtitle = isInvoices
    ? "Bills you send to collect payment from customers."
    : "Estimates of proposed work — convert to an invoice when accepted.";
  const createHref = isInvoices ? "/" : "/quote";
  const createLabel = isInvoices ? "Create Invoice" : "Create Quote";

  useEffect(() => {
    if (isInvoices) {
      setInvoiceTab(invoiceTabFromParam(statusParam));
    } else {
      setQuoteTab(quoteTabFromParam(statusParam));
    }
  }, [isInvoices, statusParam]);

  function setStatusTab(next: string) {
    if (isInvoices) {
      setInvoiceTab(next as InvoiceStatusTab);
    } else {
      setQuoteTab(next as QuoteStatusTab);
    }
    const params = new URLSearchParams(searchParams.toString());
    if (next === "All") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "?", { scroll: false });
  }

  const invoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerInvoices.filter((row) => {
      if (!matchesInvoiceStatus(row, invoiceTab)) return false;
      if (!dateInRange(row.dateIssued, dateRange)) return false;
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
  }, [query, invoiceTab, dateRange]);

  const quotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerQuotes.filter((row) => {
      if (quoteTab !== "All" && row.status !== quoteTab) return false;
      if (!dateInRange(row.dateCreated, dateRange)) return false;
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
  }, [query, quoteTab, dateRange]);

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
            <MoreActionsMenu
              actions={[{ key: "export_csv", label: "Export CSV" }]}
              onAction={(key) => {
                if (key !== "export_csv") return;
                if (isInvoices) {
                  exportInvoicesCsv(invoices);
                } else {
                  exportQuotesCsv(quotes);
                }
              }}
            />
            <CreatePrimaryLink href={createHref}>{createLabel}</CreatePrimaryLink>
          </div>
        </div>

        <DirectoryToolbar
          secondaryFilters={
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          }
          tabs={
            isInvoices ? (
              <StatusToggleTabs
                tabs={INVOICE_STATUS_TABS}
                value={invoiceTab}
                onChange={setStatusTab}
                label="Filter invoices by status"
              />
            ) : (
              <StatusToggleTabs
                tabs={QUOTE_STATUS_TABS}
                value={quoteTab}
                onChange={setStatusTab}
                label="Filter quotes by status"
              />
            )
          }
        >
          <SearchField
            id={`${kind}-search`}
            value={query}
            onChange={setQuery}
            placeholder={
              isInvoices
                ? "Search invoices or customers…"
                : "Search quotes or customers…"
            }
            label={isInvoices ? "Search invoices" : "Search quotes"}
          />
        </DirectoryToolbar>

        <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
          {isInvoices ? (
            <InvoiceTable rows={invoices} query={query} />
          ) : (
            <QuoteTable rows={quotes} query={query} />
          )}
        </div>
      </main>
    </div>
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

  const columns = useMemo(() => INVOICE_COLUMNS, []);
  const {
    visibleColumns,
    gridTemplateColumns,
    columnWidths,
    contextMenu,
    setContextMenu,
    onHeaderDragStart,
    onHeaderDrop,
    startResize,
    hideColumn,
    showColumn,
    showAllColumns,
    hiddenHideable,
  } = useDirectoryColumns("atb-invoice-directory-columns", columns);

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
            className="truncate"
          />
        );
      case "issued":
        return <HighlightText text={row.dateIssued} query={query} />;
      case "due":
        return <HighlightText text={row.dueDate} query={query} />;
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
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div
          className={DIRECTORY_HEADER_ROW}
          style={{ display: "grid", gridTemplateColumns, gap: "1rem" }}
        >
          {visibleColumns.map((column, index) => (
            <DirectoryColumnHeader
              key={column.id}
              label={column.label}
              isLast={index === visibleColumns.length - 1}
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
              />
            </DirectoryColumnHeader>
          ))}
        </div>

        {sortedRows.length > 0 ? (
          <ul>
            {sortedRows.map((invoice, index) => (
              <li key={invoice.id}>
                <Link
                  href={hrefForCustomerInvoice(invoice.status)}
                  className={`${DIRECTORY_BODY_ROW} ${
                    index < sortedRows.length - 1 ? "border-b border-black/10" : ""
                  }`}
                  style={{
                    display: "grid",
                    gridTemplateColumns,
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  {visibleColumns.map((column) => (
                    <div
                      key={column.id}
                      style={{
                        width: columnWidths[column.id] ?? column.defaultWidth,
                        minWidth: 0,
                      }}
                    >
                      {renderCell(invoice, column.id)}
                    </div>
                  ))}
                </Link>
              </li>
            ))}
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
    </div>
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

  const columns = useMemo(() => QUOTE_COLUMNS, []);
  const {
    visibleColumns,
    gridTemplateColumns,
    columnWidths,
    contextMenu,
    setContextMenu,
    onHeaderDragStart,
    onHeaderDrop,
    startResize,
    hideColumn,
    showColumn,
    showAllColumns,
    hiddenHideable,
  } = useDirectoryColumns("atb-quote-directory-columns", columns);

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
            className="truncate"
          />
        );
      case "created":
        return <HighlightText text={row.dateCreated} query={query} />;
      case "expiry":
        return <HighlightText text={row.expiryDate} query={query} />;
      case "total":
        return <MoneyCell amount={row.amount} variant="total" query={query} />;
      case "status":
        return <StatusBadge status={row.status} query={query} />;
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div
          className={DIRECTORY_HEADER_ROW}
          style={{ display: "grid", gridTemplateColumns, gap: "1rem" }}
        >
          {visibleColumns.map((column, index) => (
            <DirectoryColumnHeader
              key={column.id}
              label={column.label}
              isLast={index === visibleColumns.length - 1}
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
              />
            </DirectoryColumnHeader>
          ))}
        </div>

        {sortedRows.length > 0 ? (
          <ul>
            {sortedRows.map((quote, index) => (
              <li key={quote.id}>
                <Link
                  href={hrefForCustomerQuote(quote.status)}
                  className={`${DIRECTORY_BODY_ROW} ${
                    index < sortedRows.length - 1 ? "border-b border-black/10" : ""
                  }`}
                  style={{
                    display: "grid",
                    gridTemplateColumns,
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  {visibleColumns.map((column) => (
                    <div
                      key={column.id}
                      style={{
                        width: columnWidths[column.id] ?? column.defaultWidth,
                        minWidth: 0,
                      }}
                    >
                      {renderCell(quote, column.id)}
                    </div>
                  ))}
                </Link>
              </li>
            ))}
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
    </div>
  );
}
