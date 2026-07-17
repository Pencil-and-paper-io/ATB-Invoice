"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { customers, type Customer } from "@/lib/invoice-demo-data";
import { ContactBlock, SectionCard, TextLink } from "./ui";

const CREATE_CUSTOMER_HREF = "/customers/new";

function CustomerDropdown({
  onSelect,
}: {
  onSelect: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded border border-black/20 bg-input-grey px-4 py-3 text-left text-sm text-midnight-ink transition hover:border-prime-blue focus:border-prime-blue focus:bg-input-grey"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-black/50">Select customer...</span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
          <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="max-h-64 overflow-auto py-1">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(customer);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                  role="option"
                  aria-selected="false"
                >
                  <span className="text-sm font-semibold text-black">
                    {customer.name}
                  </span>
                  <span className="text-xs text-black/50">{customer.email}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-black/10">
            <Link
              href={CREATE_CUSTOMER_HREF}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-prime-blue transition hover:bg-prime-blue/5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M12 8v8M8 12h8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              Create new
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BillToSection({
  defaultCustomer,
}: {
  defaultCustomer?: Customer | null;
}) {
  const [customer, setCustomer] = useState<Customer | null>(
    defaultCustomer ?? null,
  );

  return (
    <SectionCard title="Bill to">
      {customer ? (
        <div className="relative rounded-[10px] border border-black/10 p-[30px] transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue">
          <ContactBlock
            name={customer.name}
            address={customer.address}
            phone={customer.phone}
            email={customer.email}
          />
          <div className="mt-2.5">
            <Link
              href={CREATE_CUSTOMER_HREF}
              className="w-fit text-sm text-prime-blue underline underline-offset-2 transition hover:opacity-80"
            >
              Edit Customer Details
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setCustomer(null)}
            className="absolute right-2.5 top-2.5 text-black/50 transition hover:text-black"
            aria-label="Remove customer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M7 7l10 10M17 7 7 17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <CustomerDropdown onSelect={setCustomer} />
      )}
    </SectionCard>
  );
}

export { CREATE_CUSTOMER_HREF };
export const defaultDraftCustomer = customers[0];
export { TextLink };
