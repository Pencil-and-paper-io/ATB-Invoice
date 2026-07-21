"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CUSTOMER_TAG_OPTIONS } from "@/lib/canada";
import { customers, type Customer } from "@/lib/invoice-demo-data";
import { TopNav } from "@/components/invoice/TopNav";
import { useDismissOnOutsideClick } from "@/components/invoice/useDismissOnOutsideClick";
import { UI_CLASS } from "@/lib/design-tokens";

type SortKey = "name" | "email" | "phone";
type SortDir = "asc" | "desc";

const ALL_TAGS = Array.from(
  new Set([
    ...CUSTOMER_TAG_OPTIONS,
    ...customers.flatMap((customer) => customer.tags),
  ]),
);

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
  return customer[key].toLowerCase();
}

export default function CustomersDirectoryPage() {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => [...ALL_TAGS]);
  const tagFilterRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(
    tagFilterRef,
    () => setTagFilterOpen(false),
    tagFilterOpen,
  );

  const filteredSortedCustomers = useMemo(() => {
    const selected = new Set(selectedTags);
    const filtered = customers.filter((customer) => {
      if (selected.size === 0) return false;
      if (selected.size === ALL_TAGS.length) return true;
      return customer.tags.some((tag) => selected.has(tag));
    });

    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      if (left < right) return sortDir === "asc" ? -1 : 1;
      if (left > right) return sortDir === "asc" ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [sortKey, sortDir, selectedTags]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag],
    );
  }

  const filterActive = selectedTags.length !== ALL_TAGS.length;

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
            <div ref={tagFilterRef} className="relative">
              <button
                type="button"
                onClick={() => setTagFilterOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1 text-left transition hover:text-black/70 ${
                  filterActive ? "text-prime-blue" : ""
                }`}
                aria-haspopup="listbox"
                aria-expanded={tagFilterOpen}
              >
                Tags
                <svg
                  width="11"
                  height="6"
                  viewBox="0 0 11 6"
                  fill="none"
                  aria-hidden
                  className={`transition ${tagFilterOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M1 1l4.5 4L10 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {tagFilterOpen ? (
                <div
                  className="absolute left-0 top-full z-30 mt-2 w-52 rounded-lg border border-black/10 bg-white py-2 shadow-lg"
                  role="listbox"
                  aria-label="Filter by tags"
                >
                  <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-black/40">
                    Show tags
                  </p>
                  <ul className="max-h-64 overflow-auto">
                    {ALL_TAGS.map((tag) => {
                      const checked = selectedTags.includes(tag);
                      return (
                        <li key={tag}>
                          <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm font-semibold text-midnight-ink transition hover:bg-prime-blue/10">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTag(tag)}
                              className="h-4 w-4 rounded border-black/25 accent-prime-blue"
                            />
                            {tag}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
          <ul>
            {filteredSortedCustomers.length ? (
              filteredSortedCustomers.map((customer, index) => (
                <li key={customer.id}>
                  <Link
                    href={`/customers/new?id=${customer.id}`}
                    className={`grid grid-cols-[1.3fr_1.2fr_0.9fr_1.1fr] gap-3 px-5 py-3.5 text-sm transition hover:bg-prime-blue/5 ${
                      index < filteredSortedCustomers.length - 1
                        ? "border-b border-black/10"
                        : ""
                    }`}
                  >
                    <span className="font-semibold text-black">
                      {customer.name}
                    </span>
                    <span className="truncate text-black/70">
                      {customer.email}
                    </span>
                    <span className="text-black/70">{customer.phone}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {customer.tags.length ? (
                        customer.tags
                          .filter(
                            (tag) =>
                              selectedTags.length === ALL_TAGS.length ||
                              selectedTags.includes(tag),
                          )
                          .map((tag) => (
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
              ))
            ) : (
              <li className="px-5 py-10 text-center text-sm text-black/45">
                No customers match the selected tags.
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
