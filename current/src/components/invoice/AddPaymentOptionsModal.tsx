"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CORE_PAYMENT_METHODS,
  getInvoicePaymentOptions,
  loadOrganizationSettings,
  paymentMethodLabel,
  saveOrganizationSettings,
  type InvoicePaymentOption,
  type OrganizationSettings,
  type PaymentMethodConfig,
  type PaymentMethodId,
} from "@/lib/organization-settings";
import {
  DepositAccountBlock,
  paymentRequestSubtitle,
} from "./DepositAccountConnect";
import { Modal } from "./ui";

function needsDepositAccount(id: PaymentMethodId) {
  return id === "interac" || id === "eft";
}

function PaymentMethodDetails({
  details,
}: {
  details: readonly { label: string; text: string; italic?: boolean }[];
}) {
  if (!details.length) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black">
      {details.map((detail) => (
        <li key={`${detail.label}-${detail.text}`}>
          <span className={detail.italic ? "italic" : undefined}>
            {detail.label}: {detail.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MethodRow({
  label,
  details,
  enabled,
  onToggle,
  subtitle,
  accountDraft,
  accountSaved,
  onAccountDraftChange,
  onConfirmAccount,
  comingSoon = false,
}: {
  label: ReactNode;
  details: readonly { label: string; text: string; italic?: boolean }[];
  enabled: boolean;
  onToggle?: () => void;
  subtitle?: ReactNode;
  accountDraft?: string;
  accountSaved?: boolean;
  onAccountDraftChange?: (value: string) => void;
  onConfirmAccount?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] border px-4 py-3 ${
        comingSoon ? "border-black/20 bg-[#F3F3F3]" : "border-black/10 bg-white"
      }`}
    >
      <label
        className={`flex items-start gap-3 ${
          comingSoon || !onToggle ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={enabled}
          disabled={comingSoon || !onToggle}
          onChange={() => onToggle?.()}
          className="mt-0.5 h-4 w-4 rounded border-black/25 accent-prime-blue disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="min-w-0 flex-1">
          <span
            className={`inline-flex flex-wrap items-center gap-2 text-sm font-semibold ${
              comingSoon ? "text-black/55" : "text-black"
            }`}
          >
            {label}
          </span>
          {enabled && subtitle ? (
            <span className="mt-1 block text-sm font-normal leading-5 text-black">
              {subtitle}
            </span>
          ) : null}
        </span>
      </label>
      {enabled && !comingSoon ? (
        <div className="mt-3 pl-7">
          <PaymentMethodDetails details={details} />
          {onAccountDraftChange && onConfirmAccount ? (
            <DepositAccountBlock
              ariaLabel={`${typeof label === "string" ? label : "Payment"} destination`}
              value={accountDraft ?? ""}
              onChange={onAccountDraftChange}
              onSave={onConfirmAccount}
              saved={Boolean(accountSaved)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function mergeDraftPayments(
  previous: InvoicePaymentOption[],
  next: InvoicePaymentOption[],
): InvoicePaymentOption[] {
  const previousChecked = new Map(
    previous.map((option) => [option.id, option.checked] as const),
  );
  return next.map((option) => ({
    ...option,
    checked: previousChecked.has(option.id)
      ? Boolean(previousChecked.get(option.id))
      : option.checked,
  }));
}

export function AddPaymentOptionsModal({
  currentPayments,
  onClose,
  onSaved,
}: {
  currentPayments: InvoicePaymentOption[];
  onClose: () => void;
  onSaved: (next: InvoicePaymentOption[]) => void;
}) {
  const initial = useMemo(() => loadOrganizationSettings(), []);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(
    () => initial.paymentMethods.map((method) => ({ ...method })),
  );
  const [paymentPreferences, setPaymentPreferences] = useState<string[]>(
    () => [...initial.paymentPreferences],
  );
  const [accountDrafts, setAccountDrafts] = useState<
    Record<"interac" | "eft", string>
  >(() => ({
    interac:
      initial.paymentMethods.find((method) => method.id === "interac")
        ?.accountLabel ?? "",
    eft:
      initial.paymentMethods.find((method) => method.id === "eft")
        ?.accountLabel ?? "",
  }));
  const [accountConfirmed, setAccountConfirmed] = useState<
    Record<"interac" | "eft", boolean>
  >(() => ({
    interac: Boolean(
      initial.paymentMethods
        .find((method) => method.id === "interac")
        ?.accountLabel?.trim(),
    ),
    eft: Boolean(
      initial.paymentMethods
        .find((method) => method.id === "eft")
        ?.accountLabel?.trim(),
    ),
  }));

  const orgDisplayName = initial.useLegalNameOnInvoices
    ? initial.businessName
    : initial.tradingAsName.trim() || initial.businessName;

  function toggleMethod(id: PaymentMethodId) {
    const currentlyEnabled = Boolean(
      paymentMethods.find((method) => method.id === id)?.enabled,
    );
    const enabling = !currentlyEnabled;
    const label = paymentMethodLabel(id);

    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === id
          ? {
              ...method,
              enabled: enabling,
              accountLabel: enabling
                ? method.accountLabel
                : needsDepositAccount(id)
                  ? ""
                  : method.accountLabel,
            }
          : method,
      ),
    );
    setPaymentPreferences((prev) =>
      enabling
        ? prev.includes(label)
          ? prev
          : [...prev, label]
        : prev.filter((item) => item !== label),
    );

    if (!enabling && needsDepositAccount(id) && (id === "interac" || id === "eft")) {
      setAccountDrafts((prev) => ({ ...prev, [id]: "" }));
      setAccountConfirmed((prev) => ({ ...prev, [id]: false }));
    }
  }

  function updateAccountDraft(id: "interac" | "eft", value: string) {
    setAccountDrafts((prev) => ({ ...prev, [id]: value }));
    setAccountConfirmed((prev) => ({ ...prev, [id]: false }));
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === id ? { ...method, accountLabel: "" } : method,
      ),
    );
  }

  function confirmAccount(id: "interac" | "eft") {
    const accountLabel = accountDrafts[id].trim();
    if (!accountLabel) return;
    const label = paymentMethodLabel(id);
    setAccountConfirmed((prev) => ({ ...prev, [id]: true }));
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === id
          ? { ...method, enabled: true, accountLabel }
          : method,
      ),
    );
    setPaymentPreferences((prev) =>
      prev.includes(label) ? prev : [...prev, label],
    );
  }

  function save() {
    const settings: OrganizationSettings = {
      ...loadOrganizationSettings(),
      paymentMethods: paymentMethods.map((method) => {
        if (method.id === "interac" || method.id === "eft") {
          return {
            ...method,
            accountLabel: accountConfirmed[method.id]
              ? accountDrafts[method.id].trim()
              : method.accountLabel,
          };
        }
        return method;
      }),
      paymentPreferences,
    };
    saveOrganizationSettings(settings);
    const next = mergeDraftPayments(
      currentPayments,
      getInvoicePaymentOptions(settings),
    );
    onSaved(next);
  }

  return (
    <Modal
      title="Payment Options"
      titleId="add-payment-options-title"
      onClose={onClose}
      closeOnBackdrop={false}
      zClass="z-[220]"
      maxWidthClass="max-w-xl"
      confirmLabel="Save"
      onConfirm={save}
    >
      <p className="mb-4 text-sm leading-5 text-black/70">
        Choose how you want to receive payments by default. Saving updates your
        organization and this invoice or quote.
      </p>
      <div className="flex max-h-[min(60vh,28rem)] flex-col gap-3 overflow-y-auto pr-1">
        {paymentMethods.map((method) => {
          const meta = CORE_PAYMENT_METHODS.find(
            (entry) => entry.id === method.id,
          );
          if (!meta) return null;
          const label = paymentMethodLabel(method.id);
          const needsAccount = needsDepositAccount(method.id);

          return (
            <MethodRow
              key={method.id}
              label={label}
              details={meta.details}
              enabled={method.enabled}
              onToggle={() => toggleMethod(method.id)}
              subtitle={
                needsAccount && method.enabled
                  ? paymentRequestSubtitle(orgDisplayName, initial.email)
                  : undefined
              }
              accountDraft={
                method.id === "interac" || method.id === "eft"
                  ? accountDrafts[method.id]
                  : undefined
              }
              accountSaved={
                method.id === "interac" || method.id === "eft"
                  ? accountConfirmed[method.id]
                  : undefined
              }
              onAccountDraftChange={
                method.id === "interac" || method.id === "eft"
                  ? (value) => updateAccountDraft(method.id as "interac" | "eft", value)
                  : undefined
              }
              onConfirmAccount={
                method.id === "interac" || method.id === "eft"
                  ? () => confirmAccount(method.id as "interac" | "eft")
                  : undefined
              }
            />
          );
        })}
        <MethodRow
          label={
            <>
              Credit Card
              <span className="rounded-md bg-black/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black/70">
                Coming Soon
              </span>
            </>
          }
          details={[]}
          enabled={false}
          comingSoon
        />
      </div>
    </Modal>
  );
}
