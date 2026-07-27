"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  customers,
  getAllCustomers,
  getCustomerAccountSummary,
  isCustomerArchived,
  unarchiveCustomer,
  type Customer,
} from "@/lib/invoice-demo-data";
import {
  applyCustomerTagEdits,
  loadCustomerTags,
} from "@/lib/customer-tags";
import {
  DEFAULT_DATE_RANGE,
  dateInRange,
  type DateRangeValue,
} from "@/lib/directory-date-range";
import { TopNav } from "@/components/invoice/TopNav";
import { DateRangeFilter } from "@/components/invoice/DateRangeFilter";
import {
  DirectoryColumnHeader,
  DirectoryToolbar,
  DirectoryViewToggle,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW,
  MoneyCell,
  SearchField,
  SortHeaderButton,
  type DirectoryViewMode,
} from "@/components/invoice/directory-table";
import { CreatePlusIcon } from "@/components/invoice/ui";
import { useDismissOnOutsideClick } from "@/components/invoice/useDismissOnOutsideClick";
import { UI_CLASS } from "@/lib/design-tokens";

type SortKey =
  | "name"
  | "email"
  | "totalInvoiced"
  | "paid"
  | "outstanding"
  | "actions";
type SortDir = "asc" | "desc";
type DirectoryTab = "active" | "archived";
type ColumnId = SortKey | "tags";

type ColumnDef = {
  id: ColumnId;
  label: string;
  minWidth: number;
  defaultWidth: number;
  sortable: SortKey | null;
  hideable: boolean;
  archivedOnly?: boolean;
};

const COLUMN_DEFS: ColumnDef[] = [
  {
    id: "name",
    label: "Legal Name",
    minWidth: 140,
    defaultWidth: 220,
    sortable: "name",
    hideable: true,
  },
  {
    id: "email",
    label: "Email",
    minWidth: 140,
    defaultWidth: 200,
    sortable: "email",
    hideable: true,
  },
  {
    id: "totalInvoiced",
    label: "Total",
    minWidth: 110,
    defaultWidth: 140,
    sortable: "totalInvoiced",
    hideable: true,
  },
  {
    id: "paid",
    label: "Paid",
    minWidth: 90,
    defaultWidth: 120,
    sortable: "paid",
    hideable: true,
  },
  {
    id: "outstanding",
    label: "Outstanding",
    minWidth: 110,
    defaultWidth: 140,
    sortable: "outstanding",
    hideable: true,
  },
  {
    id: "tags",
    label: "Tags",
    minWidth: 120,
    defaultWidth: 180,
    sortable: null,
    hideable: true,
  },
  {
    id: "actions",
    label: "Actions",
    minWidth: 120,
    defaultWidth: 140,
    sortable: "actions",
    hideable: false,
    archivedOnly: true,
  },
];

const DEFAULT_ORDER = COLUMN_DEFS.map((column) => column.id);
const DEFAULT_WIDTHS = Object.fromEntries(
  COLUMN_DEFS.map((column) => [column.id, column.defaultWidth]),
) as Record<ColumnId, number>;
const COLUMN_STORAGE_KEY = "atb-customer-directory-columns";

type DraftTag = { id: string; name: string };

function sortValue(customer: Customer, key: SortKey): string | number {
  switch (key) {
    case "name":
    case "email":
      return customer[key].toLowerCase();
    case "totalInvoiced":
    case "paid":
    case "outstanding": {
      const summary = getCustomerAccountSummary(customer.id);
      return summary[key];
    }
    case "actions":
      return customer.name.toLowerCase();
  }
}

function customerMatchesQuery(customer: Customer, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (customer.name.toLowerCase().includes(q)) return true;
  if (customer.email.toLowerCase().includes(q)) return true;
  return customer.tags.some((tag) => tag.toLowerCase().includes(q));
}

