"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { customers, type Customer } from "@/lib/invoice-demo-data";
import { TopNav } from "@/components/invoice/TopNav";
import { UI_CLASS } from "@/lib/design-tokens";

type SortKey = "name" | "email" | "phone" | "tags";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-left transition hover:text-black/70"
    >
      {label}
      <svg width="8" height="10" viewBox="0 0 8 10" fill="none" aria-hidden>
        <path
          d="M4 1 7 4H1L4 1Z"
          fill="currentColor"
          opacity={active && dir === "asc" ? 0.85 : 0.35}
        />
        <path
          d="M4 9 1 6h6L4 9Z"
          fill="currentColor"
          opacity={active && dir === "desc" ? 0.85 : 0.35}
        />
      </svg>
    </button>
  );
}

function sortValue(customer: Customer, key: SortKey) {
  if (key === "tags") return customer.tags.join(", ").toLowerCase();
  return customer[key].toLowerCase();
}

export default function CustomersDirectoryPage() {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedCustomers = useMemo(() => {
    const next = [...customers];
    next.sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      if (left < right) return sortDir === "asc" ? -1 : 1;
      if (left > right) return sortDir === "asc" ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return next;
  }, [sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">Customers</h1>
            <p className="mt-2 type-body-muted">
              Customer directory for invoicing and quoting.
            </p>
          </div>
          <Link
            href="/customers/new"
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center justify-center px-5`}
          >
            + Create New Customer
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <div className="grid grid-cols-[1.3fr_1.2fr_0.9fr_1.1fr] gap-3 border-b border-black/10 bg-black/[0.02] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black/45">
            <SortHeader
              label="Legal name"
              active={sortKey === "name"}
              dir={sortDir}
              onClick={() => toggleSort("name")}
            />
            <SortHeader
              label="Email"
              active={sortKey === "email"}
              dir={sortDir}
              onClick={() => toggleSort("email")}
            />
            <SortHeader
              label="Phone"
              active={sortKey === "phone"}
              dir={sortDir}
              onClick={() => toggleSort("phone")}
            />
            <SortHeader
              label="Tags"
              active={sortKey === "tags"}
              dir={sortDir}
              onClick={() => toggleSort("tags")}
            />
          </div>
          <ul>
            {sortedCustomers.map((customer, index) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/new?id=${customer.id}`}
                  className={`grid grid-cols-[1.3fr_1.2fr_0.9fr_1.1fr] gap-3 px-5 py-3.5 text-sm transition hover:bg-prime-blue/5 ${
                    index < sortedCustomers.length - 1
                      ? "border-b border-black/10"
                      : ""
                  }`}
                >
                  <span className="font-semibold text-black">
                    {customer.name}
                  </span>
                  <span className="truncate text-black/70">{customer.email}</span>
                  <span className="text-black/70">{customer.phone}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {customer.tags.length ? (
                      customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-prime-blue/10 px-2 py-0.5 text-xs font-semibold text-prime-blue"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-black/40">N/A</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
