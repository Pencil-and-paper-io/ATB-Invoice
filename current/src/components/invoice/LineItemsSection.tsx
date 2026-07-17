"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeInvoiceTotals,
  computeLineTotal,
  formatDiscountChip,
  matchAlbertaTaxOptions,
  ALBERTA_TAX_TOOLTIP,
  TAX_RESOURCES_LABEL,
  TAX_RESOURCES_URL,
  type AlbertaTaxOption,
  type TaxMode,
} from "@/lib/alberta-tax";
import {
  formatMoney,
  makeBlankLineItem,
  type DiscountType,
  type LineItem,
} from "@/lib/invoice-demo-data";
import {
  getInvoiceCurrency,
  loadSavedLineItems,
  matchSavedLineItems,
  persistSavedLineItems,
  removeSavedLineItem,
  type SavedLineItem,
  upsertSavedLineItem,
} from "@/lib/saved-line-items";
import {
  loadSavedInvoiceAddons,
  matchSavedInvoiceAddons,
  persistSavedInvoiceAddons,
  removeSavedInvoiceAddon,
  upsertSavedInvoiceAddon,
  type SavedInvoiceAddon,
} from "@/lib/saved-invoice-addons";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { CloseIcon, EditCloseButton, PencilIcon, TertiaryButton } from "./ui";

type EditingId = string | "new" | null;

const hoverCardClass =
  "rounded-[10px] border border-black/10 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue";

const inputClass =
  "w-full rounded border border-black/20 bg-input-grey px-3 py-2.5 text-sm text-midnight-ink outline-none transition focus:border-prime-blue focus:bg-input-grey";

const inputShellClass =
  "flex w-full items-stretch overflow-hidden rounded border border-black/20 bg-input-grey transition focus-within:border-prime-blue focus-within:bg-input-grey";

function TotalsRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-10 items-center justify-end gap-5 px-[30px]">
      <span className="flex-1 text-right text-sm text-black">{label}</span>
      <span className="w-40 text-right text-sm text-black">{value}</span>
      <span className="w-4 shrink-0" aria-hidden />
    </div>
  );
}

type InvoiceAddon = {
  name: string;
  amount: number;
  amountType?: DiscountType;
  saveForFuture?: boolean;
};

function formatAddonAmount(addon: InvoiceAddon) {
  if (addon.amountType === "percent") {
    return `${addon.amount}%`;
  }
  return formatMoney(addon.amount);
}