function HighlightText({
  text,
  query,
}: {
  text: string;
  query: string;
}): ReactNode {
  const q = query.trim();
  if (!q || !text) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let matchIndex = lowerText.indexOf(lowerQuery);

  while (matchIndex !== -1) {
    if (matchIndex > start) {
      parts.push(text.slice(start, matchIndex));
    }
    const end = matchIndex + q.length;
    parts.push(
      <mark
        key={`${matchIndex}-${end}`}
        className="rounded-sm bg-sunshine-yellow/70 px-0.5 text-inherit"
      >
        {text.slice(matchIndex, end)}
      </mark>,
    );
    start = end;
    matchIndex = lowerText.indexOf(lowerQuery, start);
  }

  if (start < text.length) {
    parts.push(text.slice(start));
  }

  return parts.length ? parts : text;
}

function loadColumnPrefs(): {
  order: ColumnId[];
  widths: Record<ColumnId, number>;
  hidden: ColumnId[];
} {
  if (typeof window === "undefined") {
    return { order: DEFAULT_ORDER, widths: DEFAULT_WIDTHS, hidden: [] };
  }
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) {
      return { order: DEFAULT_ORDER, widths: DEFAULT_WIDTHS, hidden: [] };
    }
    const parsed = JSON.parse(raw) as {
      order?: ColumnId[];
      widths?: Partial<Record<ColumnId, number>>;
      hidden?: ColumnId[];
    };
    const order = Array.isArray(parsed.order)
      ? [
          ...parsed.order.filter((id) =>
            COLUMN_DEFS.some((column) => column.id === id),
          ),
          ...DEFAULT_ORDER.filter((id) => !parsed.order?.includes(id)),
        ]
      : DEFAULT_ORDER;
    return {
      order,
      widths: { ...DEFAULT_WIDTHS, ...(parsed.widths ?? {}) },
      hidden: Array.isArray(parsed.hidden)
        ? parsed.hidden.filter((id) =>
            COLUMN_DEFS.some((column) => column.id === id && column.hideable),
          )
        : [],
    };
  } catch {
    return { order: DEFAULT_ORDER, widths: DEFAULT_WIDTHS, hidden: [] };
  }
}

