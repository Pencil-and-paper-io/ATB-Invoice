"use client";

import { useEffect, useState } from "react";
import {
  DEMO_DEPOSIT_ACCOUNTS,
  loadOrganizationSettings,
  saveOrganizationSettings,
  type InvoicePaymentOption,
  type PaymentMethodId,
} from "@/lib/organization-settings";
import { UI_CLASS } from "@/lib/design-tokens";
import { AddPaymentOptionsModal } from "./AddPaymentOptionsModal";
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
  organizationName,
  organizationEmail,
}: {
  option: InvoicePaymentOption;
  accountDraft: string;
  onAccountDraftChange: (value: string) => void;
  onSaveAccount: () => void;
  onToggle: (id: InvoicePaymentOption["id"]) => void;
  organizationName: string;
  organizationEmail: string;
}) {
  const requiresAccount = needsDepositAccount(option.id);
  const accountSaved = Boolean(option.accountLabel?.trim());
  const draftMatchesSaved =
    accountSaved && accountDraft.trim() === option.accountLabel?.trim();
  const showDestination = requiresAccount && option.checked;

  return (
    <div className="flex gap-2.5">
      <div
        className={`flex shrink-0 items-center ${
          option.checked ? "h-16" : "h-11"
        }`}
      >
        <button
          type="button"
          onClick={() => onToggle(option.id)}
          className={`flex h-5 w-5 items-center justify-center rounded-[3px] transition ${
            option.checked
              ? "border border-prime-blue bg-prime-blue"
              : "border border-black/25 bg-transparent"
          }`}
          aria-pressed={option.checked}
          aria-label={`Toggle ${option.label}`}
        >
          {option.checked ? (
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
        className={`min-w-0 flex-1 rounded-[10px] border border-black/10 px-[30px] transition ${
          option.checked ? "py-5" : "py-3"
        }`}
      >
        <p className="text-base font-bold leading-6 text-black">{option.label}</p>
        {option.checked ? (
          <>
            {showDestination ? (
              <p className="mt-1 text-sm leading-5 text-black">
                Requests will be shown as coming from{" "}
                <span className="font-semibold">{organizationName || "—"}</span>{" "}
                using{" "}
                <span className="font-semibold">{organizationEmail || "—"}</span>.
              </p>
            ) : null}

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

            {showDestination ? (
              <div className="mt-4 flex flex-col gap-2">
                <label className="text-sm text-black">
                  Choose the destination of your payment
                </label>
                {accountSaved && draftMatchesSaved && accountDraft.trim() ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded border border-black/20 bg-input-grey px-3.5">
                      <span className="min-w-0 truncate text-sm text-black">
                        {accountDraft}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAccountDraftChange("")}
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
                    <span className="inline-flex h-9 shrink-0 items-center gap-1.5 px-1 text-sm font-semibold text-black">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                      >
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
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-0 flex-1">
                      <select
                        aria-label={`${option.label} payment destination`}
                        className={`${inputClass} appearance-none pr-12 ${
                          accountDraft ? "text-black" : "text-black/45"
                        }`}
                        value={accountDraft}
                        onChange={(event) =>
                          onAccountDraftChange(event.target.value)
                        }
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
                    <button
                      type="button"
                      onClick={onSaveAccount}
                      disabled={!accountDraft.trim() || draftMatchesSaved}
                      className="ui-btn-secondary h-9 shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export type PartialPaymentState = {
  enabled: boolean;
  minimum: string;
};

export function PaymentOptionsSection({
  payments,
  onToggle,
  onChange,
  partialPayment,
  onPartialPaymentChange,
}: {
  payments: InvoicePaymentOption[];
  onToggle: (id: InvoicePaymentOption["id"]) => void;
  onChange?: (next: InvoicePaymentOption[]) => void;
  partialPayment?: PartialPaymentState;
  onPartialPaymentChange?: (next: PartialPaymentState) => void;
}) {
  const [accountDrafts, setAccountDrafts] = useState<
    Partial<Record<PaymentMethodId, string>>
  >({});
  const [organizationName, setOrganizationName] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [addOptionsOpen, setAddOptionsOpen] = useState(false);
  const [localPartial, setLocalPartial] = useState<PartialPaymentState>({
    enabled: false,
    minimum: "",
  });
  const partial = partialPayment ?? localPartial;
  function setPartial(next: PartialPaymentState) {
    if (onPartialPaymentChange) onPartialPaymentChange(next);
    else setLocalPartial(next);
  }

  useEffect(() => {
    const settings = loadOrganizationSettings();
    const displayName = settings.useLegalNameOnInvoices
      ? settings.businessName
      : settings.tradingAsName.trim() || settings.businessName;
    window.setTimeout(() => {
      setOrganizationName(displayName);
      setOrganizationEmail(settings.email);
    }, 0);

    setAccountDrafts((prev) => {
      const next = { ...prev };
      for (const option of payments) {
        if (!needsDepositAccount(option.id)) continue;
        if (next[option.id] !== undefined) continue;
        next[option.id] = option.accountLabel || "";
      }
      return next;
    });
  }, [payments]);

  function saveAccount(id: PaymentMethodId) {
    const accountLabel = (accountDrafts[id] || "").trim();
    if (!accountLabel) return;

    const nextPayments = payments.map((option) =>
      option.id === id
        ? { ...option, accountLabel, checked: true }
        : option,
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

  function handleAccountDraftChange(id: PaymentMethodId, value: string) {
    setAccountDrafts((prev) => ({ ...prev, [id]: value }));
    const current = payments.find((option) => option.id === id);
    if (
      current?.accountLabel?.trim() &&
      value.trim() !== current.accountLabel.trim()
    ) {
      onChange?.(
        payments.map((option) =>
          option.id === id ? { ...option, accountLabel: undefined } : option,
        ),
      );
    }
  }

  return (
    <SectionCard title="Payment Options">
      <div className="flex flex-col gap-2.5">
        {payments.map((option) => (
          <PaymentOptionRow
            key={option.id}
            option={option}
            accountDraft={
              accountDrafts[option.id] ?? option.accountLabel ?? ""
            }
            onAccountDraftChange={(value) =>
              handleAccountDraftChange(option.id, value)
            }
            onSaveAccount={() => saveAccount(option.id)}
            onToggle={onToggle}
            organizationName={organizationName}
            organizationEmail={organizationEmail}
          />
        ))}
        <TertiaryButton onClick={() => setAddOptionsOpen(true)}>
          Add more payment options
        </TertiaryButton>

        <div className="mt-1 border-t border-black/10 pt-3">
          <label className="flex items-start gap-2.5 text-sm text-black">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-prime-blue"
              checked={partial.enabled}
              onChange={(event) =>
                setPartial({
                  ...partial,
                  enabled: event.target.checked,
                  minimum: event.target.checked ? partial.minimum : "",
                })
              }
            />
            <span>Allow partial payment</span>
          </label>
          {partial.enabled ? (
            <div className="mt-2 pl-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-black/65">
                  Minimum payment{" "}
                  <span className="text-black/40">(optional)</span>
                </span>
                <div className="relative max-w-[220px]">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/45">
                    $
                  </span>
                  <input
                    inputMode="decimal"
                    className={`${inputClass} pl-7`}
                    value={partial.minimum}
                    placeholder="0.00"
                    onChange={(event) =>
                      setPartial({
                        ...partial,
                        minimum: event.target.value.replace(/[^\d.]/g, ""),
                      })
                    }
                    aria-label="Minimum partial payment amount"
                  />
                </div>
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {addOptionsOpen ? (
        <AddPaymentOptionsModal
          currentPayments={payments}
          onClose={() => setAddOptionsOpen(false)}
          onSaved={(next) => {
            setAddOptionsOpen(false);
            onChange?.(next);
            const settings = loadOrganizationSettings();
            const displayName = settings.useLegalNameOnInvoices
              ? settings.businessName
              : settings.tradingAsName.trim() || settings.businessName;
            setOrganizationName(displayName);
            setOrganizationEmail(settings.email);
          }}
        />
      ) : null}
    </SectionCard>
  );
}
