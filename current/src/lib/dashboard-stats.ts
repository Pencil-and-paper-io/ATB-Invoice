import {
  customers,
  customerInvoices,
  formatMoney,
  hrefForCustomerInvoice,
  type CustomerInvoiceRow,
} from "@/lib/invoice-demo-data";
import { DIRECTORY_REFERENCE_NOW, parseDemoDate } from "@/lib/directory-date-range";

function isSameMonth(date: Date, ref: Date) {
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}

function customerName(customerId: string) {
  return customers.find((entry) => entry.id === customerId)?.name ?? "—";
}

function isClosedStatus(status: string) {
  return /^(paid|void|uncollectible|draft)$/i.test(status.trim());
}

function isOverdueStatus(status: string) {
  return /^overdue/i.test(status.trim());
}

function daysPastDue(row: CustomerInvoiceRow, now: Date) {
  const due = parseDemoDate(row.dueDate);
  if (!due) return 0;
  const ms = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/** Demo GST estimate when per-invoice tax isn’t stored on directory rows. */
const DEMO_GST_RATE = 0.05;

export type DashboardStatCard = {
  id: string;
  label: string;
  amount: string;
  countLabel: string;
  tone: "neutral" | "warning" | "success";
  href: string;
};

export type NeedsAttentionItem = {
  id: string;
  number: string;
  customer: string;
  amount: string;
  status: string;
  lateness: string;
  href: string;
};

export type RecentInvoiceItem = {
  id: string;
  number: string;
  customer: string;
  amount: string;
  status: string;
  dueDate: string;
  href: string;
};

export type HowYoureDoingStat = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tooltip: string;
};

export type DashboardModel = {
  stats: DashboardStatCard[];
  needsAttention: NeedsAttentionItem[];
  howYoureDoing: HowYoureDoingStat[];
  recentInvoices: RecentInvoiceItem[];
};

