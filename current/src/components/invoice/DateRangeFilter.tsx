"use client";

import { useId, useRef, useState } from "react";
import {
  DATE_RANGE_PRESETS,
  dateRangeLabel,
  type DateRangePreset,
  type DateRangeValue,
} from "@/lib/directory-date-range";
import { DropdownMenuCheck } from "./DropdownMenuCheck";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";

export function DateRangeFilter({
  value,
  onChange,
  prefixLabel = "Created",
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  /** Grey label before the selected range (e.g. “Created”). */
  prefixLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useDismissOnOutsideClick(rootRef, () => setOpen(false), open);

  function selectPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      onChange({
        ...value,
        preset: "custom",
        customStart: value.customStart,
        customEnd: value.customEnd,
      });
      return;
    }
    onChange({
      preset,
      customStart: null,
      customEnd: null,
    });
    setOpen(false);
  }

  const showingCustom = value.preset === "custom";
  const rangeText = dateRangeLabel(value);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-black/15 bg-white px-3.5 text-sm transition hover:bg-black/[0.03]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <CalendarIcon />
        <span className="max-w-[14rem] truncate text-left">
          <span className="font-semibold text-black/45">{prefixLabel}</span>
          <span className="mx-1.5 font-semibold text-black/25" aria-hidden>
            ·
          </span>
          <span className="font-semibold text-midnight-ink">{rangeText}</span>
        </span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
          <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-label={`${prefixLabel} date range`}
          className="absolute right-0 top-full z-40 mt-1 w-[280px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg"
        >
          {DATE_RANGE_PRESETS.map((preset) => {
            const selected = value.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.04] ${
                  selected
                    ? "bg-prime-blue/8 text-prime-blue"
                    : "text-midnight-ink"
                }`}
              >
                <DropdownMenuCheck selected={selected} />
                <span>{preset.label}</span>
              </button>
            );
          })}

          {showingCustom ? (
            <div className="border-t border-black/10 px-4 py-3">
              <p className="text-xs font-semibold text-black/50">Custom range</p>
              <div className="mt-2 flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-xs text-black/55">
                  Start
                  <input
                    type="date"
                    value={value.customStart ?? ""}
                    onChange={(event) =>
                      onChange({
                        preset: "custom",
                        customStart: event.target.value || null,
                        customEnd: value.customEnd,
                      })
                    }
                    className="h-10 rounded border border-black/15 bg-input-grey px-2 text-sm text-midnight-ink outline-none focus:border-prime-blue"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-black/55">
                  End
                  <input
                    type="date"
                    value={value.customEnd ?? ""}
                    onChange={(event) =>
                      onChange({
                        preset: "custom",
                        customStart: value.customStart,
                        customEnd: event.target.value || null,
                      })
                    }
                    className="h-10 rounded border border-black/15 bg-input-grey px-2 text-sm text-midnight-ink outline-none focus:border-prime-blue"
                  />
                </label>
                <button
                  type="button"
                  disabled={!value.customStart || !value.customEnd}
                  onClick={() => setOpen(false)}
                  className="mt-1 h-10 rounded bg-prime-blue text-sm font-semibold text-white transition hover:bg-prime-blue-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="text-black/45"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5 2v2.5M11 2v2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
