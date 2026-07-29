"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  customers,
  getActiveCustomers,
  type Customer,
} from "@/lib/invoice-demo-data";
import { CreateCustomerModal } from "./CreateCustomerModal";
import { ContactBlock, SectionCard } from "./ui";

const CREATE_CUSTOMER_HREF = "/customers/new";

function customerOptionLabel(customer: Customer) {
  return `${customer.name} (${customer.email})`;
}

function CustomerDropdown({
  onSelect,
  onCreateNew,
}: {
  onSelect: (customer: Customer) => void;
  onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setActiveCustomers(getActiveCustomers());
  }, [open]);

  useEffect(() => {
    window.setTimeout(() => {
      setActiveCustomers(getActiveCustomers());
    }, 0);
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeCustomers;
    return activeCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q),
    );
  }, [activeCustomers, query]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search customers…"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full rounded border border-black/20 bg-input-grey px-4 py-3 pr-10 text-left text-sm text-midnight-ink outline-none transition hover:border-prime-blue focus:border-prime-blue focus:bg-input-grey"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/45"
          aria-label={open ? "Close customer list" : "Open customer list"}
          onClick={() => {
            setOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
        >
          <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
            <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {open ? (
        <div
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="max-h-64 overflow-auto py-1">
            {filtered.length ? (
              filtered.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(customer);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex w-full flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                    role="option"
                    aria-selected="false"
                  >
                    <span className="text-sm font-semibold text-black">
                      {customerOptionLabel(customer)}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-black/50">
                No customers match “{query.trim()}”
              </li>
            )}
          </ul>
          <div className="border-t border-black/10">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
                onCreateNew();
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-prime-blue transition hover:bg-prime-blue/5"
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
              Create new customer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BillToSection({
  defaultCustomer,
  onCustomerChange,
  children,
}: {
  defaultCustomer?: Customer | null;
  onCustomerChange?: (customer: Customer | null) => void;
  children?: ReactNode;
}) {
  const [customer, setCustomer] = useState<Customer | null>(
    defaultCustomer ?? null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  function selectCustomer(next: Customer | null) {
    setCustomer(next);
    onCustomerChange?.(next);
  }

  return (
    <SectionCard title="Bill to" className="gap-2.5">
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
              href={`${CREATE_CUSTOMER_HREF}?id=${customer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-sm text-prime-blue underline underline-offset-2 transition hover:opacity-80"
            >
              Edit Customer Profile
            </Link>
          </div>
          <button
            type="button"
            onClick={() => selectCustomer(null)}
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
        <CustomerDropdown
          onSelect={selectCustomer}
          onCreateNew={() => setCreateOpen(true)}
        />
      )}

      {children}

      {createOpen ? (
        <CreateCustomerModal
          onClose={() => setCreateOpen(false)}
          onCreated={(next) => {
            setCreateOpen(false);
            selectCustomer(next);
          }}
        />
      ) : null}
    </SectionCard>
  );
}

export { CREATE_CUSTOMER_HREF };
export const defaultDraftCustomer = customers[0];
