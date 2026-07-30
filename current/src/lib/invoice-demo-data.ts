import { loadCustomCustomers } from "@/lib/custom-customers";

export type DiscountType = "percent" | "fixed";

export type LineItem = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  qty: number;
  discount: number;
  discountType?: DiscountType;
  total: number;
  saveForFuture?: boolean;
  badges: { label: string }[];
};

export type Customer = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tags: string[];
  /** Demo / directory date filter (“Created”). */
  dateCreated?: string;
};

export const customers: Customer[] = [
  {
    id: "acme",
    name: "Acme Construction Co",
    address: "115-31st Ave SE Calgary, AB T3Z 1R0",
    phone: "1-403-257-0099",
    email: "accounting@acme.co",
    tags: ["VIP", "Contractor"],
    dateCreated: "Jul 2, 2026",
  },
  {
    id: "beta",
    name: "Beta Builders Ltd",
    address: "88 Riverfront Ave SW Calgary, AB T2P 0N9",
    phone: "1-403-555-0142",
    email: "billing@betabuilders.ca",
    tags: ["Retail"],
    dateCreated: "Jul 8, 2026",
  },
  {
    id: "cedar",
    name: "Cedar Contracting",
    address: "204-12th St NW Calgary, AB T2N 1M5",
    phone: "1-403-555-0177",
    email: "invoices@cedarcontracting.ca",
    tags: ["Wholesale", "Net-30"],
    dateCreated: "Jul 12, 2026",
  },
  {
    id: "delta",
    name: "Delta Design Studio",
    address: "610 8 Ave SW Calgary, AB T2P 1G5",
    phone: "1-403-555-0190",
    email: "accounts@deltadesign.ca",
    tags: ["VIP", "Retail"],
    dateCreated: "Jun 15, 2026",
  },
  {
    id: "evergreen",
    name: "Evergreen Landscaping Inc",
    address: "4501 17 Ave SE Calgary, AB T2A 0V1",
    phone: "1-587-555-0133",
    email: "payables@evergreenland.ca",
    tags: ["Contractor", "Net-30"],
    dateCreated: "Jul 18, 2026",
  },
  {
    id: "falcon",
    name: "Falcon HVAC Services",
    address: "2335 30 Ave NE Calgary, AB T2E 7C7",
    phone: "1-403-555-0168",
    email: "billing@falconhvac.ca",
    tags: ["Wholesale"],
    dateCreated: "Jul 5, 2026",
  },
  {
    id: "glacier",
    name: "Glacier Peak Consulting",
    address: "1000 7 Ave SW Calgary, AB T2P 5L5",
    phone: "1-825-555-0111",
    email: "finance@glacierpeak.ca",
    tags: ["VIP", "Net-30"],
    dateCreated: "Jul 20, 2026",
  },
];

export function makeBlankLineItem(id: string): LineItem {
  return {
    id,
    name: "",
    description: "",
    unitPrice: 0,
    qty: 1,
    discount: 0,
    total: 0,
    saveForFuture: false,
    badges: [],
  };
}

export type PaymentDetail = {
  label: string;
  text: string;
  italic?: boolean;
};

export type PaymentOption = {
  id: string;
  label: string;
  checked: boolean;
  details?: PaymentDetail[];
};

export type CustomerNote = {
  id: string;
  title: string;
  body: string;
  saveForFuture?: boolean;
};

export type SelfNote = {
  id: string;
  body: string;
};

