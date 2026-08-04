"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDashboardModel,
  overdueDaysLateLabel,
  type DashboardMetricCard,
  type OverduePreviewItem,
  type RecentInvoiceItem,
} from "@/lib/dashboard-stats";
import { draftInvoice } from "@/lib/invoice-demo-data";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  DateCell,
  DIRECTORY_BODY_ROW,
  DIRECTORY_CARD_CLASS,
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
      className={`inline-flex w-fit items-center rounded px-2 py-0.5 type-subtitle-2 ${className}`}
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
      className="inline-flex items-center gap-1.5 type-subtitle-1 text-prime-blue transition hover:underline"
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
      <p className="type-paragraph-2 text-black/50">
        No overdue invoices right now.
      </p>
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
            className={`${DIRECTORY_CARD_CLASS} w-[calc((100%-0.75rem)/1.5)] shrink-0 snap-start`}
          >
            <Link href={item.href} className="block min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="type-subtitle-2 text-midnight-ink">
                    #{item.number}
                  </p>
                  <p className="mt-1 truncate type-subtitle-1 text-midnight-ink">
                    {item.customer}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span className="inline-flex w-fit items-center rounded bg-[#F3F3F3] px-2 py-0.5 type-subtitle-2 text-[#666666]">
                    {item.lateness}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <dt className="type-caption">Issued</dt>
                  <dd className="mt-0.5 type-paragraph-2 text-black/75">
                    <DateCell value={item.dateIssued} />
                  </dd>
                </div>
                <div>
                  <dt className="type-caption">Due</dt>
                  <dd className="mt-0.5 type-paragraph-2 text-black/75">
                    <DateCell value={item.dueDate} />
                  </dd>
                </div>
                <div>
                  <dt className="type-caption">Total</dt>
                  <dd className="mt-0.5">
                    <MoneyCell
                      amount={item.amount}
                      variant="total"
                      align="left"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="type-caption">Outstanding</dt>
                  <dd className="mt-0.5">
                    <MoneyCell
                      amount={item.balanceOutstanding}
                      variant="outstanding"
                      align="left"
                    />
                  </dd>
                </div>
              </dl>
            </Link>
            {sent ? (
              <p className="type-subtitle-1 text-[#1B7A3A]">Reminder sent</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-btn-secondary h-9 px-3 type-subtitle-1"
                  onClick={() => handleRemind(item, "email")}
                >
                  Email Reminder
                </button>
                <button
                  type="button"
                  className="ui-btn-secondary h-9 px-3 type-subtitle-1"
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

function ExternalLinkIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M5.5 3.5H3.5A1.5 1.5 0 0 0 2 5v5.5A1.5 1.5 0 0 0 3.5 12H9a1.5 1.5 0 0 0 1.5-1.5V8.5M8 2h4v4M6.5 7.5 12 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCell({ card }: { card: DashboardMetricCard }) {
  const body = (
    <>
      <div className="flex items-center gap-1.5">
        <p className="type-subtitle-1 text-black/55">{card.label}</p>
        {card.tooltip ? <InfoTooltip text={card.tooltip} /> : null}
        {card.href ? (
          <ExternalLinkIcon className="shrink-0 text-prime-blue" />
        ) : null}
      </div>
      <p className={`mt-2 type-amount ${METRIC_VALUE_COLOR[card.tone]}`}>
        {card.value}
      </p>
      {card.hint ? (
        <p className="mt-1 type-paragraph-2 text-black/50">{card.hint}</p>
      ) : null}
      {card.insight ? (
        <div className="mt-3 rounded-[10px] border border-midnight-ink/20 bg-cloud-grey px-5 py-4">
          <p className="type-paragraph-2 leading-5 text-black">
            <span className="font-semibold">{card.insight.title}</span>{" "}
            {card.insight.text}
          </p>
        </div>
      ) : null}
    </>
  );

  if (card.href) {
    return (
      <Link
        href={card.href}
        className="block rounded-md p-4 transition hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prime-blue"
      >
        {body}
      </Link>
    );
  }

  return <div className="p-4">{body}</div>;
}

function MetricsPanel({ cards }: { cards: DashboardMetricCard[] }) {
  return (
    <section className="mt-5 rounded-[10px] border border-black/10 bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-3">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-black/10 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.id} className="bg-white">
            <MetricCell card={card} />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentInvoiceCards({ rows }: { rows: RecentInvoiceItem[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-6 pb-6 type-paragraph-2 text-black/50">
        No recent invoices.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 px-4 pb-5 sm:grid-cols-2 md:hidden">
      {rows.map((row) => (
        <li key={row.id}>
          <Link href={row.href} className={DIRECTORY_CARD_CLASS}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="type-subtitle-2 text-midnight-ink">
                  #{row.number}
                </p>
                <p className="mt-1 truncate type-subtitle-1 text-midnight-ink">
                  {row.customer}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {/^overdue/i.test(row.status) ? (
                  <span className="inline-flex w-fit items-center rounded bg-[#F3F3F3] px-2 py-0.5 type-subtitle-2 text-[#666666]">
                    {overdueDaysLateLabel(row.dueDate)}
                  </span>
                ) : null}
                <StatusBadge status={row.status} />
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <dt className="type-caption">Issued</dt>
                <dd className="mt-0.5 type-paragraph-2 text-black/75">
                  <DateCell value={row.dateIssued} />
                </dd>
              </div>
              <div>
                <dt className="type-caption">Due</dt>
                <dd className="mt-0.5 type-paragraph-2 text-black/75">
                  <DateCell value={row.dueDate} />
                </dd>
              </div>
              <div>
                <dt className="type-caption">Total</dt>
                <dd className="mt-0.5">
                  <MoneyCell amount={row.amount} variant="total" align="left" />
                </dd>
              </div>
              <div>
                <dt className="type-caption">Outstanding</dt>
                <dd className="mt-0.5">
                  <MoneyCell
                    amount={row.balanceOutstanding}
                    variant="outstanding"
                    align="left"
                  />
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
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
            <h1 className="type-page-title text-midnight-ink">Dashboard</h1>
            <p className="mt-2 type-paragraph-1 text-black/55">
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
              <p className="type-subtitle-1 text-black/55">Overdue</p>
              <p className="mt-2 type-amount text-[#C62828]">
                {model.overdue.amount}
              </p>
              <p className="mt-2 type-paragraph-1 text-midnight-ink/80">
                out of{" "}
                <span className="font-semibold text-midnight-ink">
                  {model.overdue.outstandingAmount}
                </span>{" "}
                outstanding
              </p>
              <p className="mt-1 type-paragraph-2 text-midnight-ink/70">
                {model.overdue.count} out of {model.overdue.outstandingCount}{" "}
                invoice
                {model.overdue.outstandingCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="hidden bg-black/10 lg:block" aria-hidden />

            <div className="min-w-0 border-t border-black/10 pt-5 lg:border-t-0 lg:pt-0">
              <div className="mb-3 flex justify-end">
                <Link
                  href={model.overdue.viewAllHref}
                  className="type-subtitle-1 text-prime-blue hover:underline"
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

        <MetricsPanel cards={model.metrics} />

        <section className="mt-5 rounded-[10px] border border-black/10 bg-white">
          <div className="flex items-baseline justify-between gap-3 px-6 pt-6">
            <h2 className="type-headline-5 text-midnight-ink">
              Recent Invoices
            </h2>
            <AllInvoicesLink />
          </div>
          <div className="mt-4 md:hidden">
            <RecentInvoiceCards rows={model.recentInvoices} />
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
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
                  <div key={label} className="min-w-0 type-subtitle-2 text-black/55">
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
                      <span className="min-w-0 overflow-hidden type-subtitle-1">
                        {row.number}
                      </span>
                      <span className="min-w-0 overflow-hidden">
                        <StatusBadge status={row.status} />
                      </span>
                      <span className="min-w-0 truncate type-paragraph-2 text-black/75">
                        {row.customer}
                      </span>
                      <span className="min-w-0 overflow-hidden type-paragraph-2 text-black/75">
                        <DateCell value={row.dateIssued} />
                      </span>
                      <span className="min-w-0 overflow-hidden type-paragraph-2 text-black/75">
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
          className="fixed bottom-8 left-1/2 z-[70] max-w-md -translate-x-1/2 rounded-lg bg-midnight-ink px-4 py-3 type-subtitle-1 text-white shadow-lg"
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