export function buildDashboardModel(
  now: Date = DIRECTORY_REFERENCE_NOW,
): DashboardModel {
  const open = customerInvoices.filter((row) => !isClosedStatus(row.status));
  const outstandingRows = open.filter((row) => row.balanceOutstanding > 0);
  const overdueRows = outstandingRows.filter((row) => isOverdueStatus(row.status));

  const outstandingAmount = outstandingRows.reduce(
    (sum, row) => sum + row.balanceOutstanding,
    0,
  );
  const overdueAmount = overdueRows.reduce(
    (sum, row) => sum + row.balanceOutstanding,
    0,
  );

  const paidThisMonth = customerInvoices.filter((row) => {
    if (row.status !== "Paid") return false;
    const issued = parseDemoDate(row.dateIssued);
    return issued ? isSameMonth(issued, now) : false;
  });
  const paidThisMonthAmount = paidThisMonth.reduce((sum, row) => sum + row.amount, 0);

  const partialThisMonth = customerInvoices.filter((row) => {
    if (row.status !== "Partially Paid") return false;
    const issued = parseDemoDate(row.dateIssued);
    return issued ? isSameMonth(issued, now) : false;
  });
  const partialCollected = partialThisMonth.reduce(
    (sum, row) => sum + Math.max(0, row.amount - row.balanceOutstanding),
    0,
  );
  const collectedThisMonth = paidThisMonthAmount + partialCollected;
  const collectedCount = paidThisMonth.length + partialThisMonth.length;

  const totalInvoiced = customerInvoices
    .filter((row) => !/^draft$/i.test(row.status))
    .reduce((sum, row) => sum + row.amount, 0);
  const totalCollected = customerInvoices.reduce(
    (sum, row) => sum + Math.max(0, row.amount - row.balanceOutstanding),
    0,
  );
  const collectionRate =
    totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const gstCollected = totalCollected * DEMO_GST_RATE;
  const overdueRate =
    outstandingAmount > 0
      ? Math.round((overdueAmount / outstandingAmount) * 100)
      : 0;

  const paidForTiming = customerInvoices.filter((row) => row.status === "Paid");
  const avgDaysToPayment =
    paidForTiming.length === 0
      ? null
      : Math.round(
          paidForTiming.reduce((sum, row) => {
            const issued = parseDemoDate(row.dateIssued);
            const paidOn = parseDemoDate(row.dueDate);
            if (!issued || !paidOn) return sum;
            return sum + daysBetween(issued, paidOn);
          }, 0) / paidForTiming.length,
        );

  const needsAttention: NeedsAttentionItem[] = [...outstandingRows]
    .filter(
      (row) =>
        isOverdueStatus(row.status) ||
        row.status === "Partially Paid" ||
        row.status === "Viewed" ||
        row.status === "Sent",
    )
    .sort((a, b) => daysPastDue(b, now) - daysPastDue(a, now))
    .slice(0, 5)
    .map((row) => {
      const late = daysPastDue(row, now);
      return {
        id: row.id,
        number: row.number,
        customer: customerName(row.customerId),
        amount: formatMoney(row.balanceOutstanding),
        status: row.status,
        lateness:
          late > 0
            ? `${late} day${late === 1 ? "" : "s"} late`
            : row.status === "Partially Paid"
              ? "Balance remaining"
              : "Awaiting payment",
        href: hrefForCustomerInvoice(row.status),
      };
    });

  const recentInvoices: RecentInvoiceItem[] = [...customerInvoices]
    .sort((a, b) => {
      const left = parseDemoDate(a.dateIssued)?.getTime() ?? 0;
      const right = parseDemoDate(b.dateIssued)?.getTime() ?? 0;
      return right - left;
    })
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      number: row.number,
      customer: customerName(row.customerId),
      amount: formatMoney(row.amount),
      status: row.status,
      dueDate: row.dueDate,
      href: hrefForCustomerInvoice(row.status),
    }));

  return {
    stats: [
      {
        id: "outstanding",
        label: "Outstanding",
        amount: formatMoney(outstandingAmount),
        countLabel: `${outstandingRows.length} invoice${outstandingRows.length === 1 ? "" : "s"}`,
        tone: "neutral",
        href: "/invoices?status=Outstanding",
      },
      {
        id: "overdue",
        label: "Overdue",
        amount: formatMoney(overdueAmount),
        countLabel: `${overdueRows.length} invoice${overdueRows.length === 1 ? "" : "s"}`,
        tone: "warning",
        href: "/invoices?status=Overdue",
      },
      {
        id: "paid-month",
        label: "Paid this month",
        amount: formatMoney(collectedThisMonth),
        countLabel: `${collectedCount} payment${collectedCount === 1 ? "" : "s"}`,
        tone: "success",
        href: "/invoices?status=Paid",
      },
    ],
    needsAttention,
    howYoureDoing: [
      {
        id: "collection-rate",
        label: "Collection rate",
        value: `${collectionRate}%`,
        hint: "Collected vs invoiced",
        tooltip:
          "Amount collected (paid portions of invoices) divided by total invoiced, excluding drafts. Higher means more of what you billed has been collected.",
      },
      {
        id: "gst-hst",
        label: "GST/HST collected",
        value: formatMoney(gstCollected),
        hint: "On amounts collected",
        tooltip:
          "Estimated GST/HST included in payments you’ve collected. In this prototype it’s 5% of collected amounts; production would sum tax lines from paid and partially paid invoices.",
      },
      {
        id: "overdue-rate",
        label: "Overdue rate",
        value: `${overdueRate}%`,
        hint: "Of outstanding balance",
        tooltip:
          "Overdue outstanding balance divided by total outstanding balance. Counts only open invoices with a remaining balance (excludes paid, void, uncollectible, and drafts).",
      },
      {
        id: "avg-days",
        label: "Average days to payment",
        value: avgDaysToPayment == null ? "—" : `${avgDaysToPayment}`,
        hint: avgDaysToPayment == null ? "No paid invoices yet" : "Days from issue to pay",
        tooltip:
          "Average number of days from invoice issue date to payment date for fully paid invoices. Demo uses each paid invoice’s due date as the payment date when a separate payment date isn’t stored.",
      },
      {
        id: "open-balance",
        label: "Open balance",
        value: formatMoney(outstandingAmount),
        hint: `${outstandingRows.length} open invoice${outstandingRows.length === 1 ? "" : "s"}`,
        tooltip:
          "Sum of remaining balances on open invoices (sent, viewed, partially paid, and overdue). Drafts, paid, void, and uncollectible invoices are excluded.",
      },
    ],
    recentInvoices,
  };
}
