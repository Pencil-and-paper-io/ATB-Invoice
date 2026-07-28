"use client";

import {
  formatGstHstNumber,
  parseGstHstNumber,
} from "@/lib/organization-settings";

/** Fixed CRA GST/HST account segment shown beside the business number. */
export const GST_HST_ACCOUNT_SUFFIX = "0001";

const shellClass =
  "flex w-full max-w-[16.5rem] items-stretch overflow-hidden rounded border border-black/20 bg-input-grey transition focus-within:border-prime-blue focus-within:bg-input-grey";

export function GstHstNumberField({
  id,
  value,
  onChange,
  onBlurComplete,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  onBlurComplete?: () => void;
}) {
  const { bn } = parseGstHstNumber(value);

  return (
    <div
      className={shellClass}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) return;
        onBlurComplete?.();
      }}
    >
      <input
        id={id}
        inputMode="numeric"
        maxLength={9}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-midnight-ink outline-none"
        value={bn}
        onChange={(event) => {
          const nextBn = event.target.value.replace(/[^\d]/g, "").slice(0, 9);
          onChange(
            nextBn
              ? formatGstHstNumber(nextBn, GST_HST_ACCOUNT_SUFFIX)
              : "",
          );
        }}
        placeholder="123456789"
        aria-label="GST/HST business number, 9 digits"
        aria-describedby={`${id}-suffix`}
      />
      <span
        id={`${id}-suffix`}
        className="flex shrink-0 items-center pr-3 text-sm text-black/40 select-none"
      >
        RT{GST_HST_ACCOUNT_SUFFIX}
      </span>
    </div>
  );
}
