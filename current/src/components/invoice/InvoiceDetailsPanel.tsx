"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type TaxMode } from "@/lib/alberta-tax";

const ISSUE_DATE_PRESETS = [
  "Send right away",
  "Send at end-of-month",
] as const;

const DUE_DATE_OPTIONS = ["Net 30", "Net 15", "Upon receipt"] as const;

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
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  const selected =
    TAX_SETTING_OPTIONS.find((option) => option.value === mode) ??
    TAX_SETTING_OPTIONS[0];

  return (
    <div ref={ref} className="relative flex flex-col gap-2.5">
      <span className="text-sm text-black">Tax Setting</span>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={fieldTriggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected.label}</span>
        <CaretIcon />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="py-1">
            {TAX_SETTING_OPTIONS.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === mode}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                  onClick={() => {
                    onChange(option.value);
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
                  {option.value === mode ? (
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

function formatCalendarLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
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
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white p-3 shadow-lg">
          <input
            type="date"
            className={inputClass}
            value={iso}
            min={min}
            max={max}
            onChange={(event) => {
              onChange(event.target.value);
              if (event.target.value) setOpen(false);
            }}
            autoFocus
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
        <span>{value}</span>
        <CaretIcon />
      </button>
      {open ? (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="py-1">
            {DUE_DATE_OPTIONS.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option === value}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-black/[0.04]"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <span>{option}</span>
                  {option === value ? (
                    <span className="text-prime-blue">
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

export function InvoiceDetailsPanel({
  details,
  onChange,
  documentKind = "invoice",
}: {
  details: InvoiceDetailsState;
  onChange: (next: InvoiceDetailsState) => void;
  documentKind?: "invoice" | "quote";
}) {
  const isQuote = documentKind === "quote";
  const showReference = !isQuote;
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
    <div className="flex flex-col gap-2.5">
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

      {isQuote ? (
        <CalendarDateField
          label="Valid Until"
          value={validUntil}
          onChange={(value) => patch({ validUntil: value })}
          min={quoteDateIso || undefined}
          error={validUntilError}
        />
      ) : null}

      <DueDateField
        value={details.dueDate}
        onChange={(dueDate) => patch({ dueDate })}
      />

      {showReference ? (
        <label className="flex flex-col gap-2.5">
          <span className="text-sm text-black">
            Reference #{" "}
            <span className="text-black/40">(PO / contract / quote)</span>
          </span>
          <input
            className={inputClass}
            value={referenceNumber}
            onChange={(event) =>
              patch({ referenceNumber: event.target.value })
            }
            placeholder="Optional"
          />
        </label>
      ) : null}

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

      <TaxSettingField
        mode={details.taxMode}
        onChange={(taxMode) => patch({ taxMode })}
      />
    </div>
  );
}
