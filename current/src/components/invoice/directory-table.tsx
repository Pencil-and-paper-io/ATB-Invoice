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
import {
  isDownloadMenuActionKey,
  isManualMarkActionKey,
  isMarkMenuActionKey,
  isSendActionKey,
  isSendMenuActionKey,
} from "@/lib/invoice-actions";

export type DirectoryColumnDef<Id extends string> = {
  id: Id;
  label: string;
  minWidth: number;
  defaultWidth: number;
  hideable?: boolean;
  /** Hidden until the user turns it on in column settings. */
  defaultHidden?: boolean;
};

export const MONEY_CELL = {
  total: "font-mono tabular-nums text-black/70",
  paid: "font-mono tabular-nums text-[#1B7A4E]",
  outstanding: "font-mono tabular-nums text-status-danger",
  zero: "font-mono tabular-nums text-black/35",
} as const;

type MoneyVariant = "total" | "paid" | "outstanding";

export function MoneyCell({
  amount,
  variant,
  query = "",
  align = "right",
}: {
  amount: number;
  variant: MoneyVariant;
  query?: string;
  align?: "left" | "right";
}) {
  const isZeroMoney =
    (variant === "paid" || variant === "outstanding") &&
    Math.abs(amount) < 0.005;
  const toneClass = isZeroMoney ? MONEY_CELL.zero : MONEY_CELL[variant];
  const alignClass = align === "left" ? "text-left" : "text-right";
  const formatted = formatMoney(amount);
  const q = query.trim();
  if (!q || !formatted.toLowerCase().includes(q.toLowerCase())) {
    return (
      <span className={`block w-full ${alignClass} ${toneClass}`}>
        {formatted}
      </span>
    );
  }

  const lower = formatted.toLowerCase();
  const lowerQ = q.toLowerCase();
  const idx = lower.indexOf(lowerQ);
  if (idx < 0) {
    return (
      <span className={`block w-full ${alignClass} ${toneClass}`}>
        {formatted}
      </span>
    );
  }
  const end = idx + q.length;
  return (
    <span className={`block w-full ${alignClass} ${toneClass}`}>
      {formatted.slice(0, idx)}
      <mark className="rounded-sm bg-sunshine-yellow/70 px-0.5 text-inherit">
        {formatted.slice(idx, end)}
      </mark>
      {formatted.slice(end)}
    </span>
  );
}

export function DateCell({
  value,
  query = "",
  className = "",
}: {
  value: string;
  query?: string;
  className?: string;
}) {
  const display = formatDirectoryDate(value);
  const q = query.trim();
  let content: ReactNode = display;

  if (q) {
    const lowerDisplay = display.toLowerCase();
    const lowerQ = q.toLowerCase();
    const matchIdx = lowerDisplay.indexOf(lowerQ);
    if (matchIdx >= 0) {
      const end = matchIdx + q.length;
      content = (
        <>
          {display.slice(0, matchIdx)}
          <mark className="rounded-sm bg-sunshine-yellow/70 px-0.5 text-inherit">
            {display.slice(matchIdx, end)}
          </mark>
          {display.slice(end)}
        </>
      );
    }
  }

  return <span className={className}>{content}</span>;
}

