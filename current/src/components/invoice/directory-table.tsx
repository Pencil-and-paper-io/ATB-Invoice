"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { formatMoney } from "@/lib/invoice-demo-data";

export type DirectoryColumnDef<Id extends string> = {
  id: Id;
  label: string;
  minWidth: number;
  defaultWidth: number;
  hideable?: boolean;
};

export const MONEY_CELL = {
  total: "tabular-nums text-black/70",
  paid: "tabular-nums text-[#1B7A4E]",
  outstanding: "tabular-nums text-status-danger",
  zero: "tabular-nums text-black/35",
} as const;

type MoneyVariant = "total" | "paid" | "outstanding";

export function MoneyCell({
  amount,
  variant,
  query = "",
}: {
  amount: number;
  variant: MoneyVariant;
  query?: string;
}) {
  const isZeroMoney =
    (variant === "paid" || variant === "outstanding") &&
    Math.abs(amount) < 0.005;
  const toneClass = isZeroMoney ? MONEY_CELL.zero : MONEY_CELL[variant];
  const formatted = formatMoney(amount);
  const q = query.trim();
  if (!q || !formatted.toLowerCase().includes(q.toLowerCase())) {
    return <span className={toneClass}>{formatted}</span>;
  }

  const lower = formatted.toLowerCase();
  const lowerQ = q.toLowerCase();
  const idx = lower.indexOf(lowerQ);
  if (idx < 0) {
    return <span className={toneClass}>{formatted}</span>;
  }
  const end = idx + q.length;
  return (
    <span className={toneClass}>
      {formatted.slice(0, idx)}
      <mark className="rounded-sm bg-sunshine-yellow/70 px-0.5 text-inherit">
        {formatted.slice(idx, end)}
      </mark>
      {formatted.slice(end)}
    </span>
  );
}

