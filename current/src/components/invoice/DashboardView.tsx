"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDashboardModel,
  type DashboardMetricCard,
  type OverduePreviewItem,
} from "@/lib/dashboard-stats";
import { draftInvoice } from "@/lib/invoice-demo-data";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  DateCell,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW,
  MoneyCell,
} from "./directory-table";
import { CreatePlusIcon, InfoTooltip } from "./ui";
import { TopNav } from "./TopNav";

const STATUS_BADGE: Record<string, string> = {
  Draft: "bg-[#F3F3F3] text-[#666666]",
  Sent: "bg-[#3C6CFF]/10 text-[#3C6CFF]",
  Viewed: "bg-[#3C6CFF]/10 text-[#3C6CFF]",
  "Partially Paid": "bg-[#FFF8E6] text-[#8A6A00]",
  Paid: "bg-[#E8F7EC] text-[#1B7A3A]",
  Overdue: "bg-[#FDECEC] text-[#C62828]",
  "Overdue 90+": "bg-[#FDECEC] text-[#C62828]",
  Uncollectible: "bg-[#F3F3F3] text-[#666666]",
};

function StatusBadge({ status }: { status: string }) {
  const className = STATUS_BADGE[status] ?? "bg-[#F3F3F3] text-[#666666]";
  return (
    <span
      className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}

const METRIC_VALUE_COLOR: Record<DashboardMetricCard["tone"], string> = {
  neutral: "text-midnight-ink",
  warning: "text-[#C62828]",
  success: "text-[#1B7A3A]",
};

const RECENT_GRID =
  "minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 1.1fr)";

function AllInvoicesLink() {
  return (
    <Link
      href="/invoices"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-prime-blue transition hover:underline"
    >
      All Invoices
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M2.5 7h8M7.5 3.5 11 7l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function OverdueInvoiceCarousel({
  items,
  onReminded,
}: {
  items: OverduePreviewItem[];
  onReminded: (item: OverduePreviewItem, method: "email" | "text") => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());

  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.children[index] as HTMLElement | undefined;
    if (!card) return;
    scroller.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  }

  function handleRemind(item: OverduePreviewItem, method: "email" | "text") {
    if (sentIds.has(item.id)) return;
    setSentIds((prev) => new Set(prev).add(item.id));
    onReminded(item, method);
    const current = items.findIndex((entry) => entry.id === item.id);
    const next = current >= 0 ? current + 1 : activeIndex + 1;
    if (next < items.length) {
      window.setTimeout(() => scrollToIndex(next), 180);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-black/50">No overdue invoices right now.</p>
    );
  }

  return (
    <div
      ref={scrollerRef}
      className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Overdue invoices"
    >
      {items.map((item) => {
        const sent = sentIds.has(item.id);
        return (
          <article
            key={item.id}
            className="w-[calc((100%-0.75rem)/1.5)] shrink-0 snap-start rounded-[10px] border border-black/10 bg-page-grey/70 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={item.href}
                className="font-semibold text-midnight-ink hover:underline"
              >
                #{item.number}
              </Link>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-1 truncate text-sm text-black/60">
              {item.customer}
            </p>
            <p className="mt-2 text-sm font-semibold text-midnight-ink">
              {item.amount}
              <span className="ml-2 font-normal text-black/50">
                {item.lateness}
              </span>
            </p>
            {sent ? (
              <p className="mt-4 text-sm font-semibold text-[#1B7A3A]">
                Reminder sent
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-btn-secondary h-9 px-3 text-sm"
                  onClick={() => handleRemind(item, "email")}
                >
                  Email Reminder
                </button>
                <button
                  type="button"
                  className="ui-btn-secondary h-9 px-3 text-sm"
                  onClick={() => handleRemind(item, "text")}
                >
                  Text Reminder
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function MetricCard({ card }: { card: DashboardMetricCard }) {
  const content = (
    <>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-black/55">{card.label}</p>
        {card.tooltip ? <InfoTooltip text={card.tooltip} /> : null}
      </div>
      <p className={`mt-2 type-headline-4 ${METRIC_VALUE_COLOR[card.tone]}`}>
        {card.value}
      </p>
      <p className="mt-1 text-sm text-black/50">{card.hint}</p>
    </>
  );

  const className =
    "rounded-[10px] border border-black/10 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]";

  if (card.href) {
    return (
      <Link
        href={card.href}
        className={`${className} transition hover:border-prime-blue hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:ring-1 hover:ring-prime-blue`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function DashboardView() {
  const model = useMemo(() => buildDashboardModel(), []);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function handleOverdueRemind(
    item: OverduePreviewItem,
    method: "email" | "text",
  ) {
    setToast(
      method === "email"
        ? `Reminder emailed to ${draftInvoice.customer.email} for #${item.number}.`
        : `Reminder texted to ${draftInvoice.customer.phone} for #${item.number}.`,
    );
  }

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="type-headline-2 text-midnight-ink">Dashboard</h1>
            <p className="mt-2 type-subtitle-1 text-black/55">
              A snapshot of what you are owed and what needs follow-up.
            </p>
          </div>
          <Link
            href="/?fresh=1"
            className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5`}
          >
            <CreatePlusIcon />
            Create Invoice
          </Link>
        </div>

        <section className="rounded-[10px] border border-black/10 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_1px_minmax(0,1.4fr)] lg:items-stretch">
            <div className="flex flex-col justify-center pr-1">
              <p className="text-sm font-medium text-black/55">Overdue</p>
              <p className="mt-2 type-headline-3 text-[#C62828]">
                {model.overdue.amount}
              </p>
              <p className="mt-2 text-sm text-black/50">
                out of {model.overdue.outstandingAmount} outstanding
              </p>
              <p className="mt-1 text-xs text-black/40">
                {model.overdue.count} invoice
                {model.overdue.count === 1 ? "" : "s"}
              </p>
            </div>

            <div className="hidden bg-black/10 lg:block" aria-hidden />

            <div className="min-w-0 border-t border-black/10 pt-5 lg:border-t-0 lg:pt-0">
              <div className="mb-3 flex justify-end">
                <Link
                  href={model.overdue.viewAllHref}
                  className="text-sm font-semibold text-prime-blue hover:underline"
                >
                  View All
                </Link>
              </div>
              <OverdueInvoiceCarousel
                items={model.overdue.items}
                onReminded={handleOverdueRemind}
              />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {model.metrics.map((card) => (
            <MetricCard key={card.id} card={card} />
          ))}
        </section>

        <section className="mt-5 rounded-[10px] border border-black/10 bg-white">
          <div className="flex items-baseline justify-between gap-3 px-6 pt-6">
            <h2 className="type-headline-5 text-midnight-ink">
              Recent Invoices
            </h2>
            <AllInvoicesLink />
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[920px]">
              <div
                className={DIRECTORY_HEADER_ROW}
                style={{
                  display: "grid",
                  gridTemplateColumns: RECENT_GRID,
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                {(
                  [
                    "Invoice #",
                    "Status",
                    "Customer Name",
                    "Issued",
                    "Due",
                    "Total",
                    "Paid",
                    "Outstanding",
                  ] as const
                ).map((label) => (
                  <div
                    key={label}
                    className="min-w-0 text-xs font-semibold text-black/55"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <ul>
                {model.recentInvoices.map((row, index) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className={`${DIRECTORY_BODY_ROW} block ${
                        index < model.recentInvoices.length - 1
                          ? "border-b border-black/10"
                          : ""
                      }`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: RECENT_GRID,
                        gap: "1rem",
                        alignItems: "center",
                      }}
                    >
                      <span className="min-w-0 overflow-hidden font-medium">
                        {row.number}
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <StatusBadge status={row.status} />
                      </span>
                      <span className="min-w-0 truncate text-black/75">
                        {row.customer}
                      </span>
                      <span className="min-w-0 overflow-hidden text-black/75">
                        <DateCell value={row.dateIssued} />
                      </span>
                      <span className="min-w-0 overflow-hidden text-black/75">
                        <DateCell value={row.dueDate} />
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <MoneyCell amount={row.amount} variant="total" />
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <MoneyCell amount={row.paid} variant="paid" />
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <MoneyCell
                          amount={row.balanceOutstanding}
                          variant="outstanding"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {toast ? (
        <div
          className="fixed bottom-8 left-1/2 z-[70] max-w-md -translate-x-1/2 rounded-lg bg-midnight-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
        >
          {toast}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
