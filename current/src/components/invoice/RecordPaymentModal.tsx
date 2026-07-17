"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import { CloseIcon } from "./ui";

const PAYMENT_METHODS = ["Cash", "Cheque", "E-Transfer", "Other"] as const;

export function RecordPaymentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(previewMeta.amount));
  const [method, setMethod] =
    useState<(typeof PAYMENT_METHODS)[number]>("Cash");
  const [chequeRef, setChequeRef] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <h2
          id="record-payment-title"
          className="pr-8 type-modal-title text-black"
        >
          Record payment
        </h2>
        <p className="mt-2 text-sm text-black/60">
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
                setMethod(
                  event.target.value as (typeof PAYMENT_METHODS)[number],
                )
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

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="ui-btn-primary"
          >
            Save payment
          </button>
        </div>
      </div>
    </div>
  );
}
