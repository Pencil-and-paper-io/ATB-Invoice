"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEMO_DEPOSIT_ACCOUNTS,
  loadOrganizationSettings,
  saveOrganizationSettings,
  type InvoicePaymentOption,
  type PaymentMethodId,
} from "@/lib/organization-settings";
import { UI_CLASS } from "@/lib/design-tokens";
import { SectionCard, TertiaryButton } from "./ui";

const inputClass = UI_CLASS.input;

function needsDepositAccount(id: PaymentMethodId) {
  return id === "interac" || id === "eft";
}

function PaymentOptionRow({
  option,
  accountDraft,
  onAccountDraftChange,
  onSaveAccount,
  onToggle,
}: {
  option: InvoicePaymentOption;
  accountDraft: string;
  onAccountDraftChange: (value: string) => void;
  onSaveAccount: () => void;
  onToggle: (id: InvoicePaymentOption["id"]) => void;
}) {
  const requiresAccount = needsDepositAccount(option.id);
  const accountSaved = Boolean(option.accountLabel?.trim());
  const checkboxDisabled = requiresAccount && !accountSaved;
  const draftMatchesSaved =
    accountSaved && accountDraft.trim() === option.accountLabel?.trim();

  return (
    <div className="flex gap-2.5">
      <div className="flex h-16 shrink-0 items-center">
        <button
          type="button"
          disabled={checkboxDisabled}
          onClick={() => {
            if (checkboxDisabled) return;
            onToggle(option.id);
          }}
          className={`flex h-5 w-5 items-center justify-center rounded-[3px] transition ${
            checkboxDisabled
              ? "cursor-not-allowed border border-black/20 bg-black/[0.04] opacity-60"
              : option.checked
                ? "border border-prime-blue bg-prime-blue"
                : "border border-black/25 bg-transparent"
          }`}
          aria-pressed={option.checked}
          aria-disabled={checkboxDisabled}
          aria-label={
            checkboxDisabled
              ? `Save a deposit account to enable ${option.label}`
              : `Toggle ${option.label}`
          }
        >
          {option.checked && !checkboxDisabled ? (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
              <path
                d="M1 5.2 4.2 8.5 11 1.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>
      </div>
      <div
        className={`min-w-0 flex-1 rounded-[10px] border px-[30px] py-5 transition ${
          option.checked ? "border-midnight-ink" : "border-black/10"
        }`}
      >
        <p className="text-base font-bold leading-6 text-black">{option.label}</p>

        {option.details?.length ? (
          <ul className="mt-2.5 list-disc space-y-1 pl-5 text-sm font-normal text-black">
            {option.details.map((detail) => (
              <li key={`${detail.label}-${detail.text}`}>
                <span className={detail.italic ? "italic" : undefined}>
                  {detail.label}: {detail.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {requiresAccount ? (
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-sm text-black">Deposit Account</label>
            <div className="relative">
              <select
                aria-label={`${option.label} deposit account`}
                className={`${inputClass} appearance-none pr-12`}
                value={accountDraft}
                onChange={(event) => onAccountDraftChange(event.target.value)}
              >
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSaveAccount}
                disabled={!accountDraft.trim() || draftMatchesSaved}
                className="ui-btn-secondary h-9 px-4 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save account
              </button>
              {checkboxDisabled ? (
                <p className="text-sm text-black/55">
                  Save a deposit account to enable this option.
                </p>
              ) : accountSaved ? (
                <p className="text-sm text-black/55">
                  Using {option.accountLabel}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PaymentOptionsSection({
  payments,
  onToggle,
  onChange,
}: {
  payments: InvoicePaymentOption[];
  onToggle: (id: InvoicePaymentOption["id"]) => void;
  onChange?: (next: InvoicePaymentOption[]) => void;
}) {
  const router = useRouter();
  const [accountDrafts, setAccountDrafts] = useState<
    Partial<Record<PaymentMethodId, string>>
  >({});

  useEffect(() => {
    setAccountDrafts((prev) => {
      const next = { ...prev };
      for (const option of payments) {
        if (!needsDepositAccount(option.id)) continue;
        if (next[option.id]) continue;
        next[option.id] =
          option.accountLabel || DEMO_DEPOSIT_ACCOUNTS[0]?.label || "";
      }
      return next;
    });
  }, [payments]);

  function saveAccount(id: PaymentMethodId) {
    const accountLabel = (accountDrafts[id] || "").trim();
    if (!accountLabel) return;

    const nextPayments = payments.map((option) =>
      option.id === id ? { ...option, accountLabel } : option,
    );
    onChange?.(nextPayments);

    const settings = loadOrganizationSettings();
    saveOrganizationSettings({
      ...settings,
      paymentMethods: settings.paymentMethods.map((method) =>
        method.id === id ? { ...method, accountLabel, enabled: true } : method,
      ),
    });
  }

  return (
    <SectionCard title="Payment Options">
      <div className="flex flex-col gap-2.5">
        {payments.map((option) => (
          <PaymentOptionRow
            key={option.id}
            option={option}
            accountDraft={
              accountDrafts[option.id] ||
              option.accountLabel ||
              DEMO_DEPOSIT_ACCOUNTS[0]?.label ||
              ""
            }
            onAccountDraftChange={(value) =>
              setAccountDrafts((prev) => ({ ...prev, [option.id]: value }))
            }
            onSaveAccount={() => saveAccount(option.id)}
            onToggle={onToggle}
          />
        ))}
        <TertiaryButton
          onClick={() => router.push("/organization#payment-options")}
        >
          Add more payment options
        </TertiaryButton>
      </div>
    </SectionCard>
  );
}
