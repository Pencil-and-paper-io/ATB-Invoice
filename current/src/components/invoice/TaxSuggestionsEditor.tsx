"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { type AlbertaTaxOption } from "@/lib/alberta-tax";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  taxSuggestionsFromOption,
  type TaxSuggestions,
} from "@/lib/tax-suggestions";

const inputClass = UI_CLASS.input;

/** Single tax-option dropdown for customer Tax Setting defaults. */
export function TaxSuggestionsEditor({
  value,
  onChange,
  options,
  recommendedLabel,
  recommendedNote,
  placeholder = "Select a tax rate...",
  ariaLabel = "Tax rate",
  showSelectedHint = false,
}: {
  value: TaxSuggestions;
  onChange: (next: TaxSuggestions) => void;
  options: AlbertaTaxOption[];
  /** Label of the option to highlight as recommended, if any. */
  recommendedLabel?: string;
  /** Help text shown under the recommended option. */
  recommendedNote?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** When true, show the selected option’s hint under the closed field. */
  showSelectedHint?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selectedLabel = value.suggestedLabel.trim();
  const selected = options.find((option) => option.label === selectedLabel);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function placeMenu() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const maxHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUpward =
        spaceBelow < Math.min(maxHeight, 160) && spaceAbove > spaceBelow;
      const height = Math.min(
        maxHeight,
        Math.max(openUpward ? spaceAbove : spaceBelow, 120),
      );
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 400,
        maxHeight: height,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function pickOption(option: AlbertaTaxOption) {
    onChange(taxSuggestionsFromOption(option));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className={`truncate ${selected ? "" : "text-black/45"}`}>
          {selected?.label ?? placeholder}
        </span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
          <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {showSelectedHint && selected?.hint ? (
        <p className="type-body-muted mt-1.5 text-xs leading-5">
          {selected.hint}
        </p>
      ) : null}
      {open && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuRef}
              role="listbox"
              data-portal-menu
              style={menuStyle}
              className="overflow-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
            >
              {options.map((option) => {
                const isRecommended =
                  Boolean(recommendedLabel) &&
                  option.label === recommendedLabel;
                return (
                  <li key={option.label}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.label === selectedLabel}
                      className="flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        pickOption(option);
                      }}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-black">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-prime-blue">
                          {option.label === selectedLabel ? (
                            <svg
                              width="14"
                              height="10"
                              viewBox="0 0 14 10"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M1 5.2 4.8 8.8 13 1.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                        {option.label}
                      </span>
                      {isRecommended && recommendedNote ? (
                        <span className="mt-0.5 pl-6 text-xs font-medium text-prime-blue">
                          {recommendedNote}
                        </span>
                      ) : null}
                      {option.hint ? (
                        <span className="mt-0.5 pl-6 text-xs text-black/50">
                          {option.hint}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