export const draftInvoice = {
  title: "Draft Invoice",
  template: "Basic Template",
  customer: {
    name: "Acme Construction Co",
    address: "115-31st Ave SE Calgary, AB T3Z 1R0",
    phone: "1-403-257-0099",
    email: "accounting@acme.co",
  },
  business: {
    name: "Horlicks Company",
    address: "115-31st Ave SE Calgary, AB T3Z 1R0",
    phone: "1-403-257-0099",
    email: "invoicing@horlicks.com",
    color: "#FF7F30",
  },
  details: [
    { label: "Invoice Number", value: "3001", hasCaret: false },
    { label: "Issue Date", value: "Send right away", hasCaret: true },
    { label: "Due Date", value: "Net 30", hasCaret: true },
    { label: "Tax Setting", value: "Inclusive", hasCaret: true },
    { label: "Currency", value: "CAD", hasCaret: true },
  ],
  lineItems: [
    {
      id: "1",
      name: "Microwave 2000",
      description:
        "It is also an air conditioner,  instapot and rice cooker all-in-one`",
      unitPrice: 350.99,
      qty: 1,
      discount: 50.99,
      total: 300.0,
      badges: [{ label: "GST - 5%" }, { label: "30% Off" }],
    },
    {
      id: "2",
      name: "Refrigerator 55A",
      description: "Black matte with gold handles",
      unitPrice: 350.99,
      qty: 1,
      discount: 50.99,
      total: 300.0,
      badges: [{ label: "GST - 5%" }],
    },
  ] satisfies LineItem[],
  totals: {
    subtotal: 499.98,
    itemDiscount: 499.98,
    taxGst: 499.98,
    taxPst: 499.98,
    total: 3555.99,
  },
  paymentOptions: [] as PaymentOption[],
  // Payment options (cost copy, enabled methods) live in organization settings
  // and are loaded via getInvoicePaymentOptions() on draft invoices.
  customerNotes: [
    {
      id: "note-thanks",
      title: "Thank you!",
      body: "Thank you for purchasing these items from me, you are supporting a small, local business owner!!!",
    },
    {
      id: "note-terms",
      title: "Terms and Conditions",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis",
    },
    {
      id: "note-refund",
      title: "Refund Policy",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis",
    },
  ] satisfies CustomerNote[],
};

export const previewMeta = {
  invoiceNumber: "INV - 3001",
  amount: 3555.99,
  dueDate: "Due June 30, 2026",
  issuedDate: "Issued June 3, 2026",
  activity: [
    { id: "a4", time: "July 4, 3:33pm", text: "Invoice was viewed by the customer for the first time" },
    { id: "a3", time: "July 4, 9:01am", text: "You sent the invoice via email" },
    { id: "a2", time: "July 3, 7:22pm", text: "You updated the invoice" },
    { id: "a1", time: "July 3, 7:01pm", text: "Invoice was created" },
  ],
  noteToSelf: {
    title: "Remind this dude",
    body: "He’s really forgetful. Use discord and whatsapp.",
  },
};

export type SentViewVariant =
  | "sent"
  | "viewed"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "overdue_90"
  | "void"
  | "uncollectible";

export const sentVariantMeta: Record<
  SentViewVariant,
  {
    title: string;
    amountLabel: string;
    badge: { label: string; className: string };
    showRecordPayment: boolean;
    activity: { id: string; time: string; text: string; kind?: "sent_link"; linkRemainingSeconds?: number; linkRevoked?: boolean }[];
  }