function AddonNameField({
  value,
  onChange,
  matches,
  onSelectMatch,
  onForgetMatch,
  placeholder,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  matches: SavedInvoiceAddon[];
  onSelectMatch: (addon: SavedInvoiceAddon) => void;
  onForgetMatch: (id: string) => void;
  placeholder: string;
  inputId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target || !ref.current) return;
      if (ref.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  const showMenu = open && matches.length > 0;

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <input
        id={inputId}
        className={inputClass}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showMenu ? (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="max-h-48 overflow-auto py-1">
            {matches.map((match) => (
              <li
                key={match.id}
                className="flex items-stretch border-b border-black/5 last:border-b-0"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex min-w-0 flex-1 flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onSelectMatch(match);
                    setOpen(false);
                  }}
                >
                  <span className="truncate text-sm font-semibold text-black">
                    {match.name}
                  </span>
                  <span className="truncate text-xs text-black/50">
                    {match.amountType === "percent"
                      ? `${match.amount}%`
                      : formatMoney(match.amount)}
                  </span>
                </button>
                <button
                  type="button"
                  className="px-3 text-xs font-semibold text-delete-red transition hover:bg-delete-red/5"
                  aria-label={`Forget ${match.name}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onForgetMatch(match.id);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function InvoiceAddonModal({
  kind,
  initial,
  savedAddons,
  onSavedAddonsChange,
  onSave,
  onCancel,
  onDelete,
}: {
  kind: "discount" | "shipping";
  initial: InvoiceAddon | null;
  savedAddons: SavedInvoiceAddon[];
  onSavedAddonsChange: (addons: SavedInvoiceAddon[]) => void;
  onSave: (addon: InvoiceAddon) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(
    initial?.amount ? String(initial.amount) : "",
  );
  const [amountType, setAmountType] = useState<DiscountType>(
    initial?.amountType ?? "fixed",
  );
  const [saveForFuture, setSaveForFuture] = useState(
    initial?.saveForFuture ?? false,
  );

  const matches = useMemo(
    () =>
      matchSavedInvoiceAddons(savedAddons, kind, name).filter(
        (addon) => addon.kind === kind,
      ),
    [savedAddons, kind, name],
  );

  const defaultName =
    kind === "discount" ? "Invoice Discount" : "Shipping";
  const title = initial
    ? `Edit ${defaultName}`
    : `Add ${defaultName}`;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handleSave() {
    const trimmedName = name.trim();
    if (saveForFuture && !trimmedName) return;

    const value = Number(amount) || 0;
    const next: InvoiceAddon = {
      name: trimmedName || defaultName,
      amount: value,
      amountType: kind === "discount" ? amountType : "fixed",
      saveForFuture,
    };

    if (saveForFuture && trimmedName) {
      const nextSaved = upsertSavedInvoiceAddon(savedAddons, {
        kind,
        name: trimmedName,
        amount: value,
        amountType: next.amountType,
      });
      onSavedAddonsChange(nextSaved);
      persistSavedInvoiceAddons(nextSaved);
    }

    onSave(next);
  }

  const canSave = !saveForFuture || Boolean(name.trim());

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`addon-modal-${kind}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <h2
          id={`addon-modal-${kind}`}
          className="pr-8 type-modal-title text-black"
        >
          {title}
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label
              htmlFor={`addon-name-${kind}`}
              className="text-sm text-black"
            >
              Name
              {!saveForFuture ? (
                <span className="text-black/40"> (optional)</span>
              ) : null}
            </label>
            <AddonNameField
              inputId={`addon-name-${kind}`}
              value={name}
              onChange={setName}
              matches={matches}
              onSelectMatch={(saved) => {
                if (saved.kind !== kind) return;
                setName(saved.name);
                setAmount(String(saved.amount));
                setAmountType(saved.amountType ?? "fixed");
              }}
              onForgetMatch={(id) => {
                const next = removeSavedInvoiceAddon(savedAddons, id);
                onSavedAddonsChange(next);
                persistSavedInvoiceAddons(next);
              }}
              placeholder={
                kind === "discount"
                  ? "e.g. Early payment discount"
                  : "e.g. Express shipping"
              }
            />
            {saveForFuture && !name.trim() ? (
              <p className="text-sm text-delete-red">
                What should we save this as?
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-black">Amount</span>
            {kind === "discount" ? (
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="inline-flex shrink-0 overflow-hidden rounded border border-black/20 bg-input-grey"
                  role="group"
                  aria-label="Amount type"
                >
                  <button
                    type="button"
                    onClick={() => setAmountType("fixed")}
                    className={`px-2.5 py-2.5 text-sm font-semibold transition ${
                      amountType === "fixed"
                        ? "bg-prime-blue text-white"
                        : "text-black/50 hover:bg-black/5"
                    }`}
                    aria-pressed={amountType === "fixed"}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountType("percent")}
                    className={`px-2.5 py-2.5 text-sm font-semibold transition ${
                      amountType === "percent"
                        ? "bg-prime-blue text-white"
                        : "text-black/50 hover:bg-black/5"
                    }`}
                    aria-pressed={amountType === "percent"}
                  >
                    %
                  </button>
                </div>
                <div className={`${inputShellClass} min-w-0 flex-1`}>
                  {amountType === "fixed" ? (
                    <span
                      className="flex items-center pl-2.5 text-sm text-black/50 select-none"
                      aria-hidden
                    >
                      $
                    </span>
                  ) : null}
                  <input
                    className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-midnight-ink outline-none"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder={amountType === "percent" ? "0" : "0.00"}
                    aria-label={
                      amountType === "percent"
                        ? "Discount percent"
                        : "Discount amount"
                    }
                  />
                  <span className="flex shrink-0 items-center pr-2.5 text-sm text-black/50 select-none">
                    {amountType === "percent" ? "%" : "CAD"}
                  </span>
                </div>
              </div>
            ) : (
              <div className={inputShellClass}>
                <span
                  className="flex items-center pl-3 text-sm text-black/50"
                  aria-hidden
                >
                  $
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-midnight-ink outline-none"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <span className="flex shrink-0 items-center pr-3 text-sm text-black/50 select-none">
                  CAD
                </span>
              </div>
            )}
          </div>

          <label className="flex w-fit items-center gap-2.5 text-sm text-black">
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={(event) => setSaveForFuture(event.target.checked)}
              className="h-5 w-5 rounded-[4px] accent-prime-blue"
            />
            Save for future invoices
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-5">
          {initial && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-semibold text-delete-red transition hover:opacity-80"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded border border-black/20 px-5 text-sm font-semibold text-midnight-ink transition hover:bg-black/[0.03]"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="ui-btn-primary"
          >
            {initial ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceAddonRow({
  kind,
  addon,
  editing,
  savedAddons,
  onSavedAddonsChange,
  onStartAdd,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  kind: "discount" | "shipping";
  addon: InvoiceAddon | null;
  editing: boolean;
  savedAddons: SavedInvoiceAddon[];
  onSavedAddonsChange: (addons: SavedInvoiceAddon[]) => void;
  onStartAdd: () => void;
  onStartEdit: () => void;
  onSave: (addon: InvoiceAddon) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const defaultLabel =
    kind === "discount" ? "Invoice Discount" : "Shipping";

  return (
    <>
      <div className="flex h-10 items-center justify-end gap-5 px-[30px]">
        <span className="flex-1 text-right text-sm text-black">
          {addon?.name || defaultLabel}
        </span>
        {!addon ? (
          <div className="w-40 text-right">
            <button
              type="button"
              onClick={onStartAdd}
              className="text-sm font-semibold text-midnight-ink transition hover:text-prime-blue"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="group flex items-center gap-5 text-sm text-black transition hover:text-prime-blue"
            aria-label={`Edit ${addon.name || defaultLabel}`}
          >
            <span className="w-40 text-right">{formatAddonAmount(addon)}</span>
            <span className="flex w-4 shrink-0 justify-center text-black/30 transition group-hover:text-prime-blue">
              <PencilIcon />
            </span>
          </button>
        )}
        {!addon ? <span className="w-4 shrink-0" aria-hidden /> : null}
      </div>

      {editing ? (
        <InvoiceAddonModal
          kind={kind}
          initial={addon}
          savedAddons={savedAddons}
          onSavedAddonsChange={onSavedAddonsChange}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={addon ? onDelete : undefined}
        />
      ) : null}
    </>
  );
}

function LineItemsTotals({
  items,
  taxMode,
}: {
  items: LineItem[];
  taxMode: TaxMode;
}) {
  const [invoiceDiscount, setInvoiceDiscount] = useState<InvoiceAddon | null>(
    null,
  );
  const [shipping, setShipping] = useState<InvoiceAddon | null>(null);
  const [editing, setEditing] = useState<"discount" | "shipping" | null>(null);
  const [savedAddons, setSavedAddons] = useState<SavedInvoiceAddon[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSavedAddons(loadSavedInvoiceAddons()),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  const totals = useMemo(
    () =>
      computeInvoiceTotals(
        items.map((item) => ({
          unitPrice: item.unitPrice,
          qty: item.qty,
          discount: item.discount,
          discountType: item.discountType ?? "fixed",
          total: item.total,
          taxBadges: item.badges,
        })),
        taxMode,
        {
          invoiceDiscount: invoiceDiscount?.amount ?? 0,
          invoiceDiscountType: invoiceDiscount?.amountType ?? "fixed",
          shipping: shipping?.amount ?? 0,
        },
      ),
    [items, taxMode, invoiceDiscount, shipping],
  );

  return (
    <>
      <div className="my-1 h-px bg-black/10" />

      <div className="flex flex-col">
        <TotalsRow label="Subtotal" value={formatMoney(totals.subtotal)} />
        <TotalsRow
          label="Item Discount"
          value={formatMoney(totals.itemDiscount)}
        />
        <InvoiceAddonRow
          kind="discount"
          addon={invoiceDiscount}
          editing={editing === "discount"}
          savedAddons={savedAddons}
          onSavedAddonsChange={setSavedAddons}
          onStartAdd={() => setEditing("discount")}
          onStartEdit={() => setEditing("discount")}
          onSave={(addon) => {
            setInvoiceDiscount(addon);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onDelete={() => {
            setInvoiceDiscount(null);
            setEditing(null);
          }}
        />
        <InvoiceAddonRow
          kind="shipping"
          addon={shipping}
          editing={editing === "shipping"}
          savedAddons={savedAddons}
          onSavedAddonsChange={setSavedAddons}
          onStartAdd={() => setEditing("shipping")}
          onStartEdit={() => setEditing("shipping")}
          onSave={(addon) => {
            setShipping(addon);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onDelete={() => {
            setShipping(null);
            setEditing(null);
          }}
        />
        <TotalsRow label="Tax (GST)" value={formatMoney(totals.gst)} />
        <TotalsRow label="Tax (PST)" value={formatMoney(totals.pst)} />
      </div>

      <div className="my-1 h-px bg-black/10" />

      <div className="flex items-center justify-end gap-2.5 px-[30px]">
        <div className="text-right">
          <p className="text-base font-bold text-black">Total</p>
          <p className="text-sm text-black/40">
            {taxMode === "inclusive" ? "(Tax inclusive)" : "(Tax exclusive)"}
          </p>
        </div>
        <p className="w-[180px] text-right type-amount">
          {formatMoney(totals.total)}
        </p>
        <span className="w-4 shrink-0" aria-hidden />
      </div>
    </>
  );
}

function getViewChips(item: LineItem) {
  const taxChips = item.badges.filter(
    (badge) =>
      !badge.label.toLowerCase().startsWith("discount") &&
      !/%\s*off/i.test(badge.label),
  );
  const discountChip = formatDiscountChip(
    item.discount,
    item.discountType ?? "fixed",
    formatMoney,
  );
  return [
    ...taxChips,
    ...(discountChip ? [{ label: discountChip }] : []),
  ];
}

function LineItemCard({
  item,
  onClick,
}: {
  item: LineItem;
  onClick: () => void;
}) {
  const chips = getViewChips(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full px-[30px] py-5 text-left ${hoverCardClass}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-[30px]">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-black">
            {item.name || "Untitled item"}
          </p>
          {item.description ? (
            <p className="mt-2.5 text-sm text-black">{item.description}</p>
          ) : null}
          {chips.length ? (
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className="rounded bg-badge-purple/10 px-1.5 text-sm font-semibold text-badge-purple"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-start gap-5">
          <div className="grid grid-cols-3 gap-[30px] text-right">
            <div className="w-[65px]">
              <p className="text-sm text-black/40">Unit Price</p>
              <p className="mt-2.5 text-sm text-black">
                {formatMoney(item.unitPrice)}
              </p>
            </div>
            <div className="w-[65px]">
              <p className="text-sm text-black/40">Quantity</p>
              <p className="mt-2.5 text-sm text-black">{item.qty}</p>
            </div>
            <div className="w-[65px]">
              <p className="text-sm text-black/40">Total</p>
              <p className="mt-2.5 text-sm text-black">
                {formatMoney(item.total)}
              </p>
            </div>
          </div>
          <span className="w-4 shrink-0" aria-hidden />
        </div>
      </div>
      <span className="absolute right-3 top-3 text-black/30" aria-hidden>
        <PencilIcon />
      </span>
    </button>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-1 flex-col gap-2.5 ${className}`}>
      <span className="text-sm text-black">{label}</span>
      {children}
    </label>
  );
}

function MoneyInput({
  value,
  onChange,
  currency,
  placeholder = "0.00",
}: {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  placeholder?: string;
}) {
  return (
    <div className={inputShellClass}>
      <span
        className="flex items-center pl-3 text-sm text-black/50 select-none"
        aria-hidden
      >
        $
      </span>
      <input
        className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-midnight-ink outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        aria-label="Unit price amount"
      />
      <span
        className="flex items-center pr-3 text-sm font-medium text-black/50 select-none"
        aria-hidden
      >
        {currency}
      </span>
    </div>
  );
}

function TaxField({
  value,
  onChange,
  enabled,
  onEnabledChange,
}: {
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => matchAlbertaTaxOptions(value), [value]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setTooltipOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative min-w-0 w-full">
      <label className="mb-2.5 flex items-center gap-2.5 text-sm text-black">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="h-5 w-5 rounded-[4px] accent-prime-blue"
        />
        <span>Add tax</span>
        <button
          type="button"
          className="relative text-black/40 transition hover:text-black/70"
          aria-label="Tax help"
          onClick={(event) => {
            event.preventDefault();
            setTooltipOpen((prev) => !prev);
          }}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="8" cy="5" r="0.8" fill="currentColor" />
          </svg>
          {tooltipOpen ? (
            <span
              role="tooltip"
              className="absolute bottom-full left-1/2 z-40 mb-2 w-72 -translate-x-1/2 rounded-lg bg-midnight-ink px-3 py-2 text-left text-xs font-normal leading-4 text-white shadow-lg"
            >
              {ALBERTA_TAX_TOOLTIP}
              <span
                className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-midnight-ink"
                aria-hidden
              />
            </span>
          ) : null}
        </button>
      </label>

      {enabled ? (
        <>
          <input
            className={inputClass}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Start typing a tax…"
            autoComplete="off"
          />
          {open ? (
            <div
              className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
              role="listbox"
            >
              {matches.length ? (
                <ul className="max-h-56 overflow-auto py-1">
                  {matches.map((option: AlbertaTaxOption) => (
                    <li key={option.label}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={option.label === value}
                        className="flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                        onClick={() => {
                          onChange(option.label);
                          setOpen(false);
                        }}
                      >
                        <span className="text-sm font-semibold text-black">
                          {option.label}
                        </span>
                        <span className="text-xs text-black/50">{option.hint}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-black/50">
                  No matching tax items
                </p>
              )}
              <div className="border-t border-black/10">
                <a
                  href={TAX_RESOURCES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-prime-blue transition hover:bg-prime-blue/5"
                  onClick={() => setOpen(false)}
                >
                  {TAX_RESOURCES_LABEL}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M3.5 2.5H9.5V8.5M9.5 2.5 2.5 9.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function DiscountField({
  value,
  type,
  onChangeValue,
  onChangeType,
  enabled,
  onEnabledChange,
}: {
  value: string;
  type: DiscountType;
  onChangeValue: (value: string) => void;
  onChangeType: (type: DiscountType) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-2.5">
      <label className="flex items-center gap-2.5 text-sm text-black">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="h-5 w-5 rounded-[4px] accent-prime-blue"
        />
        <span>Add discount</span>
      </label>

      {enabled ? (
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="inline-flex shrink-0 overflow-hidden rounded border border-black/20 bg-input-grey"
            role="group"
            aria-label="Discount type"
          >
            <button
              type="button"
              onClick={() => onChangeType("fixed")}
              className={`px-2.5 py-2.5 text-sm font-semibold transition ${
                type === "fixed"
                  ? "bg-prime-blue text-white"
                  : "text-black/50 hover:bg-black/5"
              }`}
              aria-pressed={type === "fixed"}
            >
              $
            </button>
            <button
              type="button"
              onClick={() => onChangeType("percent")}
              className={`px-2.5 py-2.5 text-sm font-semibold transition ${
                type === "percent"
                  ? "bg-prime-blue text-white"
                  : "text-black/50 hover:bg-black/5"
              }`}
              aria-pressed={type === "percent"}
            >
              %
            </button>
          </div>
          <div className={`${inputShellClass} min-w-0 flex-1`}>
            {type === "fixed" ? (
              <span
                className="flex items-center pl-2.5 text-sm text-black/50 select-none"
                aria-hidden
              >
                $
              </span>
            ) : null}
            <input
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-midnight-ink outline-none"
              value={value}
              onChange={(event) => onChangeValue(event.target.value)}
              inputMode="decimal"
              placeholder={type === "percent" ? "0" : "0.00"}
              aria-label={
                type === "percent" ? "Discount percent" : "Discount amount"
              }
            />
            <span className="flex shrink-0 items-center pr-2.5 text-sm text-black/50 select-none">
              {type === "percent" ? "%" : "CAD"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ItemNameField({
  value,
  onChange,
  matches,
  onSelectMatch,
  onForgetMatch,
}: {
  value: string;
  onChange: (value: string) => void;
  matches: SavedLineItem[];
  onSelectMatch: (item: SavedLineItem) => void;
  onForgetMatch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const showMenu = open && matches.length > 0;

  return (
    <div ref={ref} className="relative">
      <input
        className={inputClass}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Item name"
        autoComplete="off"
      />
      {showMenu ? (
        <div
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="max-h-56 overflow-auto py-1">
            {matches.map((match) => {
              const value = computeLineTotal(
                match.unitPrice,
                match.qty,
                match.discount,
                match.discountType ?? "fixed",
              );

              return (
                <li
                  key={match.id}
                  className="flex items-stretch border-b border-black/5 last:border-b-0"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="flex min-w-0 flex-1 flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                    onClick={() => {
                      onSelectMatch(match);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate text-sm font-semibold text-black">
                      {match.name}
                    </span>
                    <span className="truncate text-xs text-black/50">
                      {formatMoney(value)}
                      {match.description ? ` · ${match.description}` : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="px-3 text-xs font-semibold text-delete-red transition hover:bg-delete-red/5"
                    aria-label={`Forget ${match.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onForgetMatch(match.id);
                    }}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LineItemForm({
  initial,
  isNew,
  currency,
  savedItems,
  onSavedItemsChange,
  onSave,
  onDelete,
  onClose,
}: {
  initial: LineItem & { tax?: string };
  isNew: boolean;
  currency: string;
  savedItems: SavedLineItem[];
  onSavedItemsChange: (items: SavedLineItem[]) => void;
  onSave: (item: LineItem & { tax: string }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(formRef, onClose);

  const [name, setName] = useState(initial.name);
  const [unitPrice, setUnitPrice] = useState(
    initial.unitPrice ? String(initial.unitPrice) : "",
  );
  const [qty, setQty] = useState(
    initial.qty ? String(initial.qty) : isNew ? "1" : "",
  );
  const [description, setDescription] = useState(initial.description);
  const [tax, setTax] = useState(initial.tax ?? "");
  const [taxEnabled, setTaxEnabled] = useState(Boolean(initial.tax?.trim()));
  const [discount, setDiscount] = useState(
    initial.discount ? String(initial.discount) : "",
  );
  const [discountEnabled, setDiscountEnabled] = useState(
    Boolean(initial.discount),
  );
  const [discountType, setDiscountType] = useState<DiscountType>(
    initial.discountType ?? "fixed",
  );
  const [saveForFuture, setSaveForFuture] = useState(
    initial.saveForFuture ?? false,
  );

  const matches = useMemo(
    () => matchSavedLineItems(savedItems, name),
    [savedItems, name],
  );

  function applySaved(saved: SavedLineItem) {
    setName(saved.name);
    setUnitPrice(saved.unitPrice ? String(saved.unitPrice) : "");
    setQty(String(saved.qty || 1));
    setDescription(saved.description);
    setDiscount(saved.discount ? String(saved.discount) : "");
    setDiscountType(saved.discountType ?? "fixed");
    setDiscountEnabled(Boolean(saved.discount));
    setTax(saved.tax);
    setTaxEnabled(Boolean(saved.tax?.trim()));
  }

  function forgetSaved(id: string) {
    const next = removeSavedLineItem(savedItems, id);
    onSavedItemsChange(next);
    persistSavedLineItems(next);
  }

  function handleSave() {
    const price = Number(unitPrice) || 0;
    const amount = Number(qty) || 1;
    const disc = discountEnabled ? Number(discount) || 0 : 0;
    const taxValue = taxEnabled ? tax.trim() : "";
    const trimmedName = name.trim() || "Untitled item";
    const discountChip = discountEnabled
      ? formatDiscountChip(disc, discountType, formatMoney)
      : null;
    const nextItem: LineItem & { tax: string } = {
      ...initial,
      name: trimmedName,
      description: description.trim(),
      unitPrice: price,
      qty: amount,
      discount: disc,
      discountType: discountEnabled ? discountType : "fixed",
      total: computeLineTotal(
        price,
        amount,
        disc,
        discountEnabled ? discountType : "fixed",
      ),
      saveForFuture,
      tax: taxValue,
      badges: [
        ...(taxValue ? [{ label: taxValue }] : []),
        ...(discountChip ? [{ label: discountChip }] : []),
      ],
    };

    if (saveForFuture && trimmedName !== "Untitled item") {
      const nextSaved = upsertSavedLineItem(savedItems, {
        name: trimmedName,
        description: nextItem.description,
        unitPrice: price,
        qty: amount,
        discount: disc,
        discountType: discountEnabled ? discountType : "fixed",
        tax: taxValue,
      });
      onSavedItemsChange(nextSaved);
      persistSavedLineItems(nextSaved);
    }

    onSave(nextItem);
  }

  return (
    <div ref={formRef} className={`relative p-[30px] ${hoverCardClass}`}>
      <EditCloseButton onClick={onClose} />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          <Field label="Item Name" className="sm:flex-[1.4]">
            <ItemNameField
              value={name}
              onChange={setName}
              matches={matches}
              onSelectMatch={applySaved}
              onForgetMatch={forgetSaved}
            />
          </Field>
          <Field label="Unit Price">
            <MoneyInput
              value={unitPrice}
              onChange={setUnitPrice}
              currency={currency}
              placeholder="0.00"
            />
          </Field>
          <Field label="Quantity">
            <input
              className={inputClass}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              inputMode="numeric"
              placeholder="1"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-[84px] resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <TaxField
            value={tax}
            onChange={setTax}
            enabled={taxEnabled}
            onEnabledChange={setTaxEnabled}
          />
          <DiscountField
            value={discount}
            type={discountType}
            onChangeValue={setDiscount}
            onChangeType={setDiscountType}
            enabled={discountEnabled}
            onEnabledChange={setDiscountEnabled}
          />
        </div>

        <label className="flex w-fit items-center gap-2.5 text-sm text-black">
          <input
            type="checkbox"
            checked={saveForFuture}
            onChange={(event) => setSaveForFuture(event.target.checked)}
            className="h-5 w-5 rounded-[4px] accent-prime-blue"
          />
          Save for future invoices
        </label>

        <div className="mt-6 border-t border-dashed border-black/15 pt-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-semibold text-delete-red transition hover:opacity-80"
            >
              {isNew ? "Cancel" : "Delete"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="ui-btn-primary"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LineItemsSection({
  initialItems = [],
  taxMode = "exclusive",
  currency = getInvoiceCurrency(),
}: {
  initialItems?: LineItem[];
  taxMode?: TaxMode;
  currency?: string;
}) {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [editingId, setEditingId] = useState<EditingId>(null);
  const [newItem, setNewItem] = useState<(LineItem & { tax?: string }) | null>(
    null,
  );
  const [savedItems, setSavedItems] = useState<SavedLineItem[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSavedItems(loadSavedLineItems()),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (items.length > 0 || editingId === "new" || newItem) return;
    const blank = makeBlankLineItem(`item-${Date.now()}`);
    window.setTimeout(() => {
      setNewItem({ ...blank, qty: 1, tax: "" });
      setEditingId("new");
    }, 0);
  }, [items, editingId, newItem]);

  function closeEditor() {
    setEditingId(null);
    setNewItem(null);
  }

  function startAdd() {
    const blank = makeBlankLineItem(`item-${Date.now()}`);
    setNewItem({ ...blank, qty: 1, tax: "" });
    setEditingId("new");
  }

  function saveExisting(updated: LineItem & { tax: string }) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === updated.id
          ? {
              id: updated.id,
              name: updated.name,
              description: updated.description,
              unitPrice: updated.unitPrice,
              qty: updated.qty,
              discount: updated.discount,
              discountType: updated.discountType,
              total: updated.total,
              saveForFuture: updated.saveForFuture,
              badges: updated.badges,
            }
          : item,
      ),
    );
    setEditingId(null);
  }

  function saveNew(created: LineItem & { tax: string }) {
    setItems((prev) => [
      ...prev,
      {
        id: created.id,
        name: created.name,
        description: created.description,
        unitPrice: created.unitPrice,
        qty: created.qty,
        discount: created.discount,
        discountType: created.discountType,
        total: created.total,
        saveForFuture: created.saveForFuture,
        badges: created.badges,
      },
    ]);
    setNewItem(null);
    setEditingId(null);
  }

  function deleteExisting(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length ? (
        <div className="flex flex-col gap-2.5">
          {items.map((item) =>
            editingId === item.id ? (
              <LineItemForm
                key={item.id}
                initial={{
                  ...item,
                  tax:
                    item.badges.find(
                      (badge) =>
                        !badge.label.toLowerCase().startsWith("discount"),
                    )?.label ?? "",
                }}
                isNew={false}
                currency={currency}
                savedItems={savedItems}
                onSavedItemsChange={setSavedItems}
                onSave={saveExisting}
                onDelete={() => deleteExisting(item.id)}
                onClose={closeEditor}
              />
            ) : (
              <LineItemCard
                key={item.id}
                item={item}
                onClick={() => {
                  setNewItem(null);
                  setEditingId(item.id);
                }}
              />
            ),
          )}
        </div>
      ) : null}

      {editingId === "new" && newItem ? (
        <LineItemForm
          initial={newItem}
          isNew
          currency={currency}
          savedItems={savedItems}
          onSavedItemsChange={setSavedItems}
          onSave={saveNew}
          onDelete={closeEditor}
          onClose={closeEditor}
        />
      ) : null}

      <div>
        <TertiaryButton
          onClick={() => {
            if (editingId === "new") return;
            closeEditor();
            startAdd();
          }}
        >
          Add Line Item
        </TertiaryButton>
      </div>

      <LineItemsTotals items={items} taxMode={taxMode} />
    </div>
  );
}
