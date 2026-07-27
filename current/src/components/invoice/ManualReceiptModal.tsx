"use client";

import { useEffect, useState } from "react";
import { draftInvoice, formatMoney, previewMeta } from "@/lib/invoice-demo-data";
import { MessagePreview } from "./SendMethodAccordion";
import { CloseIcon, Modal } from "./ui";

type Step = "receipt" | "send";

export function ManualReceiptModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent?: () => void;
}) {
  const [step, setStep] = useState<Step>("receipt");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const amountPaid = previewMeta.amount;
  const taxGst = draftInvoice.totals.taxGst;
  const email = draftInvoice.customer.email;
  const contactName = draftInvoice.customer.name;
  const companyName = draftInvoice.business.name;

  function handleDownload() {
    // Demo: browser print of the receipt surface.
    window.print();
  }

  function handleSend() {
    if (sending) return;
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      onSent?.();
      onClose();
    }, 400);
  }

  if (step === "send") {
    return (
      <Modal
        title="Send receipt"
        titleId="send-receipt-title"
        onClose={onClose}
        maxWidthClass="max-w-2xl"
        zClass="z-[80]"
        confirmLabel={sending ? "Sending…" : "Send via email"}
        onConfirm={handleSend}
        confirmDisabled={sending || !email}
        cancelLabel="Back"
        onCancel={() => setStep("receipt")}
      >
        <p className="text-sm text-black/60">
          Email a copy of this payment receipt to {email || "the customer"}.
        </p>
        <div className="mt-5">
          <p className="text-sm font-semibold text-black">Email preview</p>
          <div className="mt-3">
            <MessagePreview>
              Hello {contactName}, thank you for your payment of{" "}
              {formatMoney(amountPaid)} to {companyName}. Your receipt for
              invoice #{previewMeta.invoiceNumber} is attached. GST/HST collected
              on this payment: {formatMoney(taxGst)}.
            </MessagePreview>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-receipt-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="manual-receipt-title" className="type-modal-title text-white">
            Payment receipt
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => setStep("send")}
              className="rounded bg-white px-4 py-2 text-sm font-semibold text-midnight-ink transition hover:bg-white/90"
            >
              Send
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close receipt"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <article className="rounded-[10px] bg-white p-8 text-black shadow-xl">
          <header className="flex flex-col gap-1 border-b border-black/10 pb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-black/45">
              Receipt
            </p>
            <h3 className="type-headline-4 text-midnight-ink">{companyName}</h3>
            <p className="text-sm text-black/55">{draftInvoice.business.address}</p>
            <p className="text-sm text-black/55">{draftInvoice.business.email}</p>
          </header>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-black/40">
                Bill to
              </p>
              <p className="mt-1 font-medium">{contactName}</p>
              <p className="text-sm text-black/60">{draftInvoice.customer.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase text-black/40">
                Payment
              </p>
              <p className="mt-1 font-medium">
                  Invoice #{previewMeta.invoiceNumber}
              </p>
              <p className="text-sm text-black/60">Paid · Interac e-Transfer</p>
              <p className="text-sm text-black/60">Jul 22, 2026</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-black/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-page-grey/80 text-black/50">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {draftInvoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-t border-black/5">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-black/45">
                        {item.badges.map((badge) => badge.label).join(" · ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-5 ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-black/55">Subtotal</dt>
              <dd>{formatMoney(draftInvoice.totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-black/55">GST/HST collected</dt>
              <dd>{formatMoney(taxGst)}</dd>
            </div>
            <div className="flex justify-between gap-6 border-t border-black/10 pt-2 text-base font-semibold">
              <dt>Amount paid</dt>
              <dd>{formatMoney(amountPaid)}</dd>
            </div>
          </dl>

          <p className="mt-6 text-center text-xs text-black/40">
            Demo receipt — download uses print; send opens an email preview.
          </p>
        </article>
      </div>
    </div>
  );
}