export default function CustomersDirectoryPage() {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<DirectoryTab>("active");
  const [dateRange, setDateRange] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("list");
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [draftTags, setDraftTags] = useState<DraftTag[]>([]);
  const [tagRevision, setTagRevision] = useState(0);
  const [tagMenuPos, setTagMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [directoryCustomers, setDirectoryCustomers] = useState<Customer[]>(() => [
    ...customers,
  ]);
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(DEFAULT_ORDER);
  const [columnWidths, setColumnWidths] =
    useState<Record<ColumnId, number>>(DEFAULT_WIDTHS);
  const [hiddenColumns, setHiddenColumns] = useState<ColumnId[]>([]);
  const [columnsHydrated, setColumnsHydrated] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    columnId: ColumnId;
  } | null>(null);
  const [draggingColumn, setDraggingColumn] = useState<ColumnId | null>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    columnId: ColumnId;
    startX: number;
    startWidth: number;
  } | null>(null);

  useDismissOnOutsideClick(
    contextMenuRef,
    () => setContextMenu(null),
    Boolean(contextMenu),
  );

  useEffect(() => {
    if (!tagFilterOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (tagButtonRef.current?.contains(target)) return;
      if (tagMenuRef.current?.contains(target)) return;
      setTagFilterOpen(false);
      setManagingTags(false);
      setDraftTags([]);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [tagFilterOpen]);

  useEffect(() => {
    window.setTimeout(() => {
      const all = getAllCustomers();
      setDirectoryCustomers(all);
      setArchivedIds(
        all
          .map((customer) => customer.id)
          .filter((id) => isCustomerArchived(id)),
      );
      const tags = loadCustomerTags();
      setAvailableTags(tags);
      setSelectedTags(tags);
      const prefs = loadColumnPrefs();
      setColumnOrder(prefs.order);
      setColumnWidths(prefs.widths);
      setHiddenColumns(prefs.hidden);
      setColumnsHydrated(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!tagFilterOpen) return;

    function updatePosition() {
      const button = tagButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setTagMenuPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 280),
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [tagFilterOpen]);

  useEffect(() => {
    if (!columnsHydrated || typeof window === "undefined") return;
    localStorage.setItem(
      COLUMN_STORAGE_KEY,
      JSON.stringify({
        order: columnOrder,
        widths: columnWidths,
        hidden: hiddenColumns,
      }),
    );
  }, [columnOrder, columnWidths, hiddenColumns, columnsHydrated]);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      if (!resizeRef.current) return;
      const def = COLUMN_DEFS.find(
        (column) => column.id === resizeRef.current?.columnId,
      );
      if (!def) return;
      const nextWidth = Math.max(
        def.minWidth,
        resizeRef.current.startWidth + (event.clientX - resizeRef.current.startX),
      );
      setColumnWidths((prev) => ({
        ...prev,
        [def.id]: nextWidth,
      }));
    }
    function onUp() {
      resizeRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const visibleColumns = useMemo(() => {
    return columnOrder
      .map((id) => COLUMN_DEFS.find((column) => column.id === id))
      .filter((column): column is ColumnDef => Boolean(column))
      .filter((column) => {
        if (column.archivedOnly && tab !== "archived") return false;
        if (hiddenColumns.includes(column.id) && column.hideable) return false;
        return true;
      });
  }, [columnOrder, hiddenColumns, tab]);

  const gridTemplateColumns = visibleColumns
    .map((column) => `${columnWidths[column.id] ?? column.defaultWidth}px`)
    .join(" ");

  const filteredSortedCustomers = useMemo(() => {
    const selected = new Set(selectedTags);
    const archived = new Set(archivedIds);
    const filtered = directoryCustomers.filter((customer) => {
      const isArchived = archived.has(customer.id);
      if (tab === "active" && isArchived) return false;
      if (tab === "archived" && !isArchived) return false;
      if (selected.size === 0) return false;
      if (!customerMatchesQuery(customer, searchQuery)) return false;
      if (
        customer.dateCreated &&
        !dateInRange(customer.dateCreated, dateRange)
      ) {
        return false;
      }
      if (selected.size === availableTags.length) return true;
      return customer.tags.some((tag) => selected.has(tag));
    });

    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      if (left < right) return sortDir === "asc" ? -1 : 1;
      if (left > right) return sortDir === "asc" ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [
    directoryCustomers,
    sortKey,
    sortDir,
    selectedTags,
    availableTags.length,
    archivedIds,
    searchQuery,
    tab,
    tagRevision,
    dateRange,
  ]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag],
    );
  }

  function openTagFilter() {
    const button = tagButtonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      setTagMenuPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 280),
      });
    }
    setTagFilterOpen((prev) => {
      if (prev) {
        setManagingTags(false);
        setDraftTags([]);
      }
      return !prev;
    });
  }

  function startManagingTags() {
    setDraftTags(availableTags.map((tag) => ({ id: tag, name: tag })));
    setManagingTags(true);
  }

  function cancelManagingTags() {
    setManagingTags(false);
    setDraftTags([]);
  }

  function saveManagingTags() {
    const previousSelected = new Set(selectedTags);
    const next = applyCustomerTagEdits(draftTags);
    setAvailableTags(next);
    setSelectedTags(
      next.filter((tag) => {
        const draft = draftTags.find(
          (item) => item.name.trim() === tag || item.id === tag,
        );
        if (!draft) return previousSelected.has(tag);
        return (
          previousSelected.has(draft.id) ||
          previousSelected.has(draft.name.trim())
        );
      }),
    );
    setTagRevision((value) => value + 1);
    setManagingTags(false);
    setDraftTags([]);
  }

  function updateDraftTagName(id: string, name: string) {
    setDraftTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, name } : tag)),
    );
  }

  function deleteDraftTag(id: string) {
    setDraftTags((prev) => prev.filter((tag) => tag.id !== id));
  }

  function handleUnarchive(customerId: string) {
    const next = unarchiveCustomer(customerId);
    setArchivedIds(next);
  }

  function hideColumn(columnId: ColumnId) {
    const def = COLUMN_DEFS.find((column) => column.id === columnId);
    if (!def?.hideable) return;
    setHiddenColumns((prev) =>
      prev.includes(columnId) ? prev : [...prev, columnId],
    );
    setContextMenu(null);
  }

  function showColumn(columnId: ColumnId) {
    setHiddenColumns((prev) => prev.filter((id) => id !== columnId));
    setContextMenu(null);
  }

  function showAllColumns() {
    setHiddenColumns([]);
    setContextMenu(null);
  }

  const onHeaderDragStart = useCallback((columnId: ColumnId) => {
    setDraggingColumn(columnId);
  }, []);

  const onHeaderDrop = useCallback(
    (targetId: ColumnId) => {
      if (!draggingColumn || draggingColumn === targetId) {
        setDraggingColumn(null);
        return;
      }
      setColumnOrder((prev) => {
        const next = [...prev];
        const from = next.indexOf(draggingColumn);
        const to = next.indexOf(targetId);
        if (from < 0 || to < 0) return prev;
        next.splice(from, 1);
        next.splice(to, 0, draggingColumn);
        return next;
      });
      setDraggingColumn(null);
    },
    [draggingColumn],
  );

  const filterActive =
    availableTags.length > 0 &&
    (selectedTags.length !== availableTags.length ||
      availableTags.some((tag) => !selectedTags.includes(tag)));
  const hiddenHideable = COLUMN_DEFS.filter(
    (column) =>
      column.hideable &&
      hiddenColumns.includes(column.id) &&
      (!column.archivedOnly || tab === "archived"),
  );

  function renderCell(customer: Customer, columnId: ColumnId) {
    const summary = getCustomerAccountSummary(customer.id);
    switch (columnId) {
      case "name":
        return (
          <span className="font-semibold text-black">
            <HighlightText text={customer.name} query={searchQuery} />
          </span>
        );
      case "email":
        return (
          <span className="truncate text-black/70">
            <HighlightText text={customer.email} query={searchQuery} />
          </span>
        );
      case "totalInvoiced":
        return (
          <MoneyCell
            amount={summary.totalInvoiced}
            variant="total"
            query={searchQuery}
          />
        );
      case "paid":
        return (
          <MoneyCell amount={summary.paid} variant="paid" query={searchQuery} />
        );
      case "outstanding":
        return (
          <MoneyCell
            amount={summary.outstanding}
            variant="outstanding"
            query={searchQuery}
          />
        );
      case "tags":
        return (
          <span className="flex flex-wrap gap-1.5">
            {customer.tags.length ? (
              customer.tags
                .filter(
                  (tag) =>
                    selectedTags.length === availableTags.length ||
                    selectedTags.includes(tag),
                )
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-prime-blue/10 px-2 py-0.5 text-xs font-semibold text-prime-blue"
                  >
                    <HighlightText text={tag} query={searchQuery} />
                  </span>
                ))
            ) : (
              <span className="text-black/40">N/A</span>
            )}
          </span>
        );
      case "actions":
        return (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleUnarchive(customer.id);
            }}
            className="text-sm font-semibold text-prime-blue underline-offset-2 transition hover:underline"
          >
            Unarchive Client
          </button>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">Customers</h1>
            <p className="mt-2 type-subtitle-1 text-black/55">
              Customer directory for invoicing and quoting.
            </p>
          </div>
          <Link
            href="/customers/new"
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center justify-center gap-2 px-5`}
          >
            <CreatePlusIcon />
            Create New Customer
          </Link>
        </div>

        <DirectoryToolbar
          layout="inline"
          secondaryFilters={
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          }
          viewToggle={
            <DirectoryViewToggle value={viewMode} onChange={setViewMode} />
          }
          tabs={
            <div
              className="inline-flex rounded-lg border border-black/10 bg-white p-1"
              role="tablist"
              aria-label="Customer directory tabs"
            >
              {(
                [
                  ["active", "Active"],
                  ["archived", "Archived"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${
                    tab === id
                      ? "bg-midnight-ink text-white"
                      : "text-black/55 hover:text-black"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <SearchField
            id="customer-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Legal Name, Email, Or Tags"
            label="Search customers"
          />
        </DirectoryToolbar>

        {viewMode === "card" ? (
          filteredSortedCustomers.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSortedCustomers.map((customer) => {
                const summary = getCustomerAccountSummary(customer.id);
                return (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/new?id=${customer.id}`}
                      className="flex h-full flex-col gap-3 rounded-[10px] border border-black/10 bg-white p-5 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-midnight-ink">
                          <HighlightText
                            text={customer.name}
                            query={searchQuery}
                          />
                        </p>
                        <p className="mt-1 truncate text-sm text-black/55">
                          <HighlightText
                            text={customer.email || "No email"}
                            query={searchQuery}
                          />
                        </p>
                      </div>
                      <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div>
                          <dt className="text-xs text-black/45">Total</dt>
                          <dd className="mt-0.5 font-medium">
                            <MoneyCell
                              amount={summary.totalInvoiced}
                              variant="total"
                            />
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-black/45">Outstanding</dt>
                          <dd className="mt-0.5 font-medium">
                            <MoneyCell
                              amount={summary.outstanding}
                              variant="outstanding"
                            />
                          </dd>
                        </div>
                      </dl>
                      {customer.tags.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {customer.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-prime-blue/10 px-2 py-0.5 text-xs font-semibold text-prime-blue"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {tab === "archived" ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleUnarchive(customer.id);
                          }}
                          className="text-left text-sm font-semibold text-prime-blue underline-offset-2 hover:underline"
                        >
                          Unarchive Client
                        </button>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-black/10 bg-white px-5 py-10 text-center text-sm text-black/45">
              {searchQuery.trim()
                ? "No customers match your search."
                : tab === "archived"
                  ? "No archived customers."
                  : "No customers match the selected tags."}
            </div>
          )
        ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <div className="min-w-max">
            <div
              className={DIRECTORY_HEADER_ROW}
              style={{
                display: "grid",
                gridTemplateColumns,
                gap: "1rem",
              }}
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
                  onResizeStart={(clientX) => {
                    resizeRef.current = {
                      columnId: column.id,
                      startX: clientX,
                      startWidth:
                        columnWidths[column.id] ?? column.defaultWidth,
                    };
                  }}
                >
                  {column.id === "tags" ? (
                    <div className="inline-flex items-center gap-1.5">
                      <span>{column.label}</span>
                      <button
                        ref={tagButtonRef}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTagFilter();
                        }}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-black/[0.04] ${
                          filterActive || tagFilterOpen
                            ? "text-prime-blue"
                            : "text-black/45"
                        }`}
                        aria-haspopup="listbox"
                        aria-expanded={tagFilterOpen}
                        aria-label="Filter by tags"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M2 3.5h12l-4.5 5.25V13l-3-1.5V8.75L2 3.5Z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : column.sortable ? (
                    <SortHeaderButton
                      label={column.label}
                      active={sortKey === column.sortable}
                      dir={sortDir}
                      onClick={() => toggleSort(column.sortable!)}
                    />
                  ) : (
                    <span>{column.label}</span>
                  )}
                </DirectoryColumnHeader>
              ))}
            </div>

            <ul>
              {filteredSortedCustomers.length ? (
                filteredSortedCustomers.map((customer, index) => (
                  <li key={customer.id}>
                    <div
                      className={`${DIRECTORY_BODY_ROW} ${
                        index < filteredSortedCustomers.length - 1
                          ? "border-b border-black/10"
                          : ""
                      }`}
                      style={{
                        display: "grid",
                        gridTemplateColumns,
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      {visibleColumns.map((column) => {
                        const content = renderCell(customer, column.id);
                        if (column.id === "actions") {
                          return <div key={column.id}>{content}</div>;
                        }
                        return (
                          <Link
                            key={column.id}
                            href={`/customers/new?id=${customer.id}`}
                            className="min-w-0"
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-5 py-10 text-center text-sm text-black/45">
                  {searchQuery.trim()
                    ? "No customers match your search."
                    : tab === "archived"
                      ? "No archived customers."
                      : "No customers match the selected tags."}
                </li>
              )}
            </ul>
          </div>
        </div>
        )}

        {tagFilterOpen && tagMenuPos ? (
          <div
            ref={tagMenuRef}
            className="fixed z-50 w-72 overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl"
            style={{ top: tagMenuPos.top, left: tagMenuPos.left }}
            role="listbox"
            aria-label="Filter by tags"
          >
            {managingTags ? (
              <>
                <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-black/40">
                  Manage Tags
                </div>
                <ul className="max-h-64 space-y-2 overflow-auto px-3 py-2">
                  {draftTags.length === 0 ? (
                    <li className="px-1 py-3 text-sm text-black/50">
                      No tags left. Save to finish.
                    </li>
                  ) : (
                    draftTags.map((tag) => (
                      <li key={tag.id} className="flex items-center gap-2">
                        <input
                          className="min-w-0 flex-1 rounded border border-black/20 bg-input-grey px-2.5 py-2 text-sm font-normal normal-case text-midnight-ink outline-none transition focus:border-prime-blue"
                          value={tag.name}
                          onChange={(event) =>
                            updateDraftTagName(tag.id, event.target.value)
                          }
                          aria-label={`Rename ${tag.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => deleteDraftTag(tag.id)}
                          className="shrink-0 px-1 text-sm font-semibold text-delete-red transition hover:opacity-80"
                        >
                          Delete
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                <div className="flex items-center justify-between gap-2 border-t border-black/10 p-3">
                  <button
                    type="button"
                    onClick={cancelManagingTags}
                    className="rounded px-2 py-1.5 text-sm font-semibold text-midnight-ink transition hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveManagingTags}
                    className="rounded bg-prime-blue px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-prime-blue-hover"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-black/40">
                  <div className="flex items-center justify-between gap-3">
                    <span>Show Tags</span>
                    <button
                      type="button"
                      onClick={startManagingTags}
                      className="inline-flex h-7 w-7 items-center justify-center rounded bg-transparent text-black/40 transition hover:text-prime-blue"
                      aria-label="Manage tags"
                    >
                      <span className="text-lg leading-none">⚙</span>
                    </button>
                  </div>
                </div>
                <ul className="max-h-64 overflow-auto py-1">
                  {availableTags.map((tag) => {
                    const checked = selectedTags.includes(tag);
                    return (
                      <li key={tag}>
                        <label className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-normal normal-case text-midnight-ink transition hover:bg-black/[0.04]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTag(tag)}
                            className="h-4 w-4 rounded border-black/25 accent-prime-blue"
                          />
                          {tag}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        ) : null}

        {contextMenu ? (
          <div
            ref={contextMenuRef}
            className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
          >
            {COLUMN_DEFS.find((column) => column.id === contextMenu.columnId)
              ?.hideable ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-sm font-semibold text-midnight-ink transition hover:bg-prime-blue/10"
                onClick={() => hideColumn(contextMenu.columnId)}
              >
                Hide {COLUMN_DEFS.find((c) => c.id === contextMenu.columnId)?.label}
              </button>
            ) : null}
            {hiddenHideable.length ? (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/40">
                  Show Column
                </p>
                {hiddenHideable.map((column) => (
                  <button
                    key={column.id}
                    type="button"
                    role="menuitem"
                    className="flex w-full px-3 py-2 text-left text-sm font-semibold text-midnight-ink transition hover:bg-prime-blue/10"
                    onClick={() => showColumn(column.id)}
                  >
                    {column.label}
                  </button>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full border-t border-black/10 px-3 py-2 text-left text-sm font-semibold text-prime-blue transition hover:bg-prime-blue/10"
                  onClick={showAllColumns}
                >
                  Show All Columns
                </button>
              </>
            ) : (
              <p className="px-3 py-2 text-sm text-black/45">
                Drag headers to reorder. Drag edges to resize.
              </p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
