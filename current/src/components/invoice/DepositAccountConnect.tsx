"use client";

import { DEMO_DEPOSIT_ACCOUNTS } from "@/lib/organization-settings";
import { UI_CLASS } from "@/lib/design-tokens";

const inputClass = UI_CLASS.input;

function DepositAccountSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <select
        aria-label={ariaLabel}
        className={`${inputClass} appearance-none pr-12 ${
          value ? "text-black" : "text-black/45"
        }`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an account...</option>
        {DEMO_DEPOSIT_ACCOUNTS.map((account) => (
          <option key={account.id} value={account.label}>
            {account.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-black/55"
        width="11"
        height="6"
        viewBox="0 0 11 6"
        fill="none"
        aria-hidden
      >
        <path
          d="M1 1l4.5 4L10 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ConnectedBadge() {
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-1.5 px-1 text-sm font-semibold text-black">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3.5 8.2 6.4 11 12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Connected
    </span>
  );
}

/** Inline deposit account select → Confirm → connected field with ×. */
export function DepositAccountBlock({
  ariaLabel,
  value,
  onChange,
  onSave,
  saved = false,
  errorMessage,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  saved?: boolean;
  errorMessage?: string;
}) {
  const canConfirm = Boolean(value.trim()) && !saved;

  return (
    <div className="mt-3">
      <p className="mb-2 type-label">Choose the destination of your payment</p>
      {saved && value.trim() ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded border border-black/20 bg-input-grey px-3.5">
            <span className="min-w-0 truncate text-sm text-black">{value}</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-black/50 transition hover:bg-black/5 hover:text-black"
              aria-label="Disconnect account"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <ConnectedBadge />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <DepositAccountSelect
              ariaLabel={ariaLabel}
              value={value}
              onChange={onChange}
            />
            {onSave ? (
              <button
                type="button"
                onClick={onSave}
                disabled={!canConfirm}
                className="ui-btn-secondary h-9 shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm
              </button>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="mt-2 text-sm font-semibold text-delete-red">
              {errorMessage}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function paymentRequestSubtitle(
  organizationName: string,
  organizationEmail: string,
) {
  return (
    <>
      Requests will be shown as coming from{" "}
      <span className="font-semibold">{organizationName || "—"}</span> using{" "}
      <span className="font-semibold">{organizationEmail || "—"}</span>.
    </>
  );
}