> = {
  sent: {
    title: "Invoice Sent",
    amountLabel: "Amount Due",
    badge: {
      label: "Due",
      className: "border-[#CCCCCC] bg-[#3C6CFF]/10 text-[#3C6CFF]",
    },
    showRecordPayment: true,
    activity: [
      {
        id: "a-link-latest",
        time: "July 4, 4:12pm",
        text: "You sent the invoice by copying a shareable URL",
        kind: "sent_link",
        // Demo: ~11m 47s left when the page loads
        linkRemainingSeconds: 11 * 60 + 47,
      },
      {
        id: "a4",
        time: "July 4, 3:33pm",
        text: "Invoice was viewed by the customer for the first time",
      },
      {
        id: "a-link-first",
        time: "July 4, 10:20am",
        text: "You sent the invoice by copying a shareable URL",
        kind: "sent_link",
        linkRemainingSeconds: 0,
      },
      {
        id: "a3",
        time: "July 4, 9:01am",
        text: "You sent the invoice via email",
      },
      {
        id: "a2",
        time: "July 3, 7:22pm",
        text: "You updated the invoice",
      },
      {
        id: "a1",
        time: "July 3, 7:01pm",
        text: "Invoice was created",
      },
    ],
  },
  viewed: {
    title: "Invoice Viewed",
    amountLabel: "Amount Due",
    badge: {
      label: "Viewed",
      className: "border-[#CCCCCC] bg-[#3C6CFF]/10 text-[#3C6CFF]",
    },
    showRecordPayment: true,
    activity: previewMeta.activity,
  },
  paid: {
    title: "Invoice Paid",
    amountLabel: "Amount Paid",
    badge: {
      label: "Paid",
      className: "border-[#B7E0C0] bg-[#E8F7EC] text-[#1B7A3A]",
    },
    showRecordPayment: false,
    activity: [
      {
        id: "p1",
        time: "July 10, 2:14pm",
        text: "Payment of $3,555.99 was recorded",
      },
      {
        id: "p2",
        time: "July 4, 3:33pm",
        text: "Invoice was viewed by the customer for the first time",
      },
      {
        id: "p3",
        time: "July 4, 9:01am",
        text: "You sent the invoice via email",
      },
      {
        id: "p4",
        time: "July 3, 7:01pm",
        text: "Invoice was created",
      },
    ],
  },
  partially_paid: {
    title: "Invoice Partially Paid",
    amountLabel: "Balance Remaining",
    badge: {
      label: "Partially Paid",
      className: "border-[#F0D58C] bg-[#FFF8E6] text-[#8A6A00]",
    },
    showRecordPayment: true,
    activity: [
      {
        id: "pp1",
        time: "July 9, 11:20am",
        text: "Partial payment of $1,500.00 recorded — $2,055.99 remaining",
      },
      {
        id: "pp2",
        time: "July 4, 3:33pm",
        text: "Invoice was viewed by the customer for the first time",
      },
      {
        id: "pp3",
        time: "July 4, 9:01am",
        text: "You sent the invoice via email",
      },
      {
        id: "pp4",
        time: "July 3, 7:01pm",
        text: "Invoice was created",
      },
    ],
  },
  overdue: {
    title: "Invoice Overdue",
    amountLabel: "Amount Due",
    badge: {
      label: "Overdue",
      className: "border-[#F5C2C0] bg-[#FDECEC] text-[#C62828]",
    },
    showRecordPayment: true,
    activity: [
      {
        id: "o1",
        time: "July 31, 12:00am",
        text: "Invoice became overdue (31 days past due)",
      },
      {
        id: "o2",
        time: "July 4, 3:33pm",
        text: "Invoice was viewed by the customer for the first time",
      },
      {
        id: "o3",
        time: "July 4, 9:01am",
        text: "You sent the invoice via email",
      },
      {
        id: "o4",
        time: "July 3, 7:01pm",
        text: "Invoice was created",
      },
    ],
  },
  overdue_90: {
    title: "Invoice Overdue (90+ days)",
    amountLabel: "Amount Due",
    badge: {
      label: "Overdue 90+",
      className: "border-[#F5C2C0] bg-[#FDECEC] text-[#C62828]",
    },
    showRecordPayment: true,
    activity: [
      {
        id: "o90",
        time: "Oct 1, 12:00am",
        text: "Invoice crossed 90 days past due",
      },
      {
        id: "o1",
        time: "July 31, 12:00am",
        text: "Invoice became overdue",
      },
      {
        id: "o3",
        time: "July 4, 9:01am",
        text: "You sent the invoice via email",
      },
    ],
  },
  void: {
    title: "Invoice Void",
    amountLabel: "Amount",
    badge: {
      label: "Void",
      className: "border-[#CCCCCC] bg-[#EEEEEE] text-[#666666]",
    },
    showRecordPayment: false,
    activity: [
      {
        id: "v1",
        time: "July 8, 10:00am",
        text: "Invoice was voided",
      },
      {
        id: "v2",
        time: "July 4, 9:01am",
        text: "You sent the invoice via email",
      },
    ],
  },
  uncollectible: {
    title: "Invoice Uncollectible",
    amountLabel: "Written off",
    badge: {
      label: "Uncollectible",
      className: "border-[#CCCCCC] bg-[#EEEEEE] text-[#666666]",
    },
    showRecordPayment: false,
    activity: [
      {
        id: "u1",
        time: "Oct 5, 2:00pm",
        text: "Invoice marked uncollectible",
      },
      {
        id: "u2",
        time: "Oct 1, 12:00am",
        text: "Invoice crossed 90 days past due",
      },
    ],
  },
};

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

export type CustomerInvoiceRow = {
  id: string;
  number: string;
  milestonePhase: string | null;
  dateIssued: string;
  dueDate: string;
  amount: number;
  balanceOutstanding: number;
  status: string;
  customerId: string;

  scheduledReminder: string | null;
};

export type CustomerQuoteRow = {
  id: string;
  number: string;
  dateCreated: string;
  expiryDate: string;
  amount: number;
  status: string;
  customerId: string;

  scheduledReminder: string | null;
};