/** Display dates like "Jul 2, '26" instead of "Jul 2, 2026". */
export function formatDirectoryDate(value: string) {
  return value.replace(/\b(?:19|20)(\d{2})\b/g, "'$1");
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
  fill = false,
}: {
  tabs: readonly string[];
  value: string;
  onChange: (next: string) => void;
  label: string;
  /** Equal-width tabs that stay inside the container (no overflow). */
  fill?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-black/10 bg-white p-1 ${
        fill
          ? "flex w-full min-w-0 overflow-hidden"
          : "inline-flex w-max max-w-none flex-nowrap"
      }`}
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
            title={tab}
            className={`rounded-md transition ${
              fill
                ? "min-w-0 flex-1 basis-0 px-1 py-2 text-center text-[11px] font-semibold leading-snug sm:px-1.5 sm:text-xs lg:text-sm"
                : "shrink-0 px-3 py-2 text-sm font-semibold whitespace-nowrap sm:px-4"
            } ${
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

export type DirectoryViewMode = "list" | "card";

/** Extra room required beyond the table’s min width before list view is allowed. */
export const DIRECTORY_LIST_FIT_BUFFER_PX = 40;
const DIRECTORY_ROW_CHECKBOX_PX = 40;
const DIRECTORY_ROW_ACTIONS_PX = 44;
const DIRECTORY_COLUMN_GAP_PX = 16;

/** Preferred/min pixel width of a directory list table (checkbox + columns + kebab + gaps). */
export function directoryTableMinWidthPx(columnWidthsPx: number[]) {
  const trackCount = columnWidthsPx.length + 2;
  const gapTotal = Math.max(0, trackCount - 1) * DIRECTORY_COLUMN_GAP_PX;
  const columnsTotal = columnWidthsPx.reduce((sum, width) => sum + width, 0);
  return (
    DIRECTORY_ROW_CHECKBOX_PX +
    DIRECTORY_ROW_ACTIONS_PX +
    columnsTotal +
    gapTotal
  );
}

/**
 * Force card view below the Tailwind `lg` breakpoint (1024px).
 * Wide tables scroll horizontally on desktop instead of locking list view off
 * when column widths exceed the content max-width.
 */
export function useForceDirectoryCardView(
  _containerRef?: RefObject<HTMLElement | null>,
  _tableMinWidthPx?: number,
) {
  const [forceCard, setForceCard] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setForceCard(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return forceCard;
}

export function DirectoryViewToggle({
  value,
  onChange,
}: {
  value: DirectoryViewMode;
  onChange: (next: DirectoryViewMode) => void;
}) {
  return (
    <div
      className="inline-flex h-11 shrink-0 items-stretch overflow-hidden rounded-md border border-black/15 bg-white"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        title="List view"
        className={`inline-flex w-11 items-center justify-center transition ${
          value === "list"
            ? "bg-midnight-ink text-white"
            : "text-black/50 hover:bg-black/[0.04] hover:text-black"
        }`}
      >
        <ListViewIcon />
        <span className="sr-only">List view</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={value === "card"}
        title="Card view"
        className={`inline-flex w-11 items-center justify-center border-l border-black/10 transition ${
          value === "card"
            ? "bg-midnight-ink text-white"
            : "text-black/50 hover:bg-black/[0.04] hover:text-black"
        }`}
      >
        <CardViewIcon />
        <span className="sr-only">Card view</span>
      </button>
    </div>
  );
}

export function DirectoryColumnsSettingsButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-black/15 bg-white text-midnight-ink transition hover:bg-black/[0.03]"
      aria-label="Column settings"
      title="Column settings"
    >
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M6.5 2.5h3l.4 1.6a4.5 4.5 0 0 1 1.1.64l1.55-.55 1.5 2.6-1.25 1.05c.05.28.07.57.07.86s-.02.58-.07.86l1.25 1.05-1.5 2.6-1.55-.55a4.5 4.5 0 0 1-1.1.64L9.5 13.5h-3l-.4-1.6a4.5 4.5 0 0 1-1.1-.64l-1.55.55-1.5-2.6 1.25-1.05A4.6 4.6 0 0 1 3.13 8c0-.29.02-.58.07-.86L1.95 6.09l1.5-2.6 1.55.55c.33-.27.7-.49 1.1-.64L6.5 2.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}

export function RowSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2"
      onClick={(event) => event.stopPropagation()}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-prime-blue"
        aria-label={label}
      />
    </label>
  );
}

export function DirectorySelectAllRow({
  checked,
  indeterminate = false,
  onChange,
  label = "Select all",
  filters,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
  filters?: ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  const hasFilters = Boolean(filters);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-midnight-ink">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 shrink-0 accent-prime-blue"
          aria-label={label}
        />
        Select all
      </label>
      {hasFilters ? (
        <>
          <div className="h-5 w-px shrink-0 bg-black/15" aria-hidden />
          <div className="min-w-0 flex-1">{filters}</div>
        </>
      ) : null}
    </div>
  );
}

