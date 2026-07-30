"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeInvoiceTotals,
  computeLineTotal,
  findTaxOption,
  formatDiscountChip,
  ALBERTA_TAX_TOOLTIP,
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
import {
  CUSTOMER_NON_TAXABLE_OPTIONS,
  CUSTOMER_TAXABLE_OPTIONS,
  taxSuggestionsFromOption,
  type TaxSuggestions,
} from "@/lib/tax-suggestions";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { TaxSuggestionsEditor } from "./TaxSuggestionsEditor";
import { EditCloseButton, Modal, PencilIcon, TertiaryButton } from "./ui";

type EditingId = string | "new" | null;

export type LineItemsSummaryInfo = {
  count: number;
  itemNames: string[];
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  federalTaxLabel: string;
  allowPartialPayment: boolean;
  minimumPayment: string;
};

export function emptyLineItemsSummary(): LineItemsSummaryInfo {
  return {
    count: 0,
    itemNames: [],
    subtotal: 0,
    gst: 0,
    pst: 0,
    total: 0,
    federalTaxLabel: "GST",
    allowPartialPayment: false,
    minimumPayment: "",
  };
}

export function summarizeLineItems(
  items: LineItem[],
  taxMode: TaxMode,
  extras?: {
    allowPartialPayment?: boolean;
    minimumPayment?: string;
  },
): LineItemsSummaryInfo {
  const totals = computeInvoiceTotals(
    items.map((item) => ({
      unitPrice: item.unitPrice,
      qty: item.qty,
      discount: item.discount,
      discountType: item.discountType ?? "fixed",
      total: item.total,
      taxBadges: item.badges,
    })),
    taxMode,
  );
  return {
    count: items.length,
    itemNames: items.map((item) => item.name).filter(Boolean),
    subtotal: totals.subtotal,
    gst: totals.gst,
    pst: totals.pst,
    total: totals.total,
    federalTaxLabel: totals.federalTaxLabel,
    allowPartialPayment: Boolean(extras?.allowPartialPayment),
    minimumPayment: extras?.minimumPayment?.trim() ?? "",
  };
}

