"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  archiveCustomer,
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
  clearCustomerFilterTag,
  customerFilterCount,
  customerFilterTags,
  defaultCustomerFilters,
  matchesAmount,
  matchesCustomerTags,
  type CustomerDirectoryFilters,
} from "@/lib/directory-filters";
import { TopNav } from "@/components/invoice/TopNav";
import { DirectoryFilterPanel } from "@/components/invoice/DirectoryFilterPanel";
import {
  DirectoryFilterTags,
  FilterIconButton,
} from "@/components/invoice/DirectoryFilterTags";
import {
  DirectoryBulkActionBar,
  DirectoryColumnHeader,
  DirectoryColumnsSettingsButton,
  DirectorySelectAllRow,
  DirectoryViewToggle,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW,
  MoneyCell,
  RowSelectCheckbox,
  SearchField,
  SortHeaderButton,
  type DirectoryViewMode,
} from "@/components/invoice/directory-table";
import { DirectoryColumnsPanel } from "@/components/invoice/DirectoryColumnsPanel";
import type { DirectoryColumnDef } from "@/components/invoice/directory-table";
import { RowKebabMenu } from "@/components/invoice/RowKebabMenu";
import type { MenuAction } from "@/components/invoice/MoreActionsMenu";
import { CreatePlusIcon } from "@/components/invoice/ui";
import { useDismissOnOutsideClick } from "@/components/invoice/useDismissOnOutsideClick";
import { UI_CLASS } from "@/lib/design-tokens";

type SortKey =
  | "name"
  | "email"
  | "totalInvoiced"
  | "paid"
  | "outstanding";
type SortDir = "asc" | "desc";
type DirectoryTab = "active" | "archived";
type ColumnId = SortKey | "tags";

const COLUMN_DEFS: DirectoryColumnDef<ColumnId>[] = [
  {
    id: "name",
    label: "Customer Name",
    minWidth: 140,
    defaultWidth: 220,
    hideable: false,
  },
  {
    id: "email",
    label: "Email",
    minWidth: 140,
    defaultWidth: 200,
  },
  {
    id: "totalInvoiced",
    label: "Total",
    minWidth: 110,
    defaultWidth: 140,
  },
  {
    id: "paid",
    label: "Paid",
    minWidth: 90,
    defaultWidth: 120,
  },
  {
    id: "outstanding",
    label: "Outstanding",
    minWidth: 110,
    defaultWidth: 140,
  },
  {
    id: "tags",
    label: "Tags",
    minWidth: 120,
    defaultWidth: 180,
  },
];

const COLUMN_SORTABLE: Partial<Record<ColumnId, SortKey>> = {
  name: "name",
  email: "email",
  totalInvoiced: "totalInvoiced",
  paid: "paid",
  outstanding: "outstanding",
};

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
  }
}

function getCustomerRowActions(tab: DirectoryTab): MenuAction[] {
  if (tab === "archived") {
    return [
      { key: "view", label: "View customer" },
      { key: "unarchive", label: "Unarchive customer", dividerBefore: true },
    ];
  }
  return [
    { key: "view", label: "View customer" },
    { key: "create_invoice", label: "Create invoice" },
    { key: "create_quote", label: "Create quote" },
    {
      key: "archive",
      label: "Archive customer",
      danger: true,
      dividerBefore: true,
    },
  ];
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
            COLUMN_DEFS.some(
              (column) => column.id === id && column.hideable !== false,
            ),
          )
        : [],
    };
  } catch {
    return { order: DEFAULT_ORDER, widths: DEFAULT_WIDTHS, hidden: [] };
  }
}