export function DirectoryBulkActionBar({
  count,
  actions,
  onClear,
  onAction,
}: {
  count: number;
  actions: {
    key: string;
    label: string;
    danger?: boolean;
    sectionTitleBefore?: string;
    submenu?: { key: string; label: string }[];
  }[];
  onClear: () => void;
  onAction: (key: string) => void;
}) {
  const flatActions = actions.filter(
    (action) =>
      !isManualMarkActionKey(action.key) &&
      !isSendActionKey(action.key) &&
      !isDownloadMenuActionKey(action.key) &&
      !isMarkMenuActionKey(action.key) &&
      !isSendMenuActionKey(action.key),
  );
  const sendAction = actions.find((action) => isSendMenuActionKey(action.key));
  const downloadAction = actions.find((action) =>
    isDownloadMenuActionKey(action.key),
  );
  const markAction = actions.find((action) => isMarkMenuActionKey(action.key));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6">
      <div className="pointer-events-auto flex max-w-[1180px] flex-wrap items-center gap-3 rounded-[12px] bg-midnight-ink px-5 py-3.5 shadow-[0_12px_40px_rgb(0_0_0_/0.35)]">
        <p className="type-body font-semibold text-white">{count} selected</p>
        <div
          className="mx-1 hidden h-6 w-px bg-white/20 sm:block"
          aria-hidden
        />
        <div className="flex flex-wrap items-center gap-2">
          {sendAction?.submenu?.length ? (
            <BulkSubmenuButton
              label={sendAction.label}
              actions={sendAction.submenu}
              onAction={onAction}
            />
          ) : null}
          {markAction?.submenu?.length ? (
            <BulkSubmenuButton
              label={markAction.label}
              actions={markAction.submenu}
              onAction={onAction}
            />
          ) : null}
          {downloadAction?.submenu?.length ? (
            <BulkSubmenuButton
              label={downloadAction.label}
              actions={downloadAction.submenu}
              onAction={onAction}
            />
          ) : null}
          {flatActions.map((action) =>
            action.submenu?.length ? (
              <BulkSubmenuButton
                key={action.key}
                label={action.label}
                actions={action.submenu}
                onAction={onAction}
              />
            ) : (
              <button
                key={action.key}
                type="button"
                onClick={() => onAction(action.key)}
                className={`inline-flex h-10 items-center justify-center rounded px-4 text-sm font-semibold text-white transition hover:opacity-90 ${
                  action.danger ? "bg-delete-red" : "bg-prime-blue"
                }`}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-sm font-semibold text-white/80 underline underline-offset-2 transition hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function BulkSubmenuButton({
  label,
  actions,
  onAction,
}: {
  label: string;
  actions: { key: string; label: string }[];
  onAction: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 items-stretch overflow-hidden rounded bg-prime-blue text-sm font-semibold text-white transition hover:opacity-90"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex items-center px-4">{label}</span>
        <span className="flex w-10 items-center justify-center bg-black/20">
          <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
            <path
              d={open ? "M1 5l4.5-4L10 5" : "M1 1l4.5 4L10 1"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 min-w-[200px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              onClick={() => {
                onAction(action.key);
                setOpen(false);
              }}
              className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-midnight-ink transition hover:bg-black/[0.04]"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ListViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4h12M2 8h12M2 12h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2"
        y="2"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="2"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="2"
        y="9"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="9"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/**
 * Toolbar layouts:
 * - stacked: status / date / search left; view toggle right (invoices/quotes)
 * - inline: tabs left; date / search / view right (customers)
 */
export function DirectoryToolbar({
  tabs,
  children,
  secondaryFilters,
  viewToggle,
  layout = "stacked",
}: {
  tabs?: ReactNode;
  children: ReactNode;
  secondaryFilters?: ReactNode;
  viewToggle?: ReactNode;
  layout?: "stacked" | "inline";
}) {
  if (layout === "inline") {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {tabs ? <div className="shrink-0">{tabs}</div> : null}
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
          {secondaryFilters}
          <div className="w-full max-w-[19.5rem] sm:w-[19.5rem]">{children}</div>
          {viewToggle}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {tabs ? <div className="w-full min-w-0">{tabs}</div> : null}
      {secondaryFilters}
      <div className="min-w-0 w-[19.5rem] max-w-full">{children}</div>
      {viewToggle ? <div className="ml-auto shrink-0">{viewToggle}</div> : null}
    </div>
  );
}

export function SortHeaderButton({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 transition hover:text-black/70 ${
        align === "right" ? "w-full justify-end text-right" : "text-left"
      }`}
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
  "border-b border-black/10 bg-[#FAFAFA] px-5 py-4 text-xs font-semibold text-black/55";

/** Shared shell for directory / dashboard document cards. */
export const DIRECTORY_CARD_CLASS =
  "flex h-full flex-col gap-3 rounded-[10px] border border-black/10 bg-white p-5 transition hover:border-prime-blue";

export const DIRECTORY_CARD_SELECTED_CLASS =
  "flex h-full flex-col gap-3 rounded-[10px] border border-prime-blue bg-white p-5 transition";


/** Sticky under TopNav (60px). Use on invoice/quote directory tables. */
export const DIRECTORY_HEADER_ROW_STICKY =
  `${DIRECTORY_HEADER_ROW} sticky top-[60px] z-30`;
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
      <div className="flex min-h-[1.25rem] items-center pr-2">{children}</div>
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

function defaultHiddenIds<Id extends string>(defs: DirectoryColumnDef<Id>[]) {
  return defs
    .filter(
      (column) => column.defaultHidden && column.hideable !== false,
    )
    .map((column) => column.id);
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
  const defaultHidden = defaultHiddenIds(defs);

  if (typeof window === "undefined") {
    return {
      order: defaultOrder,
      widths: defaultWidths,
      hidden: defaultHidden,
    };
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        order: defaultOrder,
        widths: defaultWidths,
        hidden: defaultHidden,
      };
    }
    const parsed = JSON.parse(raw) as {
      order?: Id[];
      widths?: Partial<Record<Id, number>>;
      hidden?: Id[];
    };
    const savedOrder = Array.isArray(parsed.order) ? parsed.order : [];
    const order = [
      ...savedOrder.filter((id) => defs.some((column) => column.id === id)),
      ...defaultOrder.filter((id) => !savedOrder.includes(id)),
    ];
    const newlyAddedHidden = defaultOrder.filter((id) => {
      if (savedOrder.includes(id)) return false;
      return defs.some(
        (column) =>
          column.id === id &&
          column.defaultHidden &&
          column.hideable !== false,
      );
    });
    const savedHidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((id) =>
          defs.some((column) => column.id === id && column.hideable !== false),
        )
      : defaultHidden;
    return {
      order,
      widths: { ...defaultWidths, ...(parsed.widths ?? {}) },
      hidden: [...new Set([...savedHidden, ...newlyAddedHidden])],
    };
  } catch {
    return {
      order: defaultOrder,
      widths: defaultWidths,
      hidden: defaultHidden,
    };
  }
}

export function useDirectoryColumns<Id extends string>(
  storageKey: string,
  defs: DirectoryColumnDef<Id>[],
  options?: { fluid?: boolean },
) {
  const fluid = options?.fluid ?? false;
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
  const [hiddenColumns, setHiddenColumns] = useState<Id[]>(() =>
    defaultHiddenIds(defs),
  );
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
    .map((column) => {
      const weight = columnWidths[column.id] ?? column.defaultWidth;
      return fluid ? `minmax(0, ${weight}fr)` : `${weight}px`;
    })
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
    orderedColumns: columnOrder
      .map((id) => defs.find((column) => column.id === id))
      .filter((column): column is DirectoryColumnDef<Id> => Boolean(column)),
    gridTemplateColumns,
    columnWidths,
    hiddenColumns,
    contextMenu,
    setContextMenu,
    onHeaderDragStart,
    onHeaderDrop,
    startResize,
    hideColumn,
    showColumn,
    showAllColumns,
    toggleColumnVisibility: (columnId: Id) => {
      const def = defs.find((column) => column.id === columnId);
      if (!def || def.hideable === false) return;
      setHiddenColumns((prev) =>
        prev.includes(columnId)
          ? prev.filter((id) => id !== columnId)
          : [...prev, columnId],
      );
    },
    moveColumn: (fromId: Id, toId: Id) => {
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
    },
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

export const DIRECTORY_PAGE_SIZE = 20;

type PageItem = number | "ellipsis";

/** Build a compact page list with ellipses (first/last always visible). */
function buildPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total]);
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 3);
    pages.add(total - 2);
    pages.add(total - 1);
  }

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  }
  return items;
}

export function DirectoryPagination({
  page,
  pageSize = DIRECTORY_PAGE_SIZE,
  totalItems,
  onPageChange,
}: {
  page: number;
  pageSize?: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  const pageItems = buildPageItems(safePage, totalPages);

  return (
    <nav
      className="mt-6 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"
      aria-label="Pagination"
    >
      <p className="text-sm text-black/55 sm:justify-self-start">
        Showing{" "}
        <span className="font-medium text-midnight-ink">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-midnight-ink">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-self-center">
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-md border border-black/15 bg-white px-3 text-sm font-semibold text-midnight-ink transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          Previous
        </button>

        <ul className="flex flex-wrap items-center justify-center gap-1.5">
          {pageItems.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <li
                  key={`ellipsis-${index}`}
                  className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-black/40"
                  aria-hidden
                >
                  …
                </li>
              );
            }

            const isCurrent = item === safePage;
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-sm font-semibold transition ${
                    isCurrent
                      ? "bg-prime-blue text-white"
                      : "border border-black/15 bg-white text-midnight-ink hover:bg-black/[0.03]"
                  }`}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-md border border-black/15 bg-white px-3 text-sm font-semibold text-midnight-ink transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      <span className="hidden sm:block" aria-hidden />
    </nav>
  );
}
