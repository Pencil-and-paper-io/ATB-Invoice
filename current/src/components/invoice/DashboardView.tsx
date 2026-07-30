"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildDashboardModel } from "@/lib/dashboard-stats";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  DateCell,
  DIRECTORY_BODY_ROW,
  DIRECTORY_HEADER_ROW,
  MoneyCell,
} from "./directory-table";
import { SendReminderModal } from "./SendReminderModal";
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

const STAT_AMOUNT_COLOR: Record<string, string> = {
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

export function DashboardView() {
  const model = useMemo(() => buildDashboardModel(), []);
  const [reminderTarget, setReminderTarget] = useState<{
    id: string;
    number: string;
    customer: string;
  } | null>(null);
  const [reminderSentFor, setReminderSentFor] = useState<string | null>(null);

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

        <section className="grid gap-4 sm:grid-cols-3">
          {model.stats.map((stat) => (
            <Link
              key={stat.id}
              href={stat.href}
              className="rounded-[10px] border border-black/10 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition hover:border-prime-blue hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:ring-1 hover:ring-prime-blue"
            >
              <p className="text-sm font-medium text-black/55">{stat.label}</p>
              <p
                className={`mt-2 type-headline-4 ${STAT_AMOUNT_COLOR[stat.tone]}`}
              >
                {stat.amount}
              </p>
              <p className="mt-1 text-sm text-black/50">{stat.countLabel}</p>
            </Link>
          ))}
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="rounded-[10px] border border-black/10 bg-white p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="type-headline-5 text-midnight-ink">
                Needs Attention
              </h2>
              <Link
                href="/invoices"
                className="text-sm font-semibold text-prime-blue hover:underline"
              >
                View All
              </Link>
            </div>
            <p className="mt-1 text-sm text-black/50">
              Overdue and unpaid invoices that may need a reminder.
            </p>

            {model.needsAttention.length === 0 ? (
              <p className="mt-8 text-sm text-black/50">
                Nothing needs attention right now.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-black/10">
                {model.needsAttention.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
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
                        {item.customer} · {item.amount} · {item.lateness}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ui-btn-secondary shrink-0"
                      onClick={() =>
                        setReminderTarget({
                          id: item.id,
                          number: item.number,
                          customer: item.customer,
                        })
                      }
                    >
                      {reminderSentFor === item.id
                        ? "Reminder sent"
                        : "Send reminder"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[10px] border border-black/10 bg-white p-6">
            <h2 className="type-headline-5 text-midnight-ink">
              How You&apos;re Doing
            </h2>
            <p className="mt-1 text-sm text-black/50">
              High-level collection health for your account.
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {model.howYoureDoing.map((stat) => (
                <li
                  key={stat.id}
                  className="rounded-lg border border-black/10 bg-page-grey/60 px-4 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-black/55">{stat.label}</p>
                    <InfoTooltip text={stat.tooltip} />
                  </div>
                  <p className="mt-1 text-2xl font-semibold text-midnight-ink">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-black/45">{stat.hint}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

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

      {reminderTarget ? (
        <SendReminderModal
          invoiceNumber={`#${reminderTarget.number}`}
          customerName={reminderTarget.customer}
          onClose={() => setReminderTarget(null)}
          onSent={() => {
            setReminderSentFor(reminderTarget.id);
            setReminderTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
