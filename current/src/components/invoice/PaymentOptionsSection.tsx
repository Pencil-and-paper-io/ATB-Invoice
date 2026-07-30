"use client";

import { useState } from "react";
import type { InvoicePaymentOption } from "@/lib/organization-settings";
import { AddPaymentOptionsModal } from "./AddPaymentOptionsModal";
import { PencilIcon, SectionCard } from "./ui";

function DefaultCheckIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path
        d="M1 5.2 4.8 8.8 13 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaymentOptionsSection({
  payments,
  onChange,
  embedded = false,
}: {
  payments: InvoicePaymentOption[];
  onToggle?: (id: InvoicePaymentOption["id"]) => void;
  onChange?: (next: InvoicePaymentOption[]) => void;
  compact?: boolean;
  embedded?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const accepted = payments.filter((option) => option.checked);

  const body = (
    <>
      <div className="flex flex-col">
        {accepted.length === 0 ? (
          <p className="type-body-muted py-1">No payment options selected.</p>
        ) : (
          accepted.map((option) => (
            <div key={option.id} className="flex items-start gap-2 py-2.5">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-prime-blue"
                aria-hidden
              >
                <DefaultCheckIcon />
              </span>
              <p className="min-w-0 flex-1 type-subtitle-1 text-black">
                {option.label}
              </p>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="mt-1 inline-flex items-center gap-2.5 self-start type-button text-midnight-ink transition hover:text-prime-blue"
        >
          <PencilIcon className="h-4 w-4" />
          Edit payment options
        </button>
      </div>

      {editOpen ? (
        <AddPaymentOptionsModal
          currentPayments={payments}
          onClose={() => setEditOpen(false)}
          onSaved={(next) => {
            setEditOpen(false);
            onChange?.(next);
          }}
        />
      ) : null}
    </>
  );

  if (embedded) return body;

  return (
    <SectionCard title="Payment Options" className="gap-2.5">
      {body}
    </SectionCard>
  );
}