export function SearchField({
  id,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M11 11 14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-black/15 bg-white py-2 pl-10 pr-10 text-sm outline-none focus:border-prime-blue [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {value.trim() ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-1.5 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-prime-blue transition hover:bg-prime-blue/10"
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function StatusToggleTabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly string[];
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex w-max max-w-none flex-nowrap rounded-lg border border-black/10 bg-white p-1"
      role="tablist"
      aria-label={label}
    >
      {tabs.map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap transition sm:px-4 ${
              active
                ? "bg-midnight-ink text-white"
                : "text-black/55 hover:text-black"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

/** Toolbar: search (+ optional filters) on one row; status tabs below. */
export function DirectoryToolbar({
  tabs,
  children,
  secondaryFilters,
}: {
  tabs: ReactNode;
  children: ReactNode;
  secondaryFilters?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 w-full max-w-md flex-1">{children}</div>
        {secondaryFilters}
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto">{tabs}</div>
    </div>
  );
}

export function SortHeaderButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-left transition hover:text-black/70"
    >
      {label}
      <svg width="8" height="10" viewBox="0 0 8 10" fill="none" aria-hidden>
        <path
          d="M4 1 7 4H1L4 1Z"
          fill="currentColor"
          opacity={active && dir === "asc" ? 0.85 : 0.35}
        />
        <path
          d="M4 9 1 6h6L4 9Z"
          fill="currentColor"
          opacity={active && dir === "desc" ? 0.85 : 0.35}
        />
      </svg>
    </button>
  );
}

export const DIRECTORY_HEADER_ROW =
  "border-b border-black/10 bg-black/[0.02] px-5 py-4 text-xs font-semibold text-black/55";
export const DIRECTORY_BODY_ROW =
  "px-5 py-5 text-sm text-black transition hover:bg-prime-blue/5";

/** Column header cell with faint dotted edge guides + resize handle. */
export function DirectoryColumnHeader({
  label,
  isLast,
  children,
  onDragStart,
  onDrop,
  onContextMenu,
  onResizeStart,
}: {
  label: string;
  isLast: boolean;
  children: ReactNode;
  onDragStart: () => void;
  onDrop: () => void;
  onContextMenu: (event: ReactMouseEvent) => void;
  onResizeStart: (clientX: number) => void;
}) {
  return (
    <div
      className={`relative select-none ${
        isLast ? "" : "border-r border-dotted border-black/20"
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
    >
      <div className="pr-2">{children}</div>
      <button
        type="button"
        aria-label={`Resize ${label} column`}
        className="absolute -right-1.5 top-0 z-10 h-full w-3 cursor-col-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onResizeStart(event.clientX);
        }}
      />
    </div>
  );
}

function loadColumnPrefs<Id extends string>(
  storageKey: string,
  defs: DirectoryColumnDef<Id>[],
): {
  order: Id[];
  widths: Record<Id, number>;
  hidden: Id[];
} {
  const defaultOrder = defs.map((column) => column.id);
  const defaultWidths = Object.fromEntries(
    defs.map((column) => [column.id, column.defaultWidth]),
  ) as Record<Id, number>;

  if (typeof window === "undefined") {
    return { order: defaultOrder, widths: defaultWidths, hidden: [] };
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return { order: defaultOrder, widths: defaultWidths, hidden: [] };
    }
    const parsed = JSON.parse(raw) as {
      order?: Id[];
      widths?: Partial<Record<Id, number>>;
      hidden?: Id[];
    };
    const order = Array.isArray(parsed.order)
      ? [
          ...parsed.order.filter((id) => defs.some((column) => column.id === id)),
          ...defaultOrder.filter((id) => !parsed.order?.includes(id)),
        ]
      : defaultOrder;
    return {
      order,
      widths: { ...defaultWidths, ...(parsed.widths ?? {}) },
      hidden: Array.isArray(parsed.hidden)
        ? parsed.hidden.filter((id) =>
            defs.some((column) => column.id === id && column.hideable !== false),
          )
        : [],
    };
  } catch {
    return { order: defaultOrder, widths: defaultWidths, hidden: [] };
  }
}

export function useDirectoryColumns<Id extends string>(
  storageKey: string,
  defs: DirectoryColumnDef<Id>[],
) {
  const defaultOrder = useMemo(() => defs.map((column) => column.id), [defs]);
  const defaultWidths = useMemo(
    () =>
      Object.fromEntries(
        defs.map((column) => [column.id, column.defaultWidth]),
      ) as Record<Id, number>,
    [defs],
  );

  const [columnOrder, setColumnOrder] = useState<Id[]>(defaultOrder);
  const [columnWidths, setColumnWidths] =
    useState<Record<Id, number>>(defaultWidths);
  const [hiddenColumns, setHiddenColumns] = useState<Id[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draggingColumn, setDraggingColumn] = useState<Id | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    columnId: Id;
  } | null>(null);
  const resizeRef = useRef<{
    columnId: Id;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    const prefs = loadColumnPrefs(storageKey, defs);
    setColumnOrder(prefs.order);
    setColumnWidths(prefs.widths);
    setHiddenColumns(prefs.hidden);
    setHydrated(true);
  }, [defs, storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        order: columnOrder,
        widths: columnWidths,
        hidden: hiddenColumns,
      }),
    );
  }, [columnOrder, columnWidths, hiddenColumns, hydrated, storageKey]);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      if (!resizeRef.current) return;
      const def = defs.find(
        (column) => column.id === resizeRef.current?.columnId,
      );
      if (!def) return;
      const nextWidth = Math.max(
        def.minWidth,
        resizeRef.current.startWidth +
          (event.clientX - resizeRef.current.startX),
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
  }, [defs]);

  const visibleColumns = useMemo(
    () =>
      columnOrder
        .map((id) => defs.find((column) => column.id === id))
        .filter((column): column is DirectoryColumnDef<Id> => Boolean(column))
        .filter(
          (column) =>
            !(hiddenColumns.includes(column.id) && column.hideable !== false),
        ),
    [columnOrder, defs, hiddenColumns],
  );

  const gridTemplateColumns = visibleColumns
    .map((column) => `${columnWidths[column.id] ?? column.defaultWidth}px`)
    .join(" ");

  const onHeaderDragStart = useCallback((columnId: Id) => {
    setDraggingColumn(columnId);
  }, []);

  const onHeaderDrop = useCallback(
    (targetId: Id) => {
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

  function startResize(columnId: Id, clientX: number) {
    const def = defs.find((column) => column.id === columnId);
    if (!def) return;
    resizeRef.current = {
      columnId,
      startX: clientX,
      startWidth: columnWidths[columnId] ?? def.defaultWidth,
    };
  }

  function hideColumn(columnId: Id) {
    const def = defs.find((column) => column.id === columnId);
    if (!def || def.hideable === false) return;
    setHiddenColumns((prev) =>
      prev.includes(columnId) ? prev : [...prev, columnId],
    );
    setContextMenu(null);
  }

  function showColumn(columnId: Id) {
    setHiddenColumns((prev) => prev.filter((id) => id !== columnId));
    setContextMenu(null);
  }

  function showAllColumns() {
    setHiddenColumns([]);
    setContextMenu(null);
  }

  const hiddenHideable = defs.filter(
    (column) =>
      column.hideable !== false && hiddenColumns.includes(column.id),
  );

  return {
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
  };
}

export function ColumnContextMenu({
  menuRef,
  contextMenu,
  columnLabel,
  canHide,
  hiddenHideable,
  onHide,
  onShow,
  onShowAll,
  onClose,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  contextMenu: { x: number; y: number } | null;
  columnLabel: string;
  canHide: boolean;
  hiddenHideable: { id: string; label: string }[];
  onHide: () => void;
  onShow: (id: string) => void;
  onShowAll: () => void;
  onClose: () => void;
}): ReactNode {
  if (!contextMenu) return null;
  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] rounded-lg border border-black/10 bg-white py-1 shadow-lg"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      role="menu"
    >
      <p className="px-3 py-1.5 text-xs font-semibold text-black/45">
        {columnLabel}
      </p>
      {canHide ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
          onClick={onHide}
        >
          Hide {columnLabel}
        </button>
      ) : null}
      {hiddenHideable.length ? (
        <>
          <div className="my-1 border-t border-black/10" />
          <p className="px-3 py-1 text-xs font-semibold text-black/45">
            Show column
          </p>
          {hiddenHideable.map((column) => (
            <button
              key={column.id}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
              onClick={() => onShow(column.id)}
            >
              {column.label}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm font-semibold text-prime-blue hover:bg-black/[0.04]"
            onClick={onShowAll}
          >
            Show all columns
          </button>
        </>
      ) : null}
      <div className="my-1 border-t border-black/10" />
      <p className="px-3 py-2 text-xs text-black/45">
        Drag headers to reorder. Drag edges to resize.
      </p>
      <button
        type="button"
        className="sr-only"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}