/** Demo invoices tied to customers for the customer profile page. */
const SEED_CUSTOMER_INVOICES: CustomerInvoiceRow[] = [
  {
    id: "inv-acme-1",
    number: "3001",
    milestonePhase: "Deposit",
    dateIssued: "Jul 2, 2026",
    dueDate: "Aug 1, 2026",
    amount: 2187.5,
    balanceOutstanding: 2187.5,
    status: "Sent",
    customerId: "acme",
  scheduledReminder: "Aug 5, 2026",
  },
  {
    id: "inv-acme-2",
    number: "3002",
    milestonePhase: null,
    dateIssued: "Jul 1, 2026",
    dueDate: "Jul 5, 2026",
    amount: 2187.5,
    balanceOutstanding: 2187.5,
    status: "Overdue",
    customerId: "acme",
  scheduledReminder: "Aug 12, 2026",
  },
  {
    id: "inv-acme-3",
    number: "3003",
    milestonePhase: "Progress",
    dateIssued: "Jul 3, 2026",
    dueDate: "Aug 3, 2026",
    amount: 2187.5,
    balanceOutstanding: 1400,
    status: "Partially Paid",
    customerId: "acme",
  scheduledReminder: null,
  },
  {
    id: "inv-acme-4",
    number: "2998",
    milestonePhase: null,
    dateIssued: "Jul 10, 2026",
    dueDate: "Aug 10, 2026",
    amount: 960,
    balanceOutstanding: 960,
    status: "Viewed",
    customerId: "acme",
  scheduledReminder: null,
  },
  {
    id: "inv-cedar-1",
    number: "2880",
    milestonePhase: null,
    dateIssued: "Jul 8, 2026",
    dueDate: "Jul 22, 2026",
    amount: 1500,
    balanceOutstanding: 0,
    status: "Paid",
    customerId: "cedar",
  scheduledReminder: "Jul 30, 2026",
  },
  {
    id: "inv-delta-1",
    number: "2755",
    milestonePhase: null,
    dateIssued: "Sep 15, 2025",
    dueDate: "Oct 15, 2025",
    amount: 2200,
    balanceOutstanding: 2200,
    status: "Uncollectible",
    customerId: "delta",
  scheduledReminder: null,
  },
  // Scenario B: drafts only (Beta) — archive, cannot delete
  {
    id: "inv-beta-1",
    number: "3101",
    milestonePhase: null,
    dateIssued: "Jul 12, 2026",
    dueDate: "Aug 12, 2026",
    amount: 1200,
    balanceOutstanding: 1200,
    status: "Draft",
    customerId: "beta",
  scheduledReminder: null,
  },
];

const DEMO_CUSTOMER_IDS = customers.map((customer) => customer.id);

const EXTRA_INVOICE_STATUSES = [
  "Draft",
  "Sent",
  "Viewed",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Uncollectible",
] as const;

const EXTRA_QUOTE_STATUSES = [
  "Draft",
  "Sent",
  "Viewed",
  "Accepted",
  "Rejected",
  "Expired",
] as const;

const DEMO_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function demoDate(dayOffset: number, year = 2026) {
  const start = Date.UTC(year, 0, 5);
  const date = new Date(start + dayOffset * 24 * 60 * 60 * 1000);
  const month = DEMO_MONTHS[date.getUTCMonth()];
  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function buildExtraInvoices(count: number): CustomerInvoiceRow[] {
  const rows: CustomerInvoiceRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const status =
      EXTRA_INVOICE_STATUSES[i % EXTRA_INVOICE_STATUSES.length];
    const amount = Math.round((420 + (i % 17) * 185.25) * 100) / 100;
    let balanceOutstanding = amount;
    if (status === "Paid") balanceOutstanding = 0;
    else if (status === "Partially Paid") {
      balanceOutstanding = Math.round(amount * 0.45 * 100) / 100;
    } else if (status === "Draft") {
      balanceOutstanding = amount;
    }
    const issuedOffset = (i * 3) % 200;
    rows.push({
      id: `inv-extra-${i + 1}`,
      number: String(3200 + i),
      milestonePhase: i % 5 === 0 ? "Deposit" : i % 7 === 0 ? "Progress" : null,
      dateIssued: demoDate(issuedOffset),
      dueDate: demoDate(issuedOffset + 30),
      amount,
      balanceOutstanding,
      status,
      customerId: DEMO_CUSTOMER_IDS[i % DEMO_CUSTOMER_IDS.length],
    scheduledReminder: i % 5 === 0 ? demoDate(issuedOffset + 14) : null,
});
  }
  return rows;
}