/** Compact summary block for draft composer list view. */
export function LineItemsCollapsedSummary({
  summary,
}: {
  summary: LineItemsSummaryInfo;
}) {
  if (summary.count <= 0) {
    return (
      <p className="mt-1 type-paragraph-2 text-black/55">
        Add products or services
      </p>
    );
  }

  const names = summary.itemNames.slice(0, 2).join(", ");
  const namesSuffix =
    summary.itemNames.length > 2
      ? "…"
      : summary.itemNames.length === 0
        ? ""
        : "";

  return (
    <div className="mt-1 flex min-w-0 flex-col gap-1">
      <p className="truncate type-paragraph-2 text-black/55">
        {summary.count} item{summary.count === 1 ? "" : "s"}
        {names ? ` · ${names}${namesSuffix}` : ""}
      </p>
      <p className="truncate type-paragraph-2 text-black/55">
        {summary.federalTaxLabel} {formatMoney(summary.gst)}
        {summary.pst > 0 ? ` · PST ${formatMoney(summary.pst)}` : ""}
        {` · Total ${formatMoney(summary.total)}`}
      </p>
      {summary.allowPartialPayment ? (
        <p className="truncate type-paragraph-2 text-black/55">
          Partial payments accepted
          {summary.minimumPayment
            ? ` · Min ${formatMoney(Number(summary.minimumPayment) || 0)}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

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

  const canSave = !saveForFuture || Boolean(name.trim());

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

  return (
    <Modal
      title={title}
      titleId={`addon-modal-${kind}`}
      onClose={onCancel}
      confirmLabel={initial ? "Update" : "Save"}
      onConfirm={handleSave}
      confirmDisabled={!canSave}
      footer={
        <div className="flex items-center justify-between gap-3">
          {initial && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="type-danger transition hover:underline"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="type-danger transition hover:underline"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="ui-btn-primary h-11"
          >
            {initial ? "Update" : "Save"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
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
    </Modal>
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
  onTotalsChange,
}: {
  items: LineItem[];
  taxMode: TaxMode;
  onTotalsChange?: (info: {
    subtotal: number;
    gst: number;
    pst: number;
    total: number;
    federalTaxLabel: string;
    allowPartialPayment: boolean;
    minimumPayment: string;
  }) => void;
}) {
  const [invoiceDiscount, setInvoiceDiscount] = useState<InvoiceAddon | null>(
    null,
  );
  const [shipping, setShipping] = useState<InvoiceAddon | null>(null);
  const [editing, setEditing] = useState<"discount" | "shipping" | null>(null);
  const [savedAddons, setSavedAddons] = useState<SavedInvoiceAddon[]>([]);
  const [allowPartialPayment, setAllowPartialPayment] = useState(false);
  const [minimumPayment, setMinimumPayment] = useState("");
  const [editingMinimum, setEditingMinimum] = useState(false);

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

  useEffect(() => {
    onTotalsChange?.({
      subtotal: totals.subtotal,
      gst: totals.gst,
      pst: totals.pst,
      total: totals.total,
      federalTaxLabel: totals.federalTaxLabel,
      allowPartialPayment,
      minimumPayment,
    });
  }, [
    totals.subtotal,
    totals.gst,
    totals.pst,
    totals.total,
    totals.federalTaxLabel,
    allowPartialPayment,
    minimumPayment,
    onTotalsChange,
  ]);

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
        <TotalsRow
          label={`Tax (${totals.federalTaxLabel})`}
          value={formatMoney(totals.gst)}
        />
        {totals.pst > 0 ? (
          <TotalsRow label="Tax (PST)" value={formatMoney(totals.pst)} />
        ) : null}
      </div>

      <div className="my-1 h-px bg-black/10" />

      <div className="flex flex-col items-end gap-2 px-[30px]">
        <div className="flex items-center justify-end gap-2.5">
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
      </div>

      <div className="my-1 h-px bg-black/10" />

      <div className="flex h-10 items-center justify-end gap-5 px-[30px]">
        <label className="flex min-w-0 flex-1 items-center gap-2.5 text-sm text-black">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-prime-blue"
            checked={allowPartialPayment}
            onChange={(event) => {
              setAllowPartialPayment(event.target.checked);
              if (!event.target.checked) {
                setMinimumPayment("");
                setEditingMinimum(false);
              }
            }}
          />
          <span>Allow partial payment</span>
        </label>
        {allowPartialPayment ? (
          <>
            <span className="shrink-0 text-sm text-black">Minimum Payment</span>
            {!minimumPayment.trim() ? (
              <div className="w-40 text-right">
                <button
                  type="button"
                  onClick={() => setEditingMinimum(true)}
                  className="text-sm font-semibold text-midnight-ink transition hover:text-prime-blue"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingMinimum(true)}
                className="group flex items-center gap-5 text-sm text-black transition hover:text-prime-blue"
                aria-label="Edit Minimum Payment"
              >
                <span className="w-40 text-right">
                  {formatMoney(Number(minimumPayment) || 0)}
                </span>
                <span className="flex w-4 shrink-0 justify-center text-black/30 transition group-hover:text-prime-blue">
                  <PencilIcon />
                </span>
              </button>
            )}
            {!minimumPayment.trim() ? (
              <span className="w-4 shrink-0" aria-hidden />
            ) : null}
          </>
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
      </div>

      {allowPartialPayment && editingMinimum ? (
        <MinimumPaymentModal
          initial={minimumPayment}
          onSave={(value) => {
            setMinimumPayment(value);
            setEditingMinimum(false);
          }}
          onCancel={() => setEditingMinimum(false)}
          onDelete={
            minimumPayment.trim()
              ? () => {
                  setMinimumPayment("");
                  setEditingMinimum(false);
                }
              : undefined
          }
        />
      ) : null}
    </>
  );
}

function MinimumPaymentModal({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [amount, setAmount] = useState(initial);

  function handleSave() {
    const cleaned = amount.replace(/[^\d.]/g, "").trim();
    onSave(cleaned);
  }

  const isEditing = Boolean(initial.trim());

  return (
    <Modal
      title={isEditing ? "Edit minimum payment" : "Add minimum payment"}
      titleId="minimum-payment-modal"
      onClose={onCancel}
      footer={
        <div className="flex items-center justify-between gap-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="type-danger transition hover:underline"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="type-danger transition hover:underline"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="ui-btn-primary h-11"
          >
            {isEditing ? "Update" : "Save"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-black">Minimum amount</span>
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
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^\d.]/g, ""))
              }
              inputMode="decimal"
              placeholder="0.00"
              aria-label="Minimum payment amount"
              autoFocus
            />
            <span className="flex shrink-0 items-center pr-3 text-sm text-black/50 select-none">
              CAD
            </span>
          </div>
        </div>
      </div>
    </Modal>
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

const LINE_ITEM_TAX_OPTIONS = [
  ...CUSTOMER_TAXABLE_OPTIONS,
  ...CUSTOMER_NON_TAXABLE_OPTIONS,
];

function taxSuggestionsFromLabel(label: string): TaxSuggestions {
  const option = findTaxOption(label.trim());
  if (option) return taxSuggestionsFromOption(option);
  return {
    includeGst: false,
    gstRate: "",
    includePst: false,
    pstRate: "",
    suggestedLabel: label.trim(),
  };
}

function TaxField({
  value,
  onChange,
  enabled,
  onEnabledChange,
  recommendedLabel = "",
  recommendedNote = "",
}: {
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  recommendedLabel?: string;
  recommendedNote?: string;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div className="relative min-w-0 w-full">
      <label className="mb-2.5 flex items-center gap-2.5 text-sm text-black">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            const nextEnabled = event.target.checked;
            onEnabledChange(nextEnabled);
            if (nextEnabled && !value.trim() && recommendedLabel) {
              onChange(recommendedLabel);
            }
          }}
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
        <TaxSuggestionsEditor
          value={taxSuggestionsFromLabel(value)}
          options={LINE_ITEM_TAX_OPTIONS}
          recommendedLabel={recommendedLabel || undefined}
          recommendedNote={recommendedNote || undefined}
          onChange={(next) => onChange(next.suggestedLabel)}
        />
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
  recommendedTaxLabel = "",
  recommendedTaxNote = "",
  allowDismiss = true,
}: {
  initial: LineItem & { tax?: string };
  isNew: boolean;
  currency: string;
  savedItems: SavedLineItem[];
  onSavedItemsChange: (items: SavedLineItem[]) => void;
  onSave: (item: LineItem & { tax: string }) => void;
  onDelete: () => void;
  onClose: () => void;
  recommendedTaxLabel?: string;
  recommendedTaxNote?: string;
  /** When false, hide Cancel/close so the default blank row stays open. */
  allowDismiss?: boolean;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(formRef, onClose, allowDismiss);

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
    <div ref={formRef} className="relative rounded-[10px] border border-black/10 p-[30px]">
      {allowDismiss ? <EditCloseButton onClick={onClose} /> : null}
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
            recommendedLabel={recommendedTaxLabel}
            recommendedNote={recommendedTaxNote}
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
          <div
            className={`flex items-center ${
              allowDismiss ? "justify-between" : "justify-end"
            }`}
          >
            {allowDismiss ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-semibold text-delete-red transition hover:opacity-80"
              >
                {isNew ? "Cancel" : "Delete"}
              </button>
            ) : null}
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
  defaultTaxLabel = "",
  recommendedTaxNote = "",
  onItemCountChange,
  onSummaryChange,
}: {
  initialItems?: LineItem[];
  taxMode?: TaxMode;
  currency?: string;
  /** Prefill from customer profile tax settings; editable per line. */
  defaultTaxLabel?: string;
  /** Explains why defaultTaxLabel is recommended in the tax dropdown. */
  recommendedTaxNote?: string;
  onItemCountChange?: (count: number) => void;
  onSummaryChange?: (summary: LineItemsSummaryInfo) => void;
}) {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [editingId, setEditingId] = useState<EditingId>(null);
  const [newItem, setNewItem] = useState<(LineItem & { tax?: string }) | null>(
    null,
  );
  const [savedItems, setSavedItems] = useState<SavedLineItem[]>([]);
  const [totalsInfo, setTotalsInfo] = useState({
    subtotal: 0,
    gst: 0,
    pst: 0,
    total: 0,
    federalTaxLabel: "GST",
    allowPartialPayment: false,
    minimumPayment: "",
  });
  const previousDefaultTax = useRef(defaultTaxLabel);

  useEffect(() => {
    onItemCountChange?.(items.length);
  }, [items.length, onItemCountChange]);

  useEffect(() => {
    onSummaryChange?.({
      count: items.length,
      itemNames: items.map((item) => item.name).filter(Boolean),
      ...totalsInfo,
    });
  }, [items, totalsInfo, onSummaryChange]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSavedItems(loadSavedLineItems()),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const previous = previousDefaultTax.current;
    previousDefaultTax.current = defaultTaxLabel;

    function isTaxBadge(label: string) {
      return !label.toLowerCase().startsWith("discount") && !label.toLowerCase().includes("off");
    }

    setItems((prev) =>
      prev.map((item) => {
        const taxBadge = item.badges.find((badge) => isTaxBadge(badge.label));
        const otherBadges = item.badges.filter(
          (badge) => !isTaxBadge(badge.label),
        );
        // Replace only when empty or still matching the previous customer default.
        const shouldReplace =
          !taxBadge ||
          (previous && taxBadge.label === previous) ||
          taxBadge.label === defaultTaxLabel;
        if (!shouldReplace && taxBadge) return item;
        return {
          ...item,
          badges: defaultTaxLabel
            ? [{ label: defaultTaxLabel }, ...otherBadges]
            : otherBadges,
        };
      }),
    );

    setNewItem((prev) => {
      if (!prev) return prev;
      if (prev.tax && previous && prev.tax !== previous && prev.tax !== defaultTaxLabel) {
        return prev;
      }
      return { ...prev, tax: defaultTaxLabel };
    });
  }, [defaultTaxLabel]);

  useEffect(() => {
    if (items.length > 0 || editingId === "new" || newItem) return;
    const blank = makeBlankLineItem(`item-${Date.now()}`);
    window.setTimeout(() => {
      setNewItem({ ...blank, qty: 1, tax: defaultTaxLabel });
      setEditingId("new");
    }, 0);
  }, [items, editingId, newItem, defaultTaxLabel]);

  function closeEditor() {
    setEditingId(null);
    setNewItem(null);
  }

  function startAdd() {
    const blank = makeBlankLineItem(`item-${Date.now()}`);
    setNewItem({ ...blank, qty: 1, tax: defaultTaxLabel });
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
                recommendedTaxLabel={defaultTaxLabel}
                recommendedTaxNote={recommendedTaxNote}
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
          key={`new-${newItem.id}-${newItem.tax ?? ""}`}
          initial={newItem}
          isNew
          currency={currency}
          savedItems={savedItems}
          onSavedItemsChange={setSavedItems}
          onSave={saveNew}
          onDelete={closeEditor}
          onClose={closeEditor}
          recommendedTaxLabel={defaultTaxLabel}
          recommendedTaxNote={recommendedTaxNote}
          allowDismiss={items.length > 0}
        />
      ) : null}

      {items.length > 0 ? (
        <>
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

          <LineItemsTotals
            items={items}
            taxMode={taxMode}
            onTotalsChange={setTotalsInfo}
          />
        </>
      ) : null}
    </div>
  );
}
