"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type TaxMode } from "@/lib/alberta-tax";
import { Modal, PencilIcon } from "./ui";

const ISSUE_DATE_PRESETS = [
  "Send right away",
  "Send at end-of-month",
] as const;

const DUE_DATE_OPTIONS: { label: string; hint: string }[] = [
  {
    label: "Net 30",
    hint: "Payment is due 30 days after the issue date",
  },
  {
    label: "Net 15",
    hint: "Payment is due 15 days after the issue date",
  },
  {
    label: "Upon receipt",
    hint: "Payment is due as soon as the customer receives the invoice",
  },
];

function CaretIcon() {
  return (
    <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
      <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path
        d="M1 5.2 4.8 8.8 13 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  return ref;
}

const fieldTriggerClass =
  "flex w-full items-center justify-between rounded border border-black/20 bg-input-grey px-2.5 py-2.5 text-left text-sm text-midnight-ink transition hover:border-prime-blue focus:border-prime-blue focus:bg-input-grey";

const inputClass =
  "w-full rounded border border-black/20 bg-input-grey px-2.5 py-2.5 text-sm text-midnight-ink outline-none transition focus:border-prime-blue focus:bg-input-grey";

const TAX_SETTING_OPTIONS: { label: string; value: TaxMode; hint: string }[] = [
  {
    label: "Inclusive",
    value: "inclusive",
    hint: "Line prices already include tax",
  },
  {
    label: "Exclusive",
    value: "exclusive",
    hint: "Tax is added on top of line prices",
  },
];

function TaxSettingField({
  mode,
  onChange,
}: {
  mode: TaxMode;
  onChange: (mode: TaxMode) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm text-black">Tax Setting</span>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Tax Setting">
        {TAX_SETTING_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex items-start gap-2.5 text-sm text-black"
          >
            <input
              type="radio"
              name="document-tax-setting"
              className="mt-0.5 h-4 w-4 accent-prime-blue"
              checked={mode === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="min-w-0">
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-xs text-black/50">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function formatCalendarLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/** Month + day only, e.g. “July 27”. */
function formatServiceDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function MonthCalendar({
  value,
  onSelect,
  min,
  max,
}: {
  value: string;
  onSelect: (iso: string) => void;
  min?: string;
  max?: string;
}) {
  const selected = parseIsoDate(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selected?.year ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    selected?.month ?? today.getMonth() + 1,
  );

  useEffect(() => {
    const next = parseIsoDate(value);
    if (!next) return;
    setViewYear(next.year);
    setViewMonth(next.month);
  }, [value]);

  const monthLabel = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth - 1, 1));

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  }

  return (
    <div className="w-[280px]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded px-2 py-1 text-sm text-black/60 transition hover:bg-black/[0.04] hover:text-black"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-black">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded px-2 py-1 text-sm text-black/60 transition hover:bg-black/[0.04] hover:text-black"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-black/40">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="h-8" />;
          }
          const iso = toIsoDate(viewYear, viewMonth, day);
          const disabled =
            (min != null && iso < min) || (max != null && iso > max);
          const isSelected = value === iso;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`h-8 rounded text-sm transition ${
                isSelected
                  ? "bg-prime-blue font-semibold text-white"
                  : disabled
                    ? "cursor-not-allowed text-black/25"
                    : "text-black hover:bg-black/[0.06]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Calendar-only date field; trigger shows e.g. “July 5, 2026”. */
function CalendarDateField({
  label,
  value,
  onChange,
  optional = false,
  required = false,
  min,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

  return (
    <div ref={ref} className="relative flex flex-col gap-2.5">
      <span className="text-sm text-black">
        {label}
        {required ? <span className="type-danger"> *</span> : null}
        {optional ? (
          <span className="text-black/40"> (optional)</span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={fieldTriggerClass}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={iso ? "" : "text-black/40"}>
          {iso ? formatCalendarLabel(iso) : "Select a date"}
        </span>
        <CaretIcon />
      </button>
      {error ? <p className="type-danger text-xs">{error}</p> : null}
      {open ? (
        <div className="absolute left-0 z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white p-3 shadow-lg">
          <MonthCalendar
            value={iso}
            min={min}
            max={max}
            onSelect={(next) => {
              onChange(next);
              setOpen(false);
            }}
          />
          {optional && iso ? (
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-prime-blue transition hover:opacity-80"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function IssueDateField({
  value,
  onChange,
  label = "Issue Date",
  calendarOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Quote estimate date: calendar only, no send presets. */
  calendarOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const calendarValue = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return "";
  }, [value]);

  if (calendarOnly) {
    return (
      <CalendarDateField label={label} value={value} onChange={onChange} />
    );
  }

  return (
    <div ref={ref} className="relative flex flex-col gap-2.5">
      <span className="text-sm text-black">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={fieldTriggerClass}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>
          {/^\d{4}-\d{2}-\d{2}$/.test(value)
            ? formatCalendarLabel(value)
            : value}
        </span>
        <CaretIcon />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white p-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {ISSUE_DATE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="flex items-center justify-between rounded px-2 py-2 text-left text-sm transition hover:bg-black/[0.04]"
                onClick={() => {
                  onChange(preset);
                  setOpen(false);
                }}
              >
                <span>{preset}</span>
                {value === preset ? (
                  <span className="text-prime-blue">
                    <CheckIcon />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="my-2 h-px bg-black/10" />
          <label className="flex flex-col gap-1.5 text-sm text-black">
            <span className="text-xs text-black/50">Or pick a date</span>
            <input
              type="date"
              className={inputClass}
              value={calendarValue}
              onChange={(event) => {
                if (!event.target.value) return;
                onChange(event.target.value);
                setOpen(false);
              }}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function DueDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  const selected = DUE_DATE_OPTIONS.find((option) => option.label === value);

  return (
    <div ref={ref} className="relative flex flex-col gap-2.5">
      <span className="text-sm text-black">Due Date</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={fieldTriggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label ?? value}</span>
        <CaretIcon />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="py-1">
            {DUE_DATE_OPTIONS.map((option) => (
              <li key={option.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.label === value}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                  onClick={() => {
                    onChange(option.label);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-black">
                      {option.label}
                    </span>
                    <span className="block text-xs text-black/50">
                      {option.hint}
                    </span>
                  </span>
                  {option.label === value ? (
                    <span className="mt-0.5 text-prime-blue">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export type InvoiceDetailsState = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  taxMode: TaxMode;
  currency: string;
  validUntil?: string;
  serviceStart?: string;
  serviceEnd?: string;
  referenceNumber?: string;
};

function displayDetailDate(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return formatCalendarLabel(trimmed);
  return trimmed;
}

function taxSettingLabel(mode: TaxMode) {
  return (
    TAX_SETTING_OPTIONS.find((option) => option.value === mode)?.label ??
    "Exclusive"
  );
}

function serviceSummary(details: InvoiceDetailsState): {
  label: string;
  value: ReactNode;
} {
  const start = details.serviceStart?.trim() ?? "";
  const end = details.serviceEnd?.trim() ?? "";

  if (start && end) {
    return {
      label: "Service Period",
      value: `${formatServiceDay(start)} - ${formatServiceDay(end)}`,
    };
  }

  if (start) {
    return {
      label: "Service Period",
      value: (
        <>
          {formatServiceDay(start)} -{" "}
          <span className="text-black/40">no end date specified</span>
        </>
      ),
    };
  }

  return {
    label: "Service Period",
    value: "—",
  };
}

const detailsHoverCardClass =
  "rounded-[10px] border border-black/10 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue";

function SummaryCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-black/40">{label}</p>
      <p className="mt-2.5 text-sm text-black">{value}</p>
    </div>
  );
}

function DetailsEditor({
  details,
  onChange,
  documentKind = "invoice",
}: {
  details: InvoiceDetailsState;
  onChange: (next: InvoiceDetailsState) => void;
  documentKind?: "invoice" | "quote";
}) {
  const isQuote = documentKind === "quote";
  const quoteDateIso = /^\d{4}-\d{2}-\d{2}$/.test(details.issueDate)
    ? details.issueDate
    : "";
  const serviceStart = details.serviceStart ?? "";
  const serviceEnd = details.serviceEnd ?? "";
  const validUntil = details.validUntil ?? "";
  const referenceNumber = details.referenceNumber ?? "";

  const serviceStartError =
    !serviceStart.trim() ? "Service start date is required." : null;
  const serviceEndError =
    serviceStart &&
    serviceEnd &&
    /^\d{4}-\d{2}-\d{2}$/.test(serviceStart) &&
    /^\d{4}-\d{2}-\d{2}$/.test(serviceEnd) &&
    serviceEnd < serviceStart
      ? "End date can’t be before the start date."
      : null;
  const validUntilError =
    isQuote &&
    quoteDateIso &&
    validUntil &&
    /^\d{4}-\d{2}-\d{2}$/.test(validUntil) &&
    validUntil < quoteDateIso
      ? "Expiry can’t be before the quote date."
      : null;

  function patch(partial: Partial<InvoiceDetailsState>) {
    const next = { ...details, ...partial };

    if (
      next.serviceStart &&
      next.serviceEnd &&
      /^\d{4}-\d{2}-\d{2}$/.test(next.serviceStart) &&
      /^\d{4}-\d{2}-\d{2}$/.test(next.serviceEnd) &&
      next.serviceEnd < next.serviceStart
    ) {
      next.serviceEnd = next.serviceStart;
    }

    if (
      isQuote &&
      /^\d{4}-\d{2}-\d{2}$/.test(next.issueDate) &&
      next.validUntil &&
      /^\d{4}-\d{2}-\d{2}$/.test(next.validUntil) &&
      next.validUntil < next.issueDate
    ) {
      next.validUntil = next.issueDate;
    }

    onChange(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2.5">
          <span className="text-sm text-black">
            {isQuote ? "Estimate Number" : "Invoice Number"}
          </span>
          <input
            className={inputClass}
            value={details.invoiceNumber}
            onChange={(event) =>
              patch({ invoiceNumber: event.target.value })
            }
            aria-label={isQuote ? "Estimate number" : "Invoice number"}
          />
        </div>

        <IssueDateField
          value={details.issueDate}
          onChange={(issueDate) => patch({ issueDate })}
          label={isQuote ? "Estimate Date" : "Issue Date"}
          calendarOnly={isQuote}
        />

        <DueDateField
          value={details.dueDate}
          onChange={(dueDate) => patch({ dueDate })}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {isQuote ? (
          <CalendarDateField
            label="Valid Until"
            value={validUntil}
            onChange={(value) => patch({ validUntil: value })}
            min={quoteDateIso || undefined}
            error={validUntilError}
          />
        ) : (
          <label className="flex flex-col gap-2.5">
            <span className="text-sm text-black">Reference #</span>
            <input
              className={inputClass}
              value={referenceNumber}
              onChange={(event) =>
                patch({ referenceNumber: event.target.value })
              }
              placeholder="Optional"
            />
          </label>
        )}

        <CalendarDateField
          label="Service start"
          value={serviceStart}
          onChange={(value) => patch({ serviceStart: value })}
          required
          error={serviceStartError}
        />
        <CalendarDateField
          label="Service end"
          value={serviceEnd}
          onChange={(value) => patch({ serviceEnd: value })}
          optional
          min={serviceStart || undefined}
          error={serviceEndError}
        />
      </div>

      <TaxSettingField
        mode={details.taxMode}
        onChange={(taxMode) => patch({ taxMode })}
      />
    </div>
  );
}

/** Per-document details — summary + edit modal (same pattern as payments/automations). */
export function InvoiceDetailsPanel({
  details,
  onChange,
  documentKind = "invoice",
}: {
  details: InvoiceDetailsState;
  onChange: (next: InvoiceDetailsState) => void;
  documentKind?: "invoice" | "quote";
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(details);
  const isQuote = documentKind === "quote";
  const service = serviceSummary(details);

  const summaryCells: { id: string; label: string; value: ReactNode }[] = isQuote
    ? [
        {
          id: "number",
          label: "Estimate Number",
          value: details.invoiceNumber.trim() || "—",
        },
        {
          id: "issue",
          label: "Estimate Date",
          value: displayDetailDate(details.issueDate),
        },
        {
          id: "valid-until",
          label: "Valid Until",
          value: displayDetailDate(details.validUntil),
        },
        {
          id: "due",
          label: "Due Date",
          value: details.dueDate.trim() || "—",
        },
        { id: "service", label: service.label, value: service.value },
        {
          id: "tax",
          label: "Tax Setting",
          value: taxSettingLabel(details.taxMode),
        },
      ]
    : [
        {
          id: "number",
          label: "Invoice Number",
          value: details.invoiceNumber.trim() || "—",
        },
        {
          id: "issue",
          label: "Issue Date",
          value: displayDetailDate(details.issueDate),
        },
        {
          id: "due",
          label: "Due Date",
          value: details.dueDate.trim() || "—",
        },
        {
          id: "reference",
          label: "Reference #",
          value: details.referenceNumber?.trim() || "—",
        },
        { id: "service", label: service.label, value: service.value },
        {
          id: "tax",
          label: "Tax Setting",
          value: taxSettingLabel(details.taxMode),
        },
      ];

  function openEdit() {
    setDraft(details);
    setEditOpen(true);
  }

  function saveEdit() {
    onChange(draft);
    setEditOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openEdit}
        className={`relative w-full px-[30px] py-5 text-left ${detailsHoverCardClass}`}
        aria-label="Edit details"
      >
        <div className="grid grid-cols-1 gap-x-[30px] gap-y-5 sm:grid-cols-3 pr-6">
          {summaryCells.map((cell) => (
            <SummaryCell
              key={cell.id}
              label={cell.label}
              value={cell.value}
            />
          ))}
        </div>
        <span className="absolute right-3 top-3 text-black/30" aria-hidden>
          <PencilIcon />
        </span>
      </button>

      {editOpen ? (
        <Modal
          title="Edit Details"
          titleId="edit-document-details-title"
          onClose={() => setEditOpen(false)}
          confirmLabel="Save"
          onConfirm={saveEdit}
          maxWidthClass="max-w-3xl"
          zClass="z-[220]"
          subtitle={`Adjust the details for this ${documentKind}. Choices here do not update your organization or customer defaults.`}
        >
          <DetailsEditor
            details={draft}
            onChange={setDraft}
            documentKind={documentKind}
          />
        </Modal>
      ) : null}
    </>
  );
}