function buildExtraQuotes(count: number): CustomerQuoteRow[] {
  const rows: CustomerQuoteRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const status = EXTRA_QUOTE_STATUSES[i % EXTRA_QUOTE_STATUSES.length];
    const amount = Math.round((380 + (i % 19) * 162.5) * 100) / 100;
    const createdOffset = (i * 4) % 210;
    rows.push({
      id: `quo-extra-${i + 1}`,
      number: `Q-${220 + i}`,
      dateCreated: demoDate(createdOffset),
      expiryDate: demoDate(createdOffset + 30),
      amount,
      status,
      customerId: DEMO_CUSTOMER_IDS[i % DEMO_CUSTOMER_IDS.length],
    scheduledReminder: i % 6 === 0 ? demoDate(createdOffset + 10) : null,
});
  }
  return rows;
}

export const customerInvoices: CustomerInvoiceRow[] = [
  ...SEED_CUSTOMER_INVOICES,
  ...buildExtraInvoices(48),
];

/** Demo quotes tied to customers for the customer profile page. */
const SEED_CUSTOMER_QUOTES: CustomerQuoteRow[] = [
  {
    id: "quo-acme-1",
    number: "Q-104",
    dateCreated: "Jul 5, 2026",
    expiryDate: "Aug 5, 2026",
    amount: 4200,
    status: "Accepted",
    customerId: "acme",
  scheduledReminder: null,
  },
  {
    id: "quo-acme-2",
    number: "Q-118",
    dateCreated: "Jul 14, 2026",
    expiryDate: "Aug 14, 2026",
    amount: 1850,
    status: "Sent",
    customerId: "acme",
  scheduledReminder: "Aug 1, 2026",
  },
  {
    id: "quo-acme-3",
    number: "Q-121",
    dateCreated: "Jul 18, 2026",
    expiryDate: "Aug 18, 2026",
    amount: 990,
    status: "Draft",
    customerId: "acme",
  scheduledReminder: null,
  },
  {
    id: "quo-acme-4",
    number: "Q-109",
    dateCreated: "Jul 9, 2026",
    expiryDate: "Aug 9, 2026",
    amount: 2400,
    status: "Viewed",
    customerId: "acme",
  scheduledReminder: null,
  },
  {
    id: "quo-cedar-1",
    number: "Q-088",
    dateCreated: "Jun 20, 2026",
    expiryDate: "Jul 20, 2026",
    amount: 3100,
    status: "Rejected",
    customerId: "cedar",
  scheduledReminder: null,
  },
  {
    id: "quo-delta-1",
    number: "Q-072",
    dateCreated: "Nov 10, 2025",
    expiryDate: "Dec 10, 2025",
    amount: 1250,
    status: "Expired",
    customerId: "delta",
  scheduledReminder: null,
  },
  {
    id: "quo-beta-1",
    number: "Q-201",
    dateCreated: "Jul 11, 2026",
    expiryDate: "Aug 11, 2026",
    amount: 850,
    status: "Draft",
    customerId: "beta",
  scheduledReminder: "Jul 28, 2026",
  },
];

export const customerQuotes: CustomerQuoteRow[] = [
  ...SEED_CUSTOMER_QUOTES,
  ...buildExtraQuotes(48),
];

export function getCustomerInvoices(customerId: string | null) {
  if (!customerId) return [];
  return customerInvoices.filter((invoice) => invoice.customerId === customerId);
}

export function getCustomerQuotes(customerId: string | null) {
  if (!customerId) return [];
  return customerQuotes.filter((quote) => quote.customerId === customerId);
}

function isDraftDocumentStatus(status: string) {
  return status.trim().toLowerCase() === "draft";
}

/**
 * Lifecycle for delete vs archive on the customer profile.
 * - none: no invoices/quotes → delete allowed, archive N/A
 * - drafts_only: only draft docs → archive, no delete
 * - has_sent: any non-draft sent/active doc → archive, no delete
 */
export type CustomerDocumentLifecycle = "none" | "drafts_only" | "has_sent";