export default function CustomersDirectoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceEmpty = searchParams.get("empty") === "1";
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<DirectoryTab>("active");
  const [viewMode, setViewMode] = useState<DirectoryViewMode>("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [customerFilters, setCustomerFilters] = useState<CustomerDirectoryFilters>(
    () => defaultCustomerFilters(),
  );
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [managingTags, setManagingTags] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
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
      .filter((column): column is DirectoryColumnDef<ColumnId> => Boolean(column))
      .filter((column) => {
        if (hiddenColumns.includes(column.id) && column.hideable !== false) {
          return false;
        }
        return true;
      });
  }, [columnOrder, hiddenColumns]);

  const orderedColumns = useMemo(() => {
    return columnOrder
      .map((id) => COLUMN_DEFS.find((column) => column.id === id))
      .filter((column): column is DirectoryColumnDef<ColumnId> => Boolean(column));
  }, [columnOrder]);

  const gridTemplateColumns = `40px ${visibleColumns
    .map((column) => `${columnWidths[column.id] ?? column.defaultWidth}px`)
    .join(" ")} 44px`;

  const filteredSortedCustomers = useMemo(() => {
    if (forceEmpty) return [];
    const archived = new Set(archivedIds);
    const filtered = directoryCustomers.filter((customer) => {
      const isArchived = archived.has(customer.id);
      if (tab === "active" && isArchived) return false;
      if (tab === "archived" && !isArchived) return false;
      if (!customerMatchesQuery(customer, searchQuery)) return false;
      if (!matchesCustomerTags(customer.tags, customerFilters.tags)) {
        return false;
      }
      const summary = getCustomerAccountSummary(customer.id);
      if (!matchesAmount(summary.totalInvoiced, customerFilters.total)) {
        return false;
      }
      if (!matchesAmount(summary.outstanding, customerFilters.outstanding)) {
        return false;
      }
      if (!matchesAmount(summary.paid, customerFilters.paid)) {
        return false;
      }
      return true;
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
    customerFilters,
    archivedIds,
    searchQuery,
    tab,
    tagRevision,
    forceEmpty,
  ]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function openTagManager() {
    const button = tagButtonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      setTagMenuPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 280),
      });
    }
    setDraftTags(availableTags.map((tag) => ({ id: tag, name: tag })));
    setManagingTags(true);
    setTagFilterOpen(true);
  }

  function cancelManagingTags() {
    setManagingTags(false);
    setDraftTags([]);
    setTagFilterOpen(false);
  }

  function saveManagingTags() {
    const previousFilterTags = new Set(customerFilters.tags);
    const next = applyCustomerTagEdits(draftTags);
    setAvailableTags(next);
    setCustomerFilters((prev) => ({
      ...prev,
      tags: next.filter((tag) => {
        const draft = draftTags.find(
          (item) => item.name.trim() === tag || item.id === tag,
        );
        if (!draft) return previousFilterTags.has(tag);
        return (
          previousFilterTags.has(draft.id) ||
          previousFilterTags.has(draft.name.trim())
        );
      }),
    }));
    setTagRevision((value) => value + 1);
    setManagingTags(false);
    setDraftTags([]);
    setTagFilterOpen(false);
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

  function handleArchive(customerId: string) {
    const next = archiveCustomer(customerId);
    setArchivedIds(next);
  }

  function handleCustomerAction(customerId: string, key: string) {
    switch (key) {
      case "view":
        router.push(`/customers/new?id=${customerId}`);
        break;
      case "create_invoice":
        router.push("/");
        break;
      case "create_quote":
        router.push("/quote");
        break;
      case "archive":
        handleArchive(customerId);
        break;
      case "unarchive":
        handleUnarchive(customerId);
        break;
      default:
        break;
    }
  }

  function hideColumn(columnId: ColumnId) {
    const def = COLUMN_DEFS.find((column) => column.id === columnId);
    if (!def || def.hideable === false) return;
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

  function toggleColumnVisibility(columnId: ColumnId) {
    const def = COLUMN_DEFS.find((column) => column.id === columnId);
    if (!def || def.hideable === false) return;
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId],
    );
  }

  function moveColumn(fromId: ColumnId, toId: ColumnId) {
    if (fromId === toId) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(fromId);
      const to = next.indexOf(toId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = filteredSortedCustomers.map((c) => c.id);
      const allSelected =
        ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
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

  function handleBulkAction(key: string) {
    const ids = [...selectedIds];
    switch (key) {
      case "create_invoice":
        router.push("/");
        break;
      case "create_quote":
        router.push("/quote");
        break;
      case "archive":
        ids.forEach((id) => {
          const next = archiveCustomer(id);
          setArchivedIds(next);
        });
        setSelectedIds(new Set());
        break;
      case "unarchive":
        ids.forEach((id) => {
          const next = unarchiveCustomer(id);
          setArchivedIds(next);
        });
        setSelectedIds(new Set());
        break;
      default:
        break;
    }
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

  const activeTags = customerFilterTags(customerFilters);
  const activeFilterCount = customerFilterCount(customerFilters);
  const hiddenHideable = COLUMN_DEFS.filter(
    (column) =>
      column.hideable !== false && hiddenColumns.includes(column.id),
  );

  const allVisibleSelected =
    filteredSortedCustomers.length > 0 &&
    filteredSortedCustomers.every((c) => selectedIds.has(c.id));
  const someVisibleSelected = filteredSortedCustomers.some((c) =>
    selectedIds.has(c.id),
  );

  const customerBulkActions = useMemo(() => {
    if (selectedIds.size === 0) return [] as MenuAction[];
    if (tab === "archived") {
      return [{ key: "unarchive", label: "Unarchive customer" }];
    }
    return [
      { key: "create_invoice", label: "Create invoice" },
      { key: "create_quote", label: "Create quote" },
      { key: "archive", label: "Archive customer", danger: true },
    ];
  }, [selectedIds.size, tab]);

  const showTrueEmpty =
    forceEmpty ||
    (!searchQuery.trim() &&
      activeFilterCount === 0 &&
      tab !== "archived" &&
      filteredSortedCustomers.length === 0);

  const customersEmptyState = forceEmpty ? (
    <div className="rounded-xl border border-black/10 bg-white px-5 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/onboard-icon-people.png"
        alt=""
        className="mx-auto mb-5 h-14 w-14 object-contain sm:h-16 sm:w-16"
      />
      <p className="type-headline-6 text-midnight-ink">
        Create your first customer!
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/customers/new?empty=1"
          className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center justify-center gap-2 px-5`}
        >
          <CreatePlusIcon />
          Create New Customer
        </Link>
      </div>
    </div>
  ) : (
    <div className="rounded-xl border border-black/10 bg-white px-5 py-16 text-center">
      <p className="type-headline-6 text-midnight-ink">
        {searchQuery.trim() || activeFilterCount > 0
          ? "No customers match your filters."
          : tab === "archived"
            ? "No archived customers."
            : "No customers yet."}
      </p>
      {showTrueEmpty ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/customers/new?empty=1"
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center justify-center gap-2 px-5`}
          >
            <CreatePlusIcon />
            Create New Customer
          </Link>
        </div>
      ) : null}
    </div>
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
              customer.tags.map((tag) => (
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
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main
        className={`mx-auto max-w-6xl px-6 py-12 sm:px-8 ${
          selectedIds.size > 0 ? "pb-28" : ""
        }`}
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">Customers</h1>
            <p className="mt-2 type-subtitle-1 text-black/55">
              Customer directory for invoicing and quoting.
            </p>
          </div>
          {!forceEmpty ? (
            <Link
              href="/customers/new"
              className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center justify-center gap-2 px-5`}
            >
              <CreatePlusIcon />
              Create New Customer
            </Link>
          ) : null}
        </div>

        {!forceEmpty ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
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
                    onClick={() => {
                      setTab(id);
                      setSelectedIds(new Set());
                    }}
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
            </div>

            <div className="mb-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <SearchField
                  id="customer-search"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by customer name, email, tags..."
                  label="Search customers"
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
            (filteredSortedCustomers.length > 0 || activeTags.length > 0) ? (
              <DirectorySelectAllRow
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onChange={toggleSelectAllVisible}
                label="Select all visible customers"
                filters={
                  activeTags.length > 0 ? (
                    <DirectoryFilterTags
                      className=""
                      tags={activeTags}
                      onRemove={(id) =>
                        setCustomerFilters((prev) =>
                          clearCustomerFilterTag(prev, id),
                        )
                      }
                      onClearAll={() =>
                        setCustomerFilters(defaultCustomerFilters())
                      }
                    />
                  ) : undefined
                }
              />
            ) : activeTags.length > 0 ? (
              <DirectoryFilterTags
                tags={activeTags}
                onRemove={(id) =>
                  setCustomerFilters((prev) => clearCustomerFilterTag(prev, id))
                }
                onClearAll={() => setCustomerFilters(defaultCustomerFilters())}
              />
            ) : null}
          </>
        ) : null}

        {forceEmpty || filteredSortedCustomers.length === 0 ? (
          customersEmptyState
        ) : viewMode === "card" ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSortedCustomers.map((customer) => {
                const summary = getCustomerAccountSummary(customer.id);
                const selected = selectedIds.has(customer.id);
                return (
                  <li key={customer.id}>
                    <div
                      className={`flex h-full flex-col gap-3 rounded-[10px] border bg-white p-5 transition ${
                        selected
                          ? "border-prime-blue ring-1 ring-prime-blue"
                          : "border-black/10 hover:border-prime-blue hover:ring-1 hover:ring-prime-blue"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <RowSelectCheckbox
                          checked={selected}
                          onChange={() => toggleRowSelected(customer.id)}
                          label={`Select ${customer.name}`}
                        />
                        <Link
                          href={`/customers/new?id=${customer.id}`}
                          className="min-w-0 flex-1"
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
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                            <div>
                              <dt className="text-xs text-black/45">Total</dt>
                              <dd className="mt-0.5 font-medium">
                                <MoneyCell
                                  amount={summary.totalInvoiced}
                                  variant="total"
                                  align="left"
                                />
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-black/45">
                                Outstanding
                              </dt>
                              <dd className="mt-0.5 font-medium">
                                <MoneyCell
                                  amount={summary.outstanding}
                                  variant="outstanding"
                                  align="left"
                                />
                              </dd>
                            </div>
                          </dl>
                          {customer.tags.length ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
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
                        </Link>
                      </div>
                      {tab === "archived" ? (
                        <button
                          type="button"
                          onClick={() => handleUnarchive(customer.id)}
                          className="text-left text-sm font-semibold text-prime-blue underline-offset-2 hover:underline"
                        >
                          Unarchive Customer
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
        ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <div className="min-w-max">
            <div
              className={DIRECTORY_HEADER_ROW}
              style={{
                display: "grid",
                gridTemplateColumns,
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div className="flex items-center">
                <RowSelectCheckbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  label="Select all visible customers"
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
                          openTagManager();
                        }}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded transition hover:bg-black/[0.04] ${
                          tagFilterOpen
                            ? "text-prime-blue"
                            : "text-black/45"
                        }`}
                        aria-haspopup="dialog"
                        aria-expanded={tagFilterOpen}
                        aria-label="Manage tags"
                      >
                        <span className="text-base leading-none" aria-hidden>
                          ⚙
                        </span>
                      </button>
                    </div>
                  ) : COLUMN_SORTABLE[column.id] ? (
                    <SortHeaderButton
                      label={column.label}
                      active={sortKey === COLUMN_SORTABLE[column.id]}
                      dir={sortDir}
                      onClick={() => toggleSort(COLUMN_SORTABLE[column.id]!)}
                      align={
                        column.id === "totalInvoiced" ||
                        column.id === "paid" ||
                        column.id === "outstanding"
                          ? "right"
                          : "left"
                      }
                    />
                  ) : (
                    <span>{column.label}</span>
                  )}
                </DirectoryColumnHeader>
              ))}
              <div className="flex items-center justify-end pr-1" aria-hidden>
                <span className="sr-only">Actions</span>
              </div>
            </div>

            <ul>
              {filteredSortedCustomers.map((customer, index) => (
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
                      <div className="flex items-center">
                        <RowSelectCheckbox
                          checked={selectedIds.has(customer.id)}
                          onChange={() => toggleRowSelected(customer.id)}
                          label={`Select ${customer.name}`}
                        />
                      </div>
                      {visibleColumns.map((column) => (
                        <Link
                          key={column.id}
                          href={`/customers/new?id=${customer.id}`}
                          className="min-w-0"
                        >
                          {renderCell(customer, column.id)}
                        </Link>
                      ))}
                      <RowKebabMenu
                        label={`Actions for ${customer.name}`}
                        actions={getCustomerRowActions(tab)}
                        onAction={(key) =>
                          handleCustomerAction(customer.id, key)
                        }
                      />
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        )}

        {selectedIds.size > 0 ? (
          <DirectoryBulkActionBar
            count={selectedIds.size}
            actions={customerBulkActions}
            onClear={() => setSelectedIds(new Set())}
            onAction={handleBulkAction}
          />
        ) : null}

        <DirectoryColumnsPanel
          open={columnsOpen}
          onClose={() => setColumnsOpen(false)}
          columns={orderedColumns}
          hiddenIds={hiddenColumns}
          onToggle={toggleColumnVisibility}
          onMove={moveColumn}
        />

        {tagFilterOpen && tagMenuPos && managingTags ? (
          <div
            ref={tagMenuRef}
            className="fixed z-50 w-72 overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl"
            style={{ top: tagMenuPos.top, left: tagMenuPos.left }}
            role="dialog"
            aria-label="Manage tags"
          >
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
          </div>
        ) : null}

        <DirectoryFilterPanel
          kind="customers"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          customerFilters={customerFilters}
          availableTags={availableTags}
          onApplyCustomer={setCustomerFilters}
        />

        {contextMenu ? (
          <div
            ref={contextMenuRef}
            className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
          >
            {COLUMN_DEFS.find((column) => column.id === contextMenu.columnId)
              ?.hideable !== false ? (
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
