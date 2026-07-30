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
  getInvoiceBulkActions,
  type InvoiceStatus,
} from "@/lib/invoice-actions";
import {
  getQuoteActionsForStatus,
  getQuoteBulkActions,
  type QuoteStatus,
} from "@/lib/quote-actions";
import { DirectoryFilterPanel } from "./DirectoryFilterPanel";
import {
  DirectoryFilterTags,
  FilterIconButton,
} from "./DirectoryFilterTags";
import { RowKebabMenu } from "./RowKebabMenu";
import { SendReminderModal } from "./SendReminderModal";
import { TopNav } from "./TopNav";
import { CreatePlusIcon } from "./ui";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { UI_CLASS } from "@/lib/design-tokens";
import { useInvoiceActionHandler } from "./useInvoiceActionHandler";
import { useQuoteActionHandler } from "./useQuoteActionHandler";
import {
  ColumnContextMenu,
  DirectoryBulkActionBar,
  DirectoryColumnHeader,
  DirectoryColumnsSettingsButton,
  DirectoryPagination,
  DirectorySelectAllRow,
  DirectoryViewToggle,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW_STICKY,
  DIRECTORY_PAGE_SIZE,
  MoneyCell,
  DateCell,
  RowSelectCheckbox,
  SearchField,
  SortHeaderButton,
  useDirectoryColumns,
  type DirectoryColumnDef,
  type DirectoryViewMode,
} from "./directory-table";
import { DirectoryColumnsPanel } from "./DirectoryColumnsPanel";

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
  | "status"
  | "scheduledReminder";

type QuoteColumnId =
  | "number"
  | "customer"
  | "created"
  | "expiry"
  | "total"
  | "status"
  | "scheduledReminder";

const INVOICE_COLUMNS: DirectoryColumnDef<InvoiceColumnId>[] = [
  { id: "number", label: "Invoice #", minWidth: 88, defaultWidth: 100, hideable: false },
  { id: "status", label: "Status", minWidth: 96, defaultWidth: 120 },
  { id: "customer", label: "Customer Name", minWidth: 120, defaultWidth: 220 },
  { id: "issued", label: "Issued", minWidth: 88, defaultWidth: 110 },
  { id: "due", label: "Due", minWidth: 88, defaultWidth: 110 },
  { id: "total", label: "Total", minWidth: 88, defaultWidth: 110 },
  { id: "paid", label: "Paid", minWidth: 80, defaultWidth: 100 },
  { id: "outstanding", label: "Outstanding", minWidth: 96, defaultWidth: 120 },
  {
    id: "scheduledReminder",
    label: "Scheduled Reminder",
    minWidth: 120,
    defaultWidth: 150,
    defaultHidden: true,
  },
];

