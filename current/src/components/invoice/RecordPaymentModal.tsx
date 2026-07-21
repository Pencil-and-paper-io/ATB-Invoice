"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import { Modal } from "./ui";

const PAYMENT_METHODS = ["Cash", "Cheque", "E-Transfer", "Other"] as const;

export function RecordPaymentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(previewMeta.amount));
  const [method, setMethod] =
    useState<(typeof PAYMENT_METHODS)[number]>("Cash");
  const [chequeRef, setChequeRef] = useState("");
  const [saving, setSaving] = useState(false);

  const amountValue = Number(amount);
  const canSave =
    Number.isFinite(amountValue) && amountValue > 0 && !saving;

  function handleSave() {
    if (!canSave) return;
    setSaving(true);
    window.setTimeout(() => {
      router.push("/sent/paid");
    }, 200);
  }

  return (
    <Modal
      title="Record payment"
      titleId="record-payment-title"
      onClose={onClose}
      confirmLabel="Save payment"
      onConfirm={handleSave}
      confirmDisabled={!canSave}
    >
      <p className="type-body-muted text-center">
        Invoice total {formatMoney(previewMeta.amount)}.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-black">Amount</span>
          <input
            className="rounded border border-black/20 bg-input-grey px-3 py-2.5 outline-none focus:border-prime-blue"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
          />
        </label>

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
