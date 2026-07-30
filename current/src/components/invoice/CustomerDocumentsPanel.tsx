"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  formatMoney,
  hrefForCustomerInvoice,
  hrefForCustomerQuote,
  type CustomerInvoiceRow,
  type CustomerQuoteRow,
} from "@/lib/invoice-demo-data";
import {
  AMOUNT_PRESETS,
  DATE_RANGE_PRESETS,
  EMPTY_AMOUNT,
  matchesAmount,
  matchesOptionalDate,
  type AmountFilter,
  type FilterTag,
  type OptionalDateFilter,
} from "@/lib/directory-filters";
import {
  dateRangeLabel,
  type DateRangePreset,
  type DateRangeValue,
} from "@/lib/directory-date-range";
import {
  DateCell,
  DIRECTORY_BODY_ROW,
  DIRECTORY_CARD_CLASS,
  DIRECTORY_HEADER_ROW,
  MoneyCell,
  SearchField,
  SortHeaderButton,
} from "./directory-table";
import {
  DirectoryFilterTags,
  FilterIconButton,
} from "./DirectoryFilterTags";
import { CreatePlusIcon, EditCloseButton } from "./ui";
import { UI_CLASS } from "@/lib/design-tokens";

type DocType = "all" | "quotes" | "invoices";
type SortKey =
  | "type"
  | "number"
  | "status"
  | "date"
  | "due"
  | "total"
  | "outstanding";
type SortDir = "asc" | "desc";

type DocRow =
  | { kind: "invoice"; id: string; data: CustomerInvoiceRow }
  | { kind: "quote"; id: string; data: CustomerQuoteRow };

type CustomerDocFilters = {
  documentType: DocType;
  status: string;
  total: AmountFilter;
  date: OptionalDateFilter;
  due: OptionalDateFilter;
};

const STATUS_OPTIONS = [
  "All",
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Uncollectible",
] as const;

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

const selectClass =
  "h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm font-medium text-midnight-ink outline-none focus:border-prime-blue";

const inputClass =
  "h-11 w-full rounded-md border border-black/15 bg-input-grey px-3 text-sm text-midnight-ink outline-none focus:border-prime-blue focus:bg-white";

const GRID =
  "minmax(0,0.7fr) minmax(0,0.9fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr) minmax(0,1fr)";

