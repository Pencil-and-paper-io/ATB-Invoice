"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import { Modal } from "./ui";

const PAYMENT_METHODS = ["Cash", "Cheque", "E-Transfer", "Other"] as const;

const INVOICE_TOTAL = previewMeta.amount;

export function RecordPaymentModal({
  onClose,
  balanceDue = INVOICE_TOTAL,
}: {
  onClose: () => void;
  /** Outstanding balance (defaults to full invoice total). */
  balanceDue?: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(balanceDue));
  const [method, setMethod] =
    useState<(typeof PAYMENT_METHODS)[number]>("Cash");
  const [chequeRef, setChequeRef] = useState("");
  const [voidRemainder, setVoidRemainder] = useState(false);
  const [saving, setSaving] = useState(false);

  const amountValue = Number(amount);
  const remaining = useMemo(() => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) return balanceDue;
    return Math.max(0, Number((balanceDue - amountValue).toFixed(2)));
  }, [amountValue, balanceDue]);

  const isPartial =
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    amountValue < balanceDue - 0.001;

  const canSave =
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    amountValue <= balanceDue + 0.001 &&
    !saving;

  function handleSave() {
    if (!canSave) return;
    setSaving(true);
    window.setTimeout(() => {
      if (!isPartial || voidRemainder) {
        router.push("/sent/paid");
        return;
      }
      router.push("/sent/partially-paid");
    }, 200);
  }

  return (
    <Modal
      title="Record payment"
      titleId="record-payment-title"
      onClose={onClose}
      confirmLabel={
        voidRemainder && isPartial ? "Save and close balance" : "Save payment"
      }
      onConfirm={handleSave}
      confirmDisabled={!canSave}
    >
      <p className="type-body-muted text-center">
        Invoice total {formatMoney(INVOICE_TOTAL)}. Balance due{" "}
        {formatMoney(balanceDue)}.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-black">Amount</span>
          <input
            className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setVoidRemainder(false);
            }}
            inputMode="decimal"
          />
        </label>

        {isPartial ? (
          <div className="rounded-lg border border-[#E8A317]/40 bg-[#FFF8E6] px-3 py-3 text-sm text-black/80">
            <p>
              Remaining balance after this payment:{" "}
              <span className="font-semibold">{formatMoney(remaining)}</span>
            </p>
            <label className="mt-3 flex items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-prime-blue"
                checked={voidRemainder}
                onChange={(event) => setVoidRemainder(event.target.checked)}
              />
              <span>
                Void / forgive the remaining {formatMoney(remaining)} and mark
                this invoice paid
              </span>
            </label>
          </div>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-black">Method</span>
          <select
            className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as (typeof PAYMENT_METHODS)[number])
            }
          >
            {PAYMENT_METHODS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {method === "Cheque" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-black">
              Cheque reference{" "}
              <span className="text-black/40">(optional)</span>
            </span>
            <input
              className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
              value={chequeRef}
              onChange={(event) => setChequeRef(event.target.value)}
              placeholder="Cheque number"
            />
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
