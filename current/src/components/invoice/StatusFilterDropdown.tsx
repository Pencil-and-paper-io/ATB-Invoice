"use client";

import { useId, useRef, useState } from "react";
import { DropdownMenuCheck } from "./DropdownMenuCheck";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";

export function StatusFilterDropdown({
  options,
  value,
  onChange,
  label = "Filter by status",
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useDismissOnOutsideClick(rootRef, () => setOpen(false), open);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-black/15 bg-white px-3.5 text-sm transition hover:bg-black/[0.03]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
      >
        <span className="max-w-[12rem] truncate text-left">
          <span className="font-semibold text-black/45">Status</span>
          <span className="mx-1.5 font-semibold text-black/25" aria-hidden>
            ·
          </span>
          <span className="font-semibold text-midnight-ink">{value}</span>
        </span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
          <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-40 mt-1 max-h-72 w-[220px] overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.04] ${
                  selected
                    ? "bg-prime-blue/8 text-prime-blue"
                    : "text-midnight-ink"
                }`}
              >
                <DropdownMenuCheck selected={selected} />
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
