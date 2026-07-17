import Image from "next/image";
import {
  draftInvoice,
  formatMoney,
  previewMeta,
} from "@/lib/invoice-demo-data";

function DashedDivider() {
  return <div className="h-px w-full border-t-2 border-dashed border-[#F4A21E]" />;
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-30">
      <path
        d="M3.5 2.5h2l1 3-1.5 1a8 8 0 0 0 4.5 4.5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A10.5 10.5 0 0 1 2 4A1.5 1.5 0 0 1 3.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-30">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="m2.5 4.5 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PartyBlock({
  label,
  name,
  address,
  phone,
  email,
}: {
  label: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2.5">
      <p className="text-sm text-black/40">{label}</p>
      <div>
        <p className="text-base font-bold text-black">{name}</p>
        <p className="text-sm text-black">{address}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 text-sm text-black">
          <PhoneIcon />
          <span>{phone}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-black">
          <MailIcon />
          <span>{email}</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceLineItem({
  name,
  description,
  unitPrice,
  qty,
  total,
  badges,
}: {
  name: string;
  description: string;
  unitPrice: number;
  qty: number;
  total: number;
  badges: { label: string }[];
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[10px] border border-black/10 px-[30px] py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-[30px]">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-black">{name}</p>
          <p className="mt-2.5 text-sm text-black">{description}</p>
        </div>
        <div className="grid grid-cols-3 gap-[30px] text-right">
          <div className="w-[65px]">
            <p className="text-sm text-black/40">Unit Price</p>
            <p className="mt-2.5 text-sm text-black">{formatMoney(unitPrice)}</p>
          </div>
          <div className="w-[65px]">
            <p className="text-sm text-black/40">Qty</p>
            <p className="mt-2.5 text-sm text-black">{qty}</p>
          </div>
          <div className="w-[65px]">
            <p className="text-sm text-black/40">Total</p>
            <p className="mt-2.5 text-sm text-black">{formatMoney(total)}</p>
          </div>
        </div>
      </div>
      {badges.length ? (
        <div className="flex flex-wrap gap-5">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="rounded bg-midnight-ink/10 px-1.5 text-sm font-semibold text-midnight-ink/80"
            >
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-10 items-center justify-end gap-5 px-[30px]">
      <span className="text-base text-black">{label}</span>
      <span className="w-40 text-right text-base font-semibold text-black">
        {value}
      </span>
    </div>
  );
}

export function CustomerInvoiceCard({
  shadow = "preview",
}: {
  shadow?: "preview" | "sent";
}) {
  const money = formatMoney(draftInvoice.totals.subtotal);
  const shadowClass =
    shadow === "sent"
      ? "shadow-[0px_4px_8px_0px_rgba(0,0,0,0.25)]"
      : "shadow-[0px_4px_15px_0px_rgba(0,0,0,0.25)]";

  return (
    <div
      className={`flex flex-col gap-5 border-y-8 border-[#F4A21E] bg-white px-6 py-[50px] sm:px-10 ${shadowClass}`}
    >
      <div className="flex flex-col items-start gap-5 px-4 sm:flex-row sm:items-center sm:gap-5 sm:px-[30px]">
        <div className="flex w-[295px] max-w-full flex-col gap-2.5">
          <Image
            src="/brand/company-style.png"
            alt="Company logo"
            width={160}
            height={100}
            className="h-[100px] w-[160px] rounded object-cover"
          />
          <p className="font-display text-3xl font-bold text-black">
            {previewMeta.invoiceNumber}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2.5 rounded-md border-2 border-[#F4A21E]/50 p-10 sm:w-[312px]">
          <p className="text-2xl font-bold text-black">
            {formatMoney(previewMeta.amount)}
          </p>
          <div>
            <p className="text-base font-bold text-black">{previewMeta.dueDate}</p>
            <p className="text-sm text-black">{previewMeta.issuedDate}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 sm:flex-row sm:px-[30px]">
        <PartyBlock label="From" {...draftInvoice.business} />
        <PartyBlock label="Billed To" {...draftInvoice.customer} />
      </div>

      <DashedDivider />

      <div className="flex flex-col gap-5">
        {draftInvoice.lineItems.map((item) => (
          <InvoiceLineItem key={item.id} {...item} />
        ))}
      </div>

      <div className="flex flex-col">
        <SummaryRow label="Subtotal" value={money} />
        <SummaryRow label="Item Discount" value={money} />
        <SummaryRow label="Tax (GST)" value={money} />
        <SummaryRow label="Tax (PST)" value={money} />
      </div>

      <DashedDivider />

      <div className="flex items-center justify-end gap-2.5 px-4 sm:px-[30px]">
        <div className="text-right">
          <p className="text-base font-bold text-black">Total</p>
          <p className="text-sm text-black/40">(Tax exclusive)</p>
        </div>
        <p className="w-[180px] text-right text-2xl font-bold text-black">
          {formatMoney(previewMeta.amount)}
        </p>
      </div>

      <DashedDivider />

      <div className="flex flex-col gap-5 px-4 sm:px-[30px]">
        <p className="text-base font-bold text-black">Payment Options</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm text-black">Pay by e-transfer</span>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-[#0063d1]"
          >
            E-Transfer
          </button>
        </div>
      </div>

      {draftInvoice.customerNotes.map((note) => (
        <div key={note.id} className="flex flex-col gap-5 px-4 sm:px-[30px]">
          <div>
            <p className="text-base font-bold text-black">{note.title}</p>
            <p className="mt-2.5 text-sm leading-5 text-black">{note.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
