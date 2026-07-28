"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DATE_RANGE_PRESETS,
  EMPTY_AMOUNT,
  INVOICE_STATUS_OPTIONS,
  QUOTE_STATUS_OPTIONS,
  defaultCustomerFilters,
  type AmountFilter,
  type CustomerDirectoryFilters,
  type InvoiceDirectoryFilters,
  type InvoiceStatusOption,
  type OptionalDateFilter,
  type QuoteDirectoryFilters,
  type QuoteStatusOption,
} from "@/lib/directory-filters";
import {
  dateRangeLabel,
  type DateRangePreset,
  type DateRangeValue,
} from "@/lib/directory-date-range";
import { getActiveCustomers, type Customer } from "@/lib/invoice-demo-data";
import { EditCloseButton } from "./ui";

type Kind = "invoices" | "quotes" | "customers";

const selectClass =
  "h-11 w-full rounded-md border border-black/15 bg-white px-3 text-sm font-medium text-midnight-ink outline-none focus:border-prime-blue";

const inputClass =
  "h-11 w-full rounded-md border border-black/15 bg-input-grey px-3 text-sm text-midnight-ink outline-none focus:border-prime-blue focus:bg-white";

export function DirectoryFilterPanel({
  kind,
  open,
  onClose,
  invoiceFilters,
  quoteFilters,
  customerFilters,
  availableTags = [],
  onApplyInvoice,
  onApplyQuote,
  onApplyCustomer,
}: {
  kind: Kind;
  open: boolean;
  onClose: () => void;
  invoiceFilters?: InvoiceDirectoryFilters;
  quoteFilters?: QuoteDirectoryFilters;
  customerFilters?: CustomerDirectoryFilters;
  availableTags?: string[];
  onApplyInvoice?: (next: InvoiceDirectoryFilters) => void;
  onApplyQuote?: (next: QuoteDirectoryFilters) => void;
  onApplyCustomer?: (next: CustomerDirectoryFilters) => void;
}) {
  const titleId = useId();
  const [draftInvoice, setDraftInvoice] = useState(
    invoiceFilters ?? {
      status: "All" as const,
      customerId: null,
      issued: null,
      due: null,
      total: { ...EMPTY_AMOUNT },
      outstanding: { ...EMPTY_AMOUNT },
    },
  );
  const [draftQuote, setDraftQuote] = useState(
    quoteFilters ?? {
      status: "All" as const,
      customerId: null,
      created: null,
      expiry: null,
      total: { ...EMPTY_AMOUNT },
    },
  );
  const [draftCustomer, setDraftCustomer] = useState(
    customerFilters ?? defaultCustomerFilters(),
  );

  useEffect(() => {
    if (!open) return;
    if (invoiceFilters) setDraftInvoice(invoiceFilters);
    if (quoteFilters) setDraftQuote(quoteFilters);
    if (customerFilters) setDraftCustomer(customerFilters);
  }, [open, invoiceFilters, quoteFilters, customerFilters]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function apply() {
    if (kind === "invoices") {
      onApplyInvoice?.(normalizeInvoiceAmounts(draftInvoice));
    } else if (kind === "quotes") {
      onApplyQuote?.(normalizeQuoteAmounts(draftQuote));
    } else {
      onApplyCustomer?.(normalizeCustomerAmounts(draftCustomer));
    }
    onClose();
  }

  function clearAll() {
    if (kind === "invoices") {
      setDraftInvoice({
        status: "All",
        customerId: null,
        issued: null,
        due: null,
        total: { ...EMPTY_AMOUNT },
        outstanding: { ...EMPTY_AMOUNT },
      });
    } else if (kind === "quotes") {
      setDraftQuote({
        status: "All",
        customerId: null,
        created: null,
        expiry: null,
        total: { ...EMPTY_AMOUNT },
      });
    } else {
      setDraftCustomer(defaultCustomerFilters());
    }
  }

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

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {kind === "invoices" ? (
            <InvoiceFilterFields
              value={draftInvoice}
              onChange={setDraftInvoice}
            />
          ) : kind === "quotes" ? (
            <QuoteFilterFields value={draftQuote} onChange={setDraftQuote} />
          ) : (
            <CustomerFilterFields
              value={draftCustomer}
              availableTags={availableTags}
              onChange={setDraftCustomer}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/10 px-8 py-5">
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold text-black/55 transition hover:text-midnight-ink hover:underline"
          >
            Clear All
          </button>
          <button type="button" className="ui-btn-primary" onClick={apply}>
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}

function normalizeAmount(filter: AmountFilter): AmountFilter {
  const min = filter.min.trim();
  const max = filter.max.trim();
  if (!min && !max) return { ...EMPTY_AMOUNT };
  return { preset: "custom", min, max };
}

function normalizeInvoiceAmounts(
  filters: InvoiceDirectoryFilters,
): InvoiceDirectoryFilters {
  return {
    ...filters,
    total: normalizeAmount(filters.total),
    outstanding: normalizeAmount(filters.outstanding),
  };
}

function normalizeQuoteAmounts(
  filters: QuoteDirectoryFilters,
): QuoteDirectoryFilters {
  return {
    ...filters,
    total: normalizeAmount(filters.total),
  };
}

function normalizeCustomerAmounts(
  filters: CustomerDirectoryFilters,
): CustomerDirectoryFilters {
  return {
    ...filters,
    total: normalizeAmount(filters.total),
    outstanding: normalizeAmount(filters.outstanding),
    paid: normalizeAmount(filters.paid),
  };
}

function InvoiceFilterFields({
  value,
  onChange,
}: {
  value: InvoiceDirectoryFilters;
  onChange: (next: InvoiceDirectoryFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      <StatusRadioField
        options={INVOICE_STATUS_OPTIONS}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <CustomerComboboxField
        value={value.customerId}
        onChange={(customerId) => onChange({ ...value, customerId })}
      />
      <DateDropdownField
        label="Issue Date"
        value={value.issued}
        onChange={(issued) => onChange({ ...value, issued })}
      />
      <DateDropdownField
        label="Due Date"
        value={value.due}
        onChange={(due) => onChange({ ...value, due })}
      />
      <AmountMinMaxField
        label="Total Amount"
        value={value.total}
        onChange={(total) => onChange({ ...value, total })}
      />
      <AmountMinMaxField
        label="Outstanding Balance"
        value={value.outstanding}
        onChange={(outstanding) => onChange({ ...value, outstanding })}
      />
    </div>
  );
}

function QuoteFilterFields({
  value,
  onChange,
}: {
  value: QuoteDirectoryFilters;
  onChange: (next: QuoteDirectoryFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      <StatusRadioField
        options={QUOTE_STATUS_OPTIONS}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
      <CustomerComboboxField
        value={value.customerId}
        onChange={(customerId) => onChange({ ...value, customerId })}
      />
      <DateDropdownField
        label="Created Date"
        value={value.created}
        onChange={(created) => onChange({ ...value, created })}
      />
      <DateDropdownField
        label="Expiry Date"
        value={value.expiry}
        onChange={(expiry) => onChange({ ...value, expiry })}
      />
      <AmountMinMaxField
        label="Total Amount"
        value={value.total}
        onChange={(total) => onChange({ ...value, total })}
      />
    </div>
  );
}

function CustomerFilterFields({
  value,
  availableTags,
  onChange,
}: {
  value: CustomerDirectoryFilters;
  availableTags: string[];
  onChange: (next: CustomerDirectoryFilters) => void;
}) {
  function toggleTag(tag: string) {
    const selected = value.tags.includes(tag)
      ? value.tags.filter((entry) => entry !== tag)
      : [...value.tags, tag];
    onChange({ ...value, tags: selected });
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <FieldLabel>Tags</FieldLabel>
        {availableTags.length === 0 ? (
          <p className="text-sm text-black/45">No tags yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {availableTags.map((tag) => {
              const checked = value.tags.includes(tag);
              return (
                <label
                  key={tag}
                  className={`flex cursor-pointer items-center gap-3 py-1.5 text-sm transition ${
                    checked
                      ? "font-semibold text-prime-blue"
                      : "text-midnight-ink hover:text-prime-blue"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-prime-blue"
                    checked={checked}
                    onChange={() => toggleTag(tag)}
                  />
                  <span>{tag}</span>
                </label>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-black/45">
          Leave unchecked to include all customers. Checked tags match any.
        </p>
      </div>
      <AmountMinMaxField
        label="Total Amount"
        value={value.total}
        onChange={(total) => onChange({ ...value, total })}
      />
      <AmountMinMaxField
        label="Outstanding Balance"
        value={value.outstanding}
        onChange={(outstanding) => onChange({ ...value, outstanding })}
      />
      <AmountMinMaxField
        label="Paid Amount"
        value={value.paid}
        onChange={(paid) => onChange({ ...value, paid })}
      />
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-sm font-semibold text-midnight-ink">{children}</p>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightMatch({
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

function StatusRadioField({
  options,
  value,
  onChange,
}: {
  options: readonly InvoiceStatusOption[] | readonly QuoteStatusOption[];
  value: string;
  onChange: (next: never) => void;
}) {
  const groupId = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-midnight-ink">
        Status
      </legend>
      <div className="flex flex-col gap-1.5" role="radiogroup">
        {options.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 py-1.5 text-sm transition ${
                selected
                  ? "font-semibold text-prime-blue"
                  : "text-midnight-ink hover:text-prime-blue"
              }`}
            >
              <input
                type="radio"
                name={`status-${groupId}`}
                className="h-4 w-4 accent-prime-blue"
                checked={selected}
                onChange={() => onChange(option as never)}
              />
              <span>{option === "All" ? "All Statuses" : option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CustomerComboboxField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.setTimeout(() => setCustomers(getActiveCustomers()), 0);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = customers.find((entry) => entry.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  function selectCustomer(customer: Customer | null) {
    onChange(customer?.id ?? null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div>
      <FieldLabel>Customer Name</FieldLabel>
      <div ref={ref} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={open ? query : (selected?.name ?? "")}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              if (value) onChange(null);
            }}
            onFocus={() => {
              setOpen(true);
              setQuery("");
            }}
            placeholder="Any customer"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Customer Name"
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/45"
            aria-label={open ? "Close customer list" : "Open customer list"}
            onClick={() => {
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
          >
            <svg
              width="11"
              height="6"
              viewBox="0 0 11 6"
              fill="none"
              aria-hidden
            >
              <path
                d="M1 1l4.5 4L10 1"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        {open ? (
          <div
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
            role="listbox"
          >
            <ul className="max-h-64 overflow-auto py-1">
              <li>
                <button
                  type="button"
                  onClick={() => selectCustomer(null)}
                  className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-black/[0.04] ${
                    !value
                      ? "font-semibold text-prime-blue"
                      : "text-midnight-ink"
                  }`}
                  role="option"
                  aria-selected={!value}
                >
                  Any customer
                </button>
              </li>
              {filtered.length ? (
                filtered.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className={`flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04] ${
                        value === customer.id ? "bg-prime-blue/5" : ""
                      }`}
                      role="option"
                      aria-selected={value === customer.id}
                    >
                      <HighlightMatch
                        text={customer.name}
                        query={query}
                        className={`text-sm ${
                          value === customer.id
                            ? "font-semibold text-prime-blue"
                            : "font-semibold text-black"
                        }`}
                      />
                      <HighlightMatch
                        text={customer.email}
                        query={query}
                        className="text-xs text-black/50"
                      />
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-black/50">
                  No customers match “{query.trim()}”
                </li>
              )}
            </ul>
          </div>
        ) : null}
      </div>
      {selected && !open ? (
        <button
          type="button"
          onClick={() => selectCustomer(null)}
          className="mt-2 text-xs font-semibold text-black/50 transition hover:text-midnight-ink hover:underline"
        >
          Clear customer
        </button>
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
      {value && value.preset !== "custom" ? (
        <p className="mt-2 text-xs text-black/45">{dateRangeLabel(value)}</p>
      ) : null}
    </div>
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
  function update(partial: Partial<AmountFilter>) {
    const next = { ...value, ...partial, preset: "custom" as const };
    if (!next.min.trim() && !next.max.trim()) {
      onChange({ ...EMPTY_AMOUNT });
      return;
    }
    onChange(next);
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-black/55">
          Min ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={value.min}
            onChange={(event) => update({ min: event.target.value })}
            className={inputClass}
            placeholder="0"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-black/55">
          Max ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={value.max}
            onChange={(event) => update({ max: event.target.value })}
            className={inputClass}
            placeholder="Any"
          />
        </label>
      </div>
    </div>
  );
}