function defaultFilters(): CustomerDocFilters {
  return {
    documentType: "all",
    status: "All",
    total: { ...EMPTY_AMOUNT },
    date: null,
    due: null,
  };
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
  if (!q) return <span className={className}>{text}</span>;
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

function StatusBadge({ status, query = "" }: { status: string; query?: string }) {
  const className = STATUS_BADGE[status] ?? "bg-[#F3F3F3] text-[#666666]";
  return (
    <span
      className={`inline-flex w-fit items-center rounded px-2 py-0.5 type-subtitle-2 ${className}`}
    >
      <HighlightText text={status} query={query} />
    </span>
  );
}

function compareValues(a: string | number, b: string | number, dir: SortDir) {
  const cmp = a < b ? -1 : a > b ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}

function matchesStatus(status: string, filter: string) {
  if (filter === "All") return true;
  if (filter === "Overdue") return /^overdue/i.test(status);
  return status === filter;
}

function rowDate(row: DocRow) {
  return row.kind === "invoice" ? row.data.dateIssued : row.data.dateCreated;
}

function rowDue(row: DocRow) {
  return row.kind === "invoice" ? row.data.dueDate : row.data.expiryDate;
}

function rowOutstanding(row: DocRow) {
  return row.kind === "invoice" ? row.data.balanceOutstanding : null;
}

function rowMatchesQuery(row: DocRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.kind,
    row.data.number,
    row.data.status,
    rowDate(row),
    rowDue(row),
    formatMoney(row.data.amount),
    row.kind === "invoice"
      ? formatMoney(row.data.balanceOutstanding)
      : "",
    row.kind === "invoice" ? (row.data.milestonePhase ?? "") : "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function filterTags(filters: CustomerDocFilters): FilterTag[] {
  const tags: FilterTag[] = [];
  if (filters.documentType !== "all") {
    tags.push({
      id: "type",
      label:
        filters.documentType === "quotes" ? "Type: Quotes" : "Type: Invoices",
    });
  }
  if (filters.status !== "All") {
    tags.push({ id: "status", label: `Status: ${filters.status}` });
  }
  if (filters.date) {
    tags.push({ id: "date", label: `Date: ${dateRangeLabel(filters.date)}` });
  }
  if (filters.due) {
    tags.push({
      id: "due",
      label: `Due / Expiry: ${dateRangeLabel(filters.due)}`,
    });
  }
  if (filters.total.preset !== "any") {
    if (filters.total.preset === "custom") {
      const min = filters.total.min.trim();
      const max = filters.total.max.trim();
      if (min || max) {
        tags.push({
          id: "total",
          label:
            min && max
              ? `Total: $${min} – $${max}`
              : min
                ? `Total: ≥ $${min}`
                : `Total: ≤ $${max}`,
        });
      }
    } else {
      const preset = AMOUNT_PRESETS.find(
        (entry) => entry.id === filters.total.preset,
      );
      if (preset) tags.push({ id: "total", label: `Total: ${preset.label}` });
    }
  }
  return tags;
}

function clearFilterTag(
  filters: CustomerDocFilters,
  id: string,
): CustomerDocFilters {
  switch (id) {
    case "type":
      return { ...filters, documentType: "all" };
    case "status":
      return { ...filters, status: "All" };
    case "date":
      return { ...filters, date: null };
    case "due":
      return { ...filters, due: null };
    case "total":
      return { ...filters, total: { ...EMPTY_AMOUNT } };
    default:
      return filters;
  }
}

export function CustomerDocumentsPanel({
  invoices,
  quotes,
  setupIncomplete = false,
}: {
  invoices: CustomerInvoiceRow[];
  quotes: CustomerQuoteRow[];
  setupIncomplete?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CustomerDocFilters>(defaultFilters);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const allRows = useMemo<DocRow[]>(() => {
    return [
      ...quotes.map(
        (data): DocRow => ({ kind: "quote", id: `quote-${data.id}`, data }),
      ),
      ...invoices.map(
        (data): DocRow => ({
          kind: "invoice",
          id: `invoice-${data.id}`,
          data,
        }),
      ),
    ];
  }, [invoices, quotes]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (filters.documentType === "quotes" && row.kind !== "quote") {
        return false;
      }
      if (filters.documentType === "invoices" && row.kind !== "invoice") {
        return false;
      }
      if (!matchesStatus(row.data.status, filters.status)) return false;
      if (!matchesAmount(row.data.amount, filters.total)) return false;
      if (!matchesOptionalDate(rowDate(row), filters.date)) return false;
      if (!matchesOptionalDate(rowDue(row), filters.due)) return false;
      if (!rowMatchesQuery(row, query)) return false;
      return true;
    });
  }, [allRows, filters, query]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const value = (row: DocRow): string | number => {
        switch (sortKey) {
          case "type":
            return row.kind;
          case "number":
            return row.data.number.toLowerCase();
          case "status":
            return row.data.status.toLowerCase();
          case "date":
            return rowDate(row).toLowerCase();
          case "due":
            return rowDue(row).toLowerCase();
          case "total":
            return row.data.amount;
          case "outstanding":
            return rowOutstanding(row) ?? -1;
        }
      };
      const cmp = compareValues(value(a), value(b), sortDir);
      if (cmp !== 0) return cmp;
      return a.data.number.localeCompare(b.data.number);
    });
  }, [filteredRows, sortDir, sortKey]);

  const tags = filterTags(filters);
  const activeFilterCount = tags.length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "date" || key === "due" || key === "total" ? "desc" : "asc");
  }

  const emptyLabel =
    query.trim() || activeFilterCount > 0
      ? "No quotes or invoices match your filters."
      : setupIncomplete
        ? "No quotes or invoices have been created for this customer. Complete your onboarding to start!"
        : "No quotes or invoices yet for this customer.";

  return (
    <>
      {!setupIncomplete ? (
        <>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="min-w-0 flex-1 md:max-w-[280px]">
              <SearchField
                id="customer-docs-search"
                value={query}
                onChange={setQuery}
                placeholder="Search by status, number..."
                label="Search quotes and invoices"
              />
            </div>
            <FilterIconButton
              activeCount={activeFilterCount}
              onClick={() => setFilterOpen(true)}
            />
          </div>

          <DirectoryFilterTags
            tags={tags}
            onRemove={(id) => setFilters((prev) => clearFilterTag(prev, id))}
            onClearAll={() => setFilters(defaultFilters())}
          />
        </>
      ) : null}

      <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
        {sortedRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="type-body-muted">{emptyLabel}</p>
            {setupIncomplete && !(query.trim() || activeFilterCount > 0) ? (
              <div className="mt-5 flex justify-center">
                <Link
                  href="/onboarding?start=wizard"
                  className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center px-5`}
                >
                  Finish Set Up
                </Link>
              </div>
            ) : !(query.trim() || activeFilterCount > 0) ? (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href="/quote"
                  className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5`}
                >
                  <CreatePlusIcon />
                  Create Quote
                </Link>
                <Link
                  href="/"
                  className="ui-btn-secondary inline-flex h-11 items-center gap-2 px-5"
                >
                  <CreatePlusIcon />
                  Create Invoice
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            {/* Mobile: cards */}
            <ul className="grid gap-3 p-4 md:hidden">
              {sortedRows.map((row) => {
                const href =
                  row.kind === "invoice"
                    ? hrefForCustomerInvoice(row.data.status)
                    : hrefForCustomerQuote(row.data.status);
                const outstanding = rowOutstanding(row);
                return (
                  <li key={row.id}>
                    <Link
                      href={href}
                      className={DIRECTORY_CARD_CLASS}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="type-subtitle-2 text-midnight-ink">
                            <HighlightText
                              text={`#${row.data.number}`}
                              query={query}
                            />
                          </p>
                          <p className="mt-1 type-subtitle-1 text-midnight-ink">
                            {row.kind === "invoice" ? "Invoice" : "Quote"}
                          </p>
                        </div>
                        <StatusBadge status={row.data.status} query={query} />
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                        <div>
                          <dt className="type-caption">Date</dt>
                          <dd className="mt-0.5 type-paragraph-2 text-black/75">
                            <DateCell value={rowDate(row)} query={query} />
                          </dd>
                        </div>
                        <div>
                          <dt className="type-caption">Due / Expiry</dt>
                          <dd className="mt-0.5 type-paragraph-2 text-black/75">
                            <DateCell value={rowDue(row)} query={query} />
                          </dd>
                        </div>
                        <div>
                          <dt className="type-caption">Total</dt>
                          <dd className="mt-0.5">
                            <MoneyCell
                              amount={row.data.amount}
                              variant="total"
                              query={query}
                              align="left"
                            />
                          </dd>
                        </div>
                        <div>
                          <dt className="type-caption">Outstanding</dt>
                          <dd className="mt-0.5">
                            {outstanding == null ? (
                              <span className="type-paragraph-2 text-black/35">
                                —
                              </span>
                            ) : (
                              <MoneyCell
                                amount={outstanding}
                                variant="outstanding"
                                query={query}
                                align="left"
                              />
                            )}
                          </dd>
                        </div>
                      </dl>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block">
            <div
              className={DIRECTORY_HEADER_ROW}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: "1rem",
                minWidth: 760,
                alignItems: "center",
              }}
            >
              {(
                [
                  ["type", "Type", "left"],
                  ["number", "Number", "left"],
                  ["status", "Status", "left"],
                  ["date", "Date", "left"],
                  ["due", "Due / Expiry", "left"],
                  ["total", "Total", "right"],
                  ["outstanding", "Outstanding", "right"],
                ] as const
              ).map(([key, label, align], index, list) => (
                <div
                  key={key}
                  className={
                    index < list.length - 1
                      ? "border-r border-dotted border-black/20 pr-2"
                      : "pr-2"
                  }
                >
                  <SortHeaderButton
                    label={label}
                    active={sortKey === key}
                    dir={sortDir}
                    onClick={() => toggleSort(key)}
                    align={align}
                  />
                </div>
              ))}
            </div>

            <ul style={{ minWidth: 760 }}>
              {sortedRows.map((row, index) => {
                const href =
                  row.kind === "invoice"
                    ? hrefForCustomerInvoice(row.data.status)
                    : hrefForCustomerQuote(row.data.status);
                const outstanding = rowOutstanding(row);
                return (
                  <li key={row.id}>
                    <Link
                      href={href}
                      className={`${DIRECTORY_BODY_ROW} block ${
                        index < sortedRows.length - 1
                          ? "border-b border-black/10"
                          : ""
                      }`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: GRID,
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <span className="text-black/65">
                        <HighlightText
                          text={row.kind === "invoice" ? "Invoice" : "Quote"}
                          query={query}
                        />
                      </span>
                      <HighlightText
                        text={row.data.number}
                        query={query}
                        className="font-medium"
                      />
                      <StatusBadge status={row.data.status} query={query} />
                      <DateCell value={rowDate(row)} query={query} />
                      <DateCell value={rowDue(row)} query={query} />
                      <MoneyCell
                        amount={row.data.amount}
                        variant="total"
                        query={query}
                      />
                      {outstanding == null ? (
                        <span className="text-right text-black/35">—</span>
                      ) : (
                        <MoneyCell
                          amount={outstanding}
                          variant="outstanding"
                          query={query}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            </div>
          </div>
        )}
      </div>

      <CustomerDocFilterPanel
        open={filterOpen}
        value={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </>
  );
}

function CustomerDocFilterPanel({
  open,
  value,
  onClose,
  onApply,
}: {
  open: boolean;
  value: CustomerDocFilters;
  onClose: () => void;
  onApply: (next: CustomerDocFilters) => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close filters"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-8 py-5">
          <h2 id={titleId} className="type-headline-5 text-midnight-ink">
            Filters
          </h2>
          <EditCloseButton onClick={onClose} />
        </div>

        <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-8 py-6">
          <RadioField
            legend="Document type"
            options={[
              { id: "all", label: "All" },
              { id: "quotes", label: "Quotes" },
              { id: "invoices", label: "Invoices" },
            ]}
            value={draft.documentType}
            onChange={(documentType) =>
              setDraft((prev) => ({
                ...prev,
                documentType: documentType as DocType,
              }))
            }
          />
          <RadioField
            legend="Status"
            options={STATUS_OPTIONS.map((option) => ({
              id: option,
              label: option === "All" ? "All Statuses" : option,
            }))}
            value={draft.status}
            onChange={(status) => setDraft((prev) => ({ ...prev, status }))}
          />
          <DateDropdownField
            label="Date"
            value={draft.date}
            onChange={(date) => setDraft((prev) => ({ ...prev, date }))}
          />
          <DateDropdownField
            label="Due / Expiry"
            value={draft.due}
            onChange={(due) => setDraft((prev) => ({ ...prev, due }))}
          />
          <AmountMinMaxField
            label="Total Amount"
            value={draft.total}
            onChange={(total) => setDraft((prev) => ({ ...prev, total }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/10 px-8 py-5">
          <button
            type="button"
            onClick={() => setDraft(defaultFilters())}
            className="text-sm font-semibold text-black/55 transition hover:text-midnight-ink hover:underline"
          >
            Clear All
          </button>
          <button
            type="button"
            className="ui-btn-primary"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}

function RadioField({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  const groupId = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-midnight-ink">
        {legend}
      </legend>
      <div className="flex flex-col gap-1.5" role="radiogroup">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 py-1.5 text-sm transition ${
                selected
                  ? "font-semibold text-prime-blue"
                  : "text-midnight-ink hover:text-prime-blue"
              }`}
            >
              <input
                type="radio"
                name={`${legend}-${groupId}`}
                className="h-4 w-4 accent-prime-blue"
                checked={selected}
                onChange={() => onChange(option.id)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-sm font-semibold text-midnight-ink">{children}</p>
  );
}

function AmountMinMaxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AmountFilter;
  onChange: (next: AmountFilter) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        className={`${selectClass} mb-3`}
        value={value.preset}
        onChange={(event) =>
          onChange({
            ...value,
            preset: event.target.value as AmountFilter["preset"],
          })
        }
      >
        {AMOUNT_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      {value.preset === "custom" ? (
        <div className="grid grid-cols-2 gap-2.5">
          <input
            inputMode="decimal"
            className={inputClass}
            placeholder="Min"
            value={value.min}
            onChange={(event) =>
              onChange({
                ...value,
                min: event.target.value.replace(/[^\d.]/g, ""),
              })
            }
          />
          <input
            inputMode="decimal"
            className={inputClass}
            placeholder="Max"
            value={value.max}
            onChange={(event) =>
              onChange({
                ...value,
                max: event.target.value.replace(/[^\d.]/g, ""),
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function DateDropdownField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: OptionalDateFilter;
  onChange: (next: OptionalDateFilter) => void;
}) {
  const selectValue = value?.preset ?? "any";

  function onSelectChange(next: string) {
    if (next === "any") {
      onChange(null);
      return;
    }
    onChange({
      preset: next as DateRangePreset,
      customStart: value?.customStart ?? null,
      customEnd: value?.customEnd ?? null,
    });
  }

  function patchCustom(patch: Partial<DateRangeValue>) {
    onChange({
      preset: "custom",
      customStart: value?.customStart ?? null,
      customEnd: value?.customEnd ?? null,
      ...patch,
    });
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        className={selectClass}
        value={selectValue}
        onChange={(event) => onSelectChange(event.target.value)}
        aria-label={label}
      >
        <option value="any">Any Time</option>
        {DATE_RANGE_PRESETS.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
      </select>
      {value?.preset === "custom" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-black/55">
            Start
            <input
              type="date"
              value={value.customStart ?? ""}
              onChange={(event) =>
                patchCustom({ customStart: event.target.value || null })
              }
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-black/55">
            End
            <input
              type="date"
              value={value.customEnd ?? ""}
              onChange={(event) =>
                patchCustom({ customEnd: event.target.value || null })
              }
              className={inputClass}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
