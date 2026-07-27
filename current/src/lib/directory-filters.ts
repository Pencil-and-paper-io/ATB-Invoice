import {
  DATE_RANGE_PRESETS,
  dateInRange,
  dateRangeLabel,
  type DateRangeValue,
} from "@/lib/directory-date-range";
import type {
  CustomerInvoiceRow,
  CustomerQuoteRow,
} from "@/lib/invoice-demo-data";

export const INVOICE_STATUS_OPTIONS = [
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

export const QUOTE_STATUS_OPTIONS = [
  "All",
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
] as const;

export type InvoiceStatusOption = (typeof INVOICE_STATUS_OPTIONS)[number];
export type QuoteStatusOption = (typeof QUOTE_STATUS_OPTIONS)[number];

export type AmountPreset =
  | "any"
  | "under_1000"
  | "1000_to_2000"
  | "over_2000"
  | "custom";

export type AmountFilter = {
  preset: AmountPreset;
  min: string;
  max: string;
};

export const AMOUNT_PRESETS: { id: AmountPreset; label: string }[] = [
  { id: "any", label: "Any amount" },
  { id: "under_1000", label: "Under $1,000" },
  { id: "1000_to_2000", label: "$1,000 – $2,000" },
  { id: "over_2000", label: "Over $2,000" },
  { id: "custom", label: "Custom range" },
];

export type OptionalDateFilter = DateRangeValue | null;

export type InvoiceDirectoryFilters = {
  status: InvoiceStatusOption;
  customerId: string | null;
  issued: OptionalDateFilter;
  due: OptionalDateFilter;
  total: AmountFilter;
  outstanding: AmountFilter;
};

export type QuoteDirectoryFilters = {
  status: QuoteStatusOption;
  customerId: string | null;
  created: OptionalDateFilter;
  expiry: OptionalDateFilter;
  total: AmountFilter;
};

export type CustomerDirectoryFilters = {
  tags: string[];
  total: AmountFilter;
  outstanding: AmountFilter;
  paid: AmountFilter;
};

export type FilterTag = {
  id: string;
  label: string;
};

export const EMPTY_AMOUNT: AmountFilter = {
  preset: "any",
  min: "",
  max: "",
};

export function defaultInvoiceFilters(
  status: InvoiceStatusOption = "All",
): InvoiceDirectoryFilters {
  return {
    status,
    customerId: null,
    issued: null,
    due: null,
    total: { ...EMPTY_AMOUNT },
    outstanding: { ...EMPTY_AMOUNT },
  };
}

export function defaultQuoteFilters(
  status: QuoteStatusOption = "All",
): QuoteDirectoryFilters {
  return {
    status,
    customerId: null,
    created: null,
    expiry: null,
    total: { ...EMPTY_AMOUNT },
  };
}

export function defaultCustomerFilters(): CustomerDirectoryFilters {
  return {
    tags: [],
    total: { ...EMPTY_AMOUNT },
    outstanding: { ...EMPTY_AMOUNT },
    paid: { ...EMPTY_AMOUNT },
  };
}

export function matchesInvoiceStatus(
  row: CustomerInvoiceRow,
  status: InvoiceStatusOption,
) {
  if (status === "All") return true;
  if (status === "Outstanding") {
    return (
      row.balanceOutstanding > 0 &&
      !/^(draft|paid|void|uncollectible)$/i.test(row.status)
    );
  }
  if (status === "Overdue") {
    return /^overdue/i.test(row.status);
  }
  return row.status === status;
}

export function matchesAmount(amount: number, filter: AmountFilter) {
  if (filter.preset === "any") return true;
  if (filter.preset === "under_1000") return amount < 1000;
  if (filter.preset === "1000_to_2000") {
    return amount >= 1000 && amount <= 2000;
  }
  if (filter.preset === "over_2000") return amount > 2000;

  const min = filter.min.trim() === "" ? null : Number(filter.min);
  const max = filter.max.trim() === "" ? null : Number(filter.max);
  if (min != null && Number.isFinite(min) && amount < min) return false;
  if (max != null && Number.isFinite(max) && amount > max) return false;
  return true;
}

export function matchesOptionalDate(
  dateValue: string,
  filter: OptionalDateFilter,
) {
  if (!filter) return true;
  return dateInRange(dateValue, filter);
}

function amountTagLabel(prefix: string, filter: AmountFilter) {
  if (filter.preset === "any") return null;
  if (filter.preset === "custom") {
    const min = filter.min.trim();
    const max = filter.max.trim();
    if (!min && !max) return null;
    if (min && max) return `${prefix}: $${min} – $${max}`;
    if (min) return `${prefix}: ≥ $${min}`;
    return `${prefix}: ≤ $${max}`;
  }
  const preset = AMOUNT_PRESETS.find((entry) => entry.id === filter.preset);
  return preset ? `${prefix}: ${preset.label}` : null;
}

function dateTagLabel(prefix: string, filter: OptionalDateFilter) {
  if (!filter) return null;
  return `${prefix}: ${dateRangeLabel(filter)}`;
}

export function invoiceFilterTags(
  filters: InvoiceDirectoryFilters,
  customerNameForId?: (id: string) => string,
): FilterTag[] {
  const tags: FilterTag[] = [];
  if (filters.status !== "All") {
    tags.push({ id: "status", label: `Status: ${filters.status}` });
  }
  if (filters.customerId) {
    const name = customerNameForId?.(filters.customerId) ?? filters.customerId;
    tags.push({ id: "customer", label: `Customer: ${name}` });
  }
  const issued = dateTagLabel("Issued", filters.issued);
  if (issued) tags.push({ id: "issued", label: issued });
  const due = dateTagLabel("Due", filters.due);
  if (due) tags.push({ id: "due", label: due });
  const total = amountTagLabel("Total", filters.total);
  if (total) tags.push({ id: "total", label: total });
  const outstanding = amountTagLabel("Outstanding", filters.outstanding);
  if (outstanding) tags.push({ id: "outstanding", label: outstanding });
  return tags;
}

export function quoteFilterTags(
  filters: QuoteDirectoryFilters,
  customerNameForId?: (id: string) => string,
): FilterTag[] {
  const tags: FilterTag[] = [];
  if (filters.status !== "All") {
    tags.push({ id: "status", label: `Status: ${filters.status}` });
  }
  if (filters.customerId) {
    const name = customerNameForId?.(filters.customerId) ?? filters.customerId;
    tags.push({ id: "customer", label: `Customer: ${name}` });
  }
  const created = dateTagLabel("Created", filters.created);
  if (created) tags.push({ id: "created", label: created });
  const expiry = dateTagLabel("Expiry", filters.expiry);
  if (expiry) tags.push({ id: "expiry", label: expiry });
  const total = amountTagLabel("Total", filters.total);
  if (total) tags.push({ id: "total", label: total });
  return tags;
}

export function clearInvoiceFilterTag(
  filters: InvoiceDirectoryFilters,
  tagId: string,
): InvoiceDirectoryFilters {
  switch (tagId) {
    case "status":
      return { ...filters, status: "All" };
    case "customer":
      return { ...filters, customerId: null };
    case "issued":
      return { ...filters, issued: null };
    case "due":
      return { ...filters, due: null };
    case "total":
      return { ...filters, total: { ...EMPTY_AMOUNT } };
    case "outstanding":
      return { ...filters, outstanding: { ...EMPTY_AMOUNT } };
    default:
      return filters;
  }
}

export function clearQuoteFilterTag(
  filters: QuoteDirectoryFilters,
  tagId: string,
): QuoteDirectoryFilters {
  switch (tagId) {
    case "status":
      return { ...filters, status: "All" };
    case "customer":
      return { ...filters, customerId: null };
    case "created":
      return { ...filters, created: null };
    case "expiry":
      return { ...filters, expiry: null };
    case "total":
      return { ...filters, total: { ...EMPTY_AMOUNT } };
    default:
      return filters;
  }
}

export function invoiceFilterCount(
  filters: InvoiceDirectoryFilters,
  customerNameForId?: (id: string) => string,
) {
  return invoiceFilterTags(filters, customerNameForId).length;
}

export function quoteFilterCount(
  filters: QuoteDirectoryFilters,
  customerNameForId?: (id: string) => string,
) {
  return quoteFilterTags(filters, customerNameForId).length;
}

export function customerFilterTags(
  filters: CustomerDirectoryFilters,
): FilterTag[] {
  const tags: FilterTag[] = [];
  if (filters.tags.length > 0) {
    tags.push({
      id: "tags",
      label:
        filters.tags.length === 1
          ? `Tag: ${filters.tags[0]}`
          : `Tags: ${filters.tags.join(", ")}`,
    });
  }
  const total = amountTagLabel("Total", filters.total);
  if (total) tags.push({ id: "total", label: total });
  const outstanding = amountTagLabel("Outstanding", filters.outstanding);
  if (outstanding) tags.push({ id: "outstanding", label: outstanding });
  const paid = amountTagLabel("Paid", filters.paid);
  if (paid) tags.push({ id: "paid", label: paid });
  return tags;
}

export function clearCustomerFilterTag(
  filters: CustomerDirectoryFilters,
  tagId: string,
): CustomerDirectoryFilters {
  switch (tagId) {
    case "tags":
      return { ...filters, tags: [] };
    case "total":
      return { ...filters, total: { ...EMPTY_AMOUNT } };
    case "outstanding":
      return { ...filters, outstanding: { ...EMPTY_AMOUNT } };
    case "paid":
      return { ...filters, paid: { ...EMPTY_AMOUNT } };
    default:
      return filters;
  }
}

export function customerFilterCount(filters: CustomerDirectoryFilters) {
  return customerFilterTags(filters).length;
}

export function matchesCustomerTags(
  customerTags: string[],
  selectedTags: string[],
) {
  if (selectedTags.length === 0) return true;
  return customerTags.some((tag) => selectedTags.includes(tag));
}

export { DATE_RANGE_PRESETS };