export function getCustomerDocumentLifecycle(
  customerId: string | null,
): CustomerDocumentLifecycle {
  if (!customerId) return "none";
  const docs = [
    ...getCustomerInvoices(customerId),
    ...getCustomerQuotes(customerId),
  ];
  if (docs.length === 0) return "none";
  if (docs.every((doc) => isDraftDocumentStatus(doc.status))) {
    return "drafts_only";
  }
  return "has_sent";
}

const ARCHIVED_CUSTOMERS_KEY = "atb-invoice-archived-customers";

export function loadArchivedCustomerIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ARCHIVED_CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function persistArchivedCustomerIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ARCHIVED_CUSTOMERS_KEY, JSON.stringify(ids));
}

export function archiveCustomer(customerId: string) {
  const next = Array.from(new Set([...loadArchivedCustomerIds(), customerId]));
  persistArchivedCustomerIds(next);
  return next;
}

export function unarchiveCustomer(customerId: string) {
  const next = loadArchivedCustomerIds().filter((id) => id !== customerId);
  persistArchivedCustomerIds(next);
  return next;
}

export function isCustomerArchived(customerId: string | null) {
  if (!customerId) return false;
  return loadArchivedCustomerIds().includes(customerId);
}

export function getAllCustomers(): Customer[] {
  const custom = loadCustomCustomers();
  const demoIds = new Set(customers.map((customer) => customer.id));
  return [...customers, ...custom.filter((entry) => !demoIds.has(entry.id))];
}

export function findCustomer(id: string | null | undefined) {
  if (!id) return undefined;
  return getAllCustomers().find((customer) => customer.id === id);
}

export function getActiveCustomers() {
  const archived = new Set(loadArchivedCustomerIds());
  return getAllCustomers().filter((customer) => !archived.has(customer.id));
}

export function hrefForCustomerInvoice(status: string) {
  const key = status.toLowerCase();
  if (key === "draft") return "/";
  if (key === "viewed") return "/sent/viewed";
  if (key === "paid") return "/sent/paid";
  if (key === "partially paid") return "/sent/partially-paid";
  if (key === "overdue") return "/sent/overdue";
  if (key === "uncollectible") return "/sent/uncollectible";
  if (key === "void") return "/sent/void";
  return "/sent";
}

export function hrefForCustomerQuote(status: string) {
  const key = status.toLowerCase();
  if (key === "draft") return "/quote";
  if (key === "viewed") return "/quote/viewed";
  if (key === "accepted") return "/quote/accepted";
  if (key === "rejected") return "/quote/rejected";
  if (key === "expired") return "/quote/expired";
  if (key === "void") return "/quote/void";
  return "/quote/sent";
}

export function getCustomerAccountSummary(customerId: string | null) {
  const invoices = getCustomerInvoices(customerId);
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.balanceOutstanding,
    0,
  );
  const paid = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdue = invoices
    .filter((invoice) => /overdue/i.test(invoice.status))
    .reduce((sum, invoice) => sum + invoice.balanceOutstanding, 0);
  // Demo: Acme matches the account-summary mock (paid $0, outstanding less than total).
  if (customerId === "acme") {
    return {
      invoiceCount: 3,
      totalInvoiced: 6562.5,
      paid: 0,
      outstanding: 5775,
      overdue: 2187.5,
    };
  }
  return {
    invoiceCount: invoices.length,
    totalInvoiced,
    paid: Math.max(0, paid || totalInvoiced - outstanding),
    outstanding,
    overdue,
  };
}

const CLOSED_INVOICE_STATUSES = new Set([
  "draft",
  "paid",
  "void",
  "uncollectible",
]);

const ACTIVE_QUOTE_STATUSES = new Set(["sent", "viewed"]);

/** Open invoices + awaiting quotes that may still have shareable access. */
export function countActiveSharedDocuments(customerId: string | null) {
  if (!customerId) return 0;
  const invoices = getCustomerInvoices(customerId).filter(
    (invoice) =>
      !CLOSED_INVOICE_STATUSES.has(invoice.status.trim().toLowerCase()),
  );
  const quotes = getCustomerQuotes(customerId).filter((quote) =>
    ACTIVE_QUOTE_STATUSES.has(quote.status.trim().toLowerCase()),
  );
  return invoices.length + quotes.length;
}

export function formatShareChannelList(channels: Array<"email" | "phone" | "url">) {
  const labels = channels.map((channel) =>
    channel === "url" ? "URL" : channel,
  );
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