const QUOTE_COLUMNS: DirectoryColumnDef<QuoteColumnId>[] = [
  { id: "number", label: "Quote #", minWidth: 88, defaultWidth: 100, hideable: false },
  { id: "status", label: "Status", minWidth: 96, defaultWidth: 120 },
  { id: "customer", label: "Customer Name", minWidth: 120, defaultWidth: 240 },
  { id: "created", label: "Created", minWidth: 88, defaultWidth: 110 },
  { id: "expiry", label: "Expiry", minWidth: 88, defaultWidth: 110 },
  { id: "total", label: "Total", minWidth: 88, defaultWidth: 110 },
  {
    id: "scheduledReminder",
    label: "Scheduled Reminder",
    minWidth: 120,
    defaultWidth: 150,
    defaultHidden: true,
  },
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

function CreatePrimaryDisabled({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded bg-black/10 px-5 text-sm font-semibold text-black/40"
    >
      <CreatePlusIcon className="bg-black/15 text-black/40" />
      {children}
    </button>
  );
}

function EmptyState({
  label,
  detail,
  href,
  cta,
  iconSrc,
  primaryAction,
}: {
  label: string;
  detail?: string;
  href?: string;
  cta?: string;
  iconSrc?: string;
  primaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div className="px-5 py-16 text-center">
      {iconSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          className="mx-auto mb-5 h-14 w-14 object-contain sm:h-16 sm:w-16"
        />
      ) : null}
      <p className="type-headline-6 text-midnight-ink">{label}</p>
      {detail ? (
        <p className="mx-auto mt-2 max-w-md type-paragraph-1 text-black/55">
          {detail}
        </p>
      ) : null}
      {primaryAction || (href && cta) ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center px-5`}
            >
              {primaryAction.label}
            </button>
          ) : null}
          {href && cta ? (
            <CreatePrimaryLink href={href}>{cta}</CreatePrimaryLink>
          ) : null}
        </div>
      ) : null}
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
  const forceEmpty = searchParams.get("empty") === "1";

  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceDirectoryFilters>(
    () => defaultInvoiceFilters(invoiceStatusFromParam(statusParam)),
  );
  const [quoteFilters, setQuoteFilters] = useState<QuoteDirectoryFilters>(() =>
    defaultQuoteFilters(quoteStatusFromParam(statusParam)),
  );
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkReminderPreview, setBulkReminderPreview] =
    useState<CustomerInvoiceRow | null>(null);
  const [bulkToast, setBulkToast] = useState<string | null>(null);

  const isInvoices = kind === "invoices";
  const invoiceColumnDefs = useMemo(() => INVOICE_COLUMNS, []);
  const quoteColumnDefs = useMemo(() => QUOTE_COLUMNS, []);
  const invoiceColumnState = useDirectoryColumns(
    "atb-invoice-directory-columns-v5",
    invoiceColumnDefs,
    { fluid: true },
  );
  const quoteColumnState = useDirectoryColumns(
    "atb-quote-directory-columns-v5",
    quoteColumnDefs,
    { fluid: true },
  );
  const title = isInvoices ? "Invoices" : "Quotes";
  const subtitle = isInvoices
    ? "Bills you send to collect payment from customers."
    : "Estimates of proposed work — convert to an invoice when accepted.";
  const createHref = isInvoices ? "/" : "/quote";
  const createLabel = isInvoices ? "Create Invoice" : "Create Quote";
  const documentWord = isInvoices ? "invoice" : "quote";
  const filterEmptyLabel = isInvoices
    ? "No invoices match your filters."
    : "No quotes match your filters.";

  const directoryEmptyState = forceEmpty ? (
    <EmptyState
      iconSrc="/onboard-moments-icon.png"
      label={`Complete your setup to start on your first ${documentWord}!`}
      primaryAction={{
        label: "Finish Set Up",
        onClick: () => router.push("/onboarding?start=wizard"),
      }}
    />
  ) : (
    <EmptyState
      label={filterEmptyLabel}
      href={createHref}
      cta={createLabel}
    />
  );

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
    if (forceEmpty) return [];
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
  }, [query, invoiceFilters, forceEmpty]);

  const quotes = useMemo(() => {
    if (forceEmpty) return [];
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
  }, [query, quoteFilters, forceEmpty]);

  useEffect(() => {
    setPage(1);
  }, [query, kind, viewMode]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [kind, query, page, viewMode, invoiceFilters, quoteFilters, forceEmpty]);

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

  const visibleRowIds = useMemo(
    () =>
      (isInvoices ? pagedInvoices : pagedQuotes).map((row) => row.id),
    [isInvoices, pagedInvoices, pagedQuotes],
  );

  const allVisibleSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleRowIds.some((id) => selectedIds.has(id));

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleRowIds.forEach((id) => next.delete(id));
      } else {
        visibleRowIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleRowSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedStatuses = useMemo(() => {
    if (selectedIds.size === 0) return [] as Array<InvoiceStatus | QuoteStatus>;
    if (isInvoices) {
      return invoices
        .filter((row) => selectedIds.has(row.id))
        .map((row) => mapDirectoryInvoiceStatus(row.status));
    }
    return quotes
      .filter((row) => selectedIds.has(row.id))
      .map((row) => mapDirectoryQuoteStatus(row.status));
  }, [selectedIds, isInvoices, invoices, quotes]);

  const bulkActions = useMemo(() => {
    if (isInvoices) {
      return getInvoiceBulkActions(selectedStatuses as InvoiceStatus[]);
    }
    return getQuoteBulkActions(selectedStatuses as QuoteStatus[]);
  }, [isInvoices, selectedStatuses]);

  const selectedInvoiceRows = useMemo(
    () => invoices.filter((row) => selectedIds.has(row.id)),
    [invoices, selectedIds],
  );

  useEffect(() => {
    if (!bulkToast) return;
    const timer = window.setTimeout(() => setBulkToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [bulkToast]);

  function handleBulkAction(key: string) {
    if (key === "send_reminder" && isInvoices) {
      const preview = selectedInvoiceRows[0] ?? null;
      if (preview) setBulkReminderPreview(preview);
      return;
    }
    setBulkToast("Action completed (demo).");
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main
        className={`mx-auto max-w-[1180px] px-4 pt-10 sm:px-8 lg:pt-16 ${
          selectedIds.size > 0 ? "pb-28" : "pb-16"
        }`}
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">{title}</h1>
            <p className="mt-2 type-subtitle-1 text-black/55">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="ui-btn-secondary"
              disabled={forceEmpty}
              onClick={() => {
                if (forceEmpty) return;
                if (isInvoices) exportInvoicesCsv(invoices);
                else exportQuotesCsv(quotes);
              }}
            >
              Export CSV
            </button>
            {forceEmpty ? (
              <CreatePrimaryDisabled>{createLabel}</CreatePrimaryDisabled>
            ) : (
              <CreatePrimaryLink href={createHref}>{createLabel}</CreatePrimaryLink>
            )}
          </div>
        </div>

        {!forceEmpty ? (
          <>
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
                      ? "Search by status, customer name, invoice number..."
                      : "Search by status, customer name, quote number..."
                  }
                  label={isInvoices ? "Search invoices" : "Search quotes"}
                />
              </div>
              <FilterIconButton
                activeCount={activeFilterCount}
                onClick={() => setFilterOpen(true)}
              />
              <DirectoryColumnsSettingsButton
                onClick={() => setColumnsOpen(true)}
              />
              <DirectoryViewToggle value={viewMode} onChange={setViewMode} />
            </div>

            {viewMode === "card" &&
            (totalItems > 0 || activeTags.length > 0) ? (
              <DirectorySelectAllRow
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onChange={toggleSelectAllVisible}
                label={
                  isInvoices
                    ? "Select all visible invoices"
                    : "Select all visible quotes"
                }
                filters={
                  activeTags.length > 0 ? (
                    <DirectoryFilterTags
                      className=""
                      tags={activeTags}
                      onRemove={(id) => {
                        if (isInvoices) {
                          applyInvoiceFilters(
                            clearInvoiceFilterTag(invoiceFilters, id),
                          );
                        } else {
                          applyQuoteFilters(
                            clearQuoteFilterTag(quoteFilters, id),
                          );
                        }
                      }}
                      onClearAll={() => {
                        if (isInvoices) {
                          applyInvoiceFilters(defaultInvoiceFilters());
                        } else {
                          applyQuoteFilters(defaultQuoteFilters());
                        }
                      }}
                    />
                  ) : undefined
                }
              />
            ) : activeTags.length > 0 ? (
              <DirectoryFilterTags
                tags={activeTags}
                onRemove={(id) => {
                  if (isInvoices) {
                    applyInvoiceFilters(
                      clearInvoiceFilterTag(invoiceFilters, id),
                    );
                  } else {
                    applyQuoteFilters(clearQuoteFilterTag(quoteFilters, id));
                  }
                }}
                onClearAll={() => {
                  if (isInvoices) applyInvoiceFilters(defaultInvoiceFilters());
                  else applyQuoteFilters(defaultQuoteFilters());
                }}
              />
            ) : null}
          </>
        ) : null}

        {totalItems === 0 ? (
          <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
            {directoryEmptyState}
          </div>
        ) : viewMode === "card" ? (
          isInvoices ? (
            <InvoiceCardGrid
              rows={pagedInvoices}
              query={query}
              selectedIds={selectedIds}
              onToggleRow={toggleRowSelected}
            />
          ) : (
            <QuoteCardGrid
              rows={pagedQuotes}
              query={query}
              selectedIds={selectedIds}
              onToggleRow={toggleRowSelected}
            />
          )
        ) : (
          <div className="rounded-[10px] border border-black/10 bg-white">
            {isInvoices ? (
              <InvoiceTable
                rows={pagedInvoices}
                query={query}
                selectedIds={selectedIds}
                allVisibleSelected={allVisibleSelected}
                someVisibleSelected={someVisibleSelected}
                onToggleAll={toggleSelectAllVisible}
                onToggleRow={toggleRowSelected}
                columnState={invoiceColumnState}
              />
            ) : (
              <QuoteTable
                rows={pagedQuotes}
                query={query}
                selectedIds={selectedIds}
                allVisibleSelected={allVisibleSelected}
                someVisibleSelected={someVisibleSelected}
                onToggleAll={toggleSelectAllVisible}
                onToggleRow={toggleRowSelected}
                columnState={quoteColumnState}
              />
            )}
          </div>
        )}

        <DirectoryPagination
          page={safePage}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </main>

      {selectedIds.size > 0 ? (
        <DirectoryBulkActionBar
          count={selectedIds.size}
          actions={bulkActions}
          onClear={() => setSelectedIds(new Set())}
          onAction={handleBulkAction}
        />
      ) : null}

      {bulkReminderPreview ? (
        <SendReminderModal
          invoiceNumber={`#${bulkReminderPreview.number}`}
          customerName={customerName(bulkReminderPreview.customerId)}
          amountDue={bulkReminderPreview.balanceOutstanding}
          dueDate={bulkReminderPreview.dueDate}
          bulkCount={selectedInvoiceRows.length}
          onClose={() => setBulkReminderPreview(null)}
          onSent={(method) => {
            const count = selectedInvoiceRows.length;
            const noun = count === 1 ? "invoice" : "invoices";
            setBulkToast(
              method === "email"
                ? `Reminders emailed for ${count} ${noun}.`
                : `Reminders texted for ${count} ${noun}.`,
            );
            setBulkReminderPreview(null);
            setSelectedIds(new Set());
          }}
        />
      ) : null}

      {bulkToast ? (
        <div
          className="fixed bottom-8 left-1/2 z-[70] max-w-md -translate-x-1/2 rounded-lg bg-midnight-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
        >
          {bulkToast}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setBulkToast(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {isInvoices ? (
        <DirectoryColumnsPanel
          open={columnsOpen}
          onClose={() => setColumnsOpen(false)}
          columns={invoiceColumnState.orderedColumns}
          hiddenIds={invoiceColumnState.hiddenColumns}
          onToggle={invoiceColumnState.toggleColumnVisibility}
          onMove={invoiceColumnState.moveColumn}
        />
      ) : (
        <DirectoryColumnsPanel
          open={columnsOpen}
          onClose={() => setColumnsOpen(false)}
          columns={quoteColumnState.orderedColumns}
          hiddenIds={quoteColumnState.hiddenColumns}
          onToggle={quoteColumnState.toggleColumnVisibility}
          onMove={quoteColumnState.moveColumn}
        />
      )}

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
  selectedIds,
  onToggleRow,
}: {
  rows: CustomerInvoiceRow[];
  query: string;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((invoice) => {
        const selected = selectedIds.has(invoice.id);
        return (
          <li key={invoice.id}>
            <div
              className={`relative flex h-full flex-col gap-3 rounded-[10px] border bg-white p-5 transition ${
                selected
                  ? "border-prime-blue ring-1 ring-prime-blue"
                  : "border-black/10 hover:border-prime-blue hover:ring-1 hover:ring-prime-blue"
              }`}
            >
              <div className="flex items-start gap-3">
                <RowSelectCheckbox
                  checked={selected}
                  onChange={() => onToggleRow(invoice.id)}
                  label={`Select invoice ${invoice.number}`}
                />
                <Link
                  href={hrefForCustomerInvoice(invoice.status)}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-midnight-ink">
                        <HighlightText
                          text={`#${invoice.number}`}
                          query={query}
                        />
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
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
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
                        <MoneyCell
                          amount={invoice.amount}
                          variant="total"
                          align="left"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-black/45">Outstanding</dt>
                      <dd className="mt-0.5 font-medium">
                        <MoneyCell
                          amount={invoice.balanceOutstanding}
                          variant="outstanding"
                          align="left"
                        />
                      </dd>
                    </div>
                  </dl>
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function QuoteCardGrid({
  rows,
  query,
  selectedIds,
  onToggleRow,
}: {
  rows: CustomerQuoteRow[];
  query: string;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((quote) => {
        const selected = selectedIds.has(quote.id);
        return (
          <li key={quote.id}>
            <div
              className={`relative flex h-full flex-col gap-3 rounded-[10px] border bg-white p-5 transition ${
                selected
                  ? "border-prime-blue ring-1 ring-prime-blue"
                  : "border-black/10 hover:border-prime-blue hover:ring-1 hover:ring-prime-blue"
              }`}
            >
              <div className="flex items-start gap-3">
                <RowSelectCheckbox
                  checked={selected}
                  onChange={() => onToggleRow(quote.id)}
                  label={`Select quote ${quote.number}`}
                />
                <Link
                  href={hrefForCustomerQuote(quote.status)}
                  className="min-w-0 flex-1"
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
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
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
                        <MoneyCell
                          amount={quote.amount}
                          variant="total"
                          align="left"
                        />
                      </dd>
                    </div>
                  </dl>
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function InvoiceTable({
  rows,
  query,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAll,
  onToggleRow,
  columnState,
}: {
  rows: CustomerInvoiceRow[];
  query: string;
  selectedIds: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleAll: () => void;
  onToggleRow: (id: string) => void;
  columnState: ReturnType<typeof useDirectoryColumns<InvoiceColumnId>>;
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
  } = columnState;

  const tableGridTemplate = `40px ${gridTemplateColumns} 44px`;

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
          case "scheduledReminder":
            return (row.scheduledReminder ?? "").toLowerCase();
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
      case "scheduledReminder":
        return row.scheduledReminder ? (
          <DateCell value={row.scheduledReminder} query={query} />
        ) : null;
    }
  }

  return (
    <>
    <div className="w-full">
      <div
        className={DIRECTORY_HEADER_ROW_STICKY}
        style={{
          display: "grid",
          gridTemplateColumns: tableGridTemplate,
          gap: "1rem",
          alignItems: "center",
        }}
      >
          <div className="flex items-center">
            <RowSelectCheckbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onChange={onToggleAll}
              label="Select all visible invoices"
            />
          </div>
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
                  <div className="flex items-center">
                    <RowSelectCheckbox
                      checked={selectedIds.has(invoice.id)}
                      onChange={() => onToggleRow(invoice.id)}
                      label={`Select invoice ${invoice.number}`}
                    />
                  </div>
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
        ) : null}
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
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAll,
  onToggleRow,
  columnState,
}: {
  rows: CustomerQuoteRow[];
  query: string;
  selectedIds: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleAll: () => void;
  onToggleRow: (id: string) => void;
  columnState: ReturnType<typeof useDirectoryColumns<QuoteColumnId>>;
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
  } = columnState;

  const tableGridTemplate = `40px ${gridTemplateColumns} 44px`;

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
          case "scheduledReminder":
            return (row.scheduledReminder ?? "").toLowerCase();
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
      case "scheduledReminder":
        return row.scheduledReminder ? (
          <DateCell value={row.scheduledReminder} query={query} />
        ) : null;
    }
  }

  return (
    <>
    <div className="w-full">
      <div
        className={DIRECTORY_HEADER_ROW_STICKY}
        style={{
          display: "grid",
          gridTemplateColumns: tableGridTemplate,
          gap: "1rem",
          alignItems: "center",
        }}
      >
          <div className="flex items-center">
            <RowSelectCheckbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onChange={onToggleAll}
              label="Select all visible quotes"
            />
          </div>
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
                  <div className="flex items-center">
                    <RowSelectCheckbox
                      checked={selectedIds.has(quote.id)}
                      onChange={() => onToggleRow(quote.id)}
                      label={`Select quote ${quote.number}`}
                    />
                  </div>
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
        ) : null}
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
