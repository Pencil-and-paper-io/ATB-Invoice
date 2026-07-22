"use client";

import { useState } from "react";
import {
  matchAlbertaTaxOptions,
  type AlbertaTaxOption,
} from "@/lib/alberta-tax";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  syncSuggestedLabel,
  taxSuggestionsFromOption,
  type TaxSuggestions,
} from "@/lib/tax-suggestions";

const inputClass = UI_CLASS.input;

/** GST/HST + PST/QST defaults shown when the customer is Taxable. */
export function TaxSuggestionsEditor({
  value,
  onChange,
}: {
  value: TaxSuggestions;
  onChange: (next: TaxSuggestions) => void;
}) {
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const matches = matchAlbertaTaxOptions(suggestionQuery);

  function patch(partial: Partial<TaxSuggestions>) {
    const next = { ...value, ...partial };
    next.suggestedLabel = syncSuggestedLabel(next);
    onChange(next);
  }

  function pickSuggestion(option: AlbertaTaxOption) {
    onChange(taxSuggestionsFromOption(option));
    setSuggestionQuery(option.label);
    setSuggestionsOpen(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="type-body text-black/70">
        Tax rates should reflect your customer&apos;s billing location, not your
        business location.
      </p>

      <label className="flex flex-wrap items-center gap-3 text-sm text-black">
        <span className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includeGst}
            onChange={(event) => patch({ includeGst: event.target.checked })}
            className="h-4 w-4 rounded accent-prime-blue"
          />
          Include GST / HST
        </span>
        {value.includeGst ? (
          <span className="inline-flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="0.001"
              value={value.gstRate}
              onChange={(event) => patch({ gstRate: event.target.value })}
              className="w-20 rounded border border-black/20 bg-white px-2 py-1.5 text-sm outline-none focus:border-prime-blue"
              aria-label="GST or HST rate"
            />
            <span className="text-black/50">%</span>
          </span>
        ) : null}
      </label>

      <label className="flex flex-wrap items-center gap-3 text-sm text-black">
        <span className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includePst}
            onChange={(event) => patch({ includePst: event.target.checked })}
            className="h-4 w-4 rounded accent-prime-blue"
          />
          Include PST / QST
        </span>
        {value.includePst ? (
          <span className="inline-flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="0.001"
              value={value.pstRate}
              onChange={(event) => patch({ pstRate: event.target.value })}
              className="w-20 rounded border border-black/20 bg-white px-2 py-1.5 text-sm outline-none focus:border-prime-blue"
              aria-label="PST or QST rate"
            />
            <span className="text-black/50">%</span>
          </span>
        ) : null}
      </label>

      <div className="relative">
        <input
          className={inputClass}
          value={suggestionQuery}
          onChange={(event) => {
            setSuggestionQuery(event.target.value);
            setSuggestionsOpen(true);
          }}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setSuggestionsOpen(false), 150);
          }}
          placeholder="Search tax rates (e.g. HST, BC, QST)…"
          aria-label="Search tax rates"
        />
        {suggestionsOpen ? (
          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-black/10 bg-white shadow-lg">
            {matches.length ? (
              <ul className="py-1">
                {matches.map((option) => (
                  <li key={option.label}>
                    <button
                      type="button"
                      className="flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickSuggestion(option)}
                    >
                      <span className="text-sm font-semibold text-black">
                        {option.label}
                      </span>
                      <span className="text-xs text-black/50">
                        {option.hint}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-sm text-black/50">
                No matching tax rates
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
