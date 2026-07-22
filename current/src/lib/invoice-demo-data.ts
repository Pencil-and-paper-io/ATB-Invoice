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
};

export const customers: Customer[] = [
  {
    id: "acme",
    name: "Acme Construction Co",
    address: "115-31st Ave SE Calgary, AB T3Z 1R0",
    phone: "1-403-257-0099",
    email: "accounting@acme.co",
    tags: ["VIP", "Contractor"],
  },
  {
    id: "beta",
    name: "Beta Builders Ltd",
    address: "88 Riverfront Ave SW Calgary, AB T2P 0N9",
    phone: "1-403-555-0142",
    email: "billing@betabuilders.ca",
    tags: ["Retail"],
  },
  {
    id: "cedar",
    name: "Cedar Contracting",
    address: "204-12th St NW Calgary, AB T2N 1M5",
    phone: "1-403-555-0177",
    email: "invoices@cedarcontracting.ca",
    tags: ["Wholesale", "Net-30"],
  },
  {
    id: "delta",
    name: "Delta Design Studio",
    address: "610 8 Ave SW Calgary, AB T2P 1G5",
    phone: "1-403-555-0190",
    email: "accounts@deltadesign.ca",
    tags: ["VIP", "Retail"],
  },
  {
    id: "evergreen",
    name: "Evergreen Landscaping Inc",
    address: "4501 17 Ave SE Calgary, AB T2A 0V1",
    phone: "1-587-555-0133",
    email: "payables@evergreenland.ca",
    tags: ["Contractor", "Net-30"],
  },
  {
    id: "falcon",
    name: "Falcon HVAC Services",
    address: "2335 30 Ave NE Calgary, AB T2E 7C7",
    phone: "1-403-555-0168",
    email: "billing@falconhvac.ca",
    tags: ["Wholesale"],
  },
  {
    id: "glacier",
    name: "Glacier Peak Consulting",
    address: "1000 7 Ave SW Calgary, AB T2P 5L5",
    phone: "1-825-555-0111",
    email: "finance@glacierpeak.ca",
    tags: ["VIP", "Net-30"],
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
    { id: "a3", time: "July 4, 9:01am", text: "You sent the invoice totalling $503.00 via email" },
    { id: "a2", time: "July 3, 7:22pm", text: "You updated the invoice" },
    { id: "a1", time: "July 3, 7:01pm", text: "Invoice was created for $353.00" },
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
    activity: { id: string; time: string; text: string }[];
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
    activity: previewMeta.activity,
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
        text: "You sent the invoice totalling $3,555.99 via email",
      },
      {
        id: "p4",
        time: "July 3, 7:01pm",
        text: "Invoice was created for $3,555.99",
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
        text: "You sent the invoice totalling $3,555.99 via email",
      },
      {
        id: "o4",
        time: "July 3, 7:01pm",
        text: "Invoice was created for $3,555.99",
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
        text: "You sent the invoice totalling $3,555.99 via email",
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
        text: "You sent the invoice totalling $3,555.99 via email",
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
};

export type CustomerQuoteRow = {
  id: string;
  number: string;
  dateCreated: string;
  expiryDate: string;
  amount: number;
  status: string;
  customerId: string;
};

/** Demo invoices tied to customers for the customer profile page. */
export const customerInvoices: CustomerInvoiceRow[] = [
  {
    id: "inv-acme-1",
    number: "3001",
    milestonePhase: "Deposit",
    dateIssued: "Mar 12, 2026",
    dueDate: "Apr 12, 2026",
    amount: 2187.5,
    balanceOutstanding: 2187.5,
    status: "Sent",
    customerId: "acme",
  },
  {
    id: "inv-acme-2",
    number: "3002",
    milestonePhase: null,
    dateIssued: "Feb 1, 2026",
    dueDate: "Mar 1, 2026",
    amount: 2187.5,
    balanceOutstanding: 2187.5,
    status: "Overdue",
    customerId: "acme",
  },
  {
    id: "inv-acme-3",
    number: "3003",
    milestonePhase: "Progress",
    dateIssued: "Apr 3, 2026",
    dueDate: "May 3, 2026",
    amount: 2187.5,
    balanceOutstanding: 1400,
    status: "Partially Paid",
    customerId: "acme",
  },
  // Scenario B: drafts only (Beta) — archive, cannot delete
  {
    id: "inv-beta-1",
    number: "3101",
    milestonePhase: null,
    dateIssued: "Apr 10, 2026",
    dueDate: "May 10, 2026",
    amount: 1200,
    balanceOutstanding: 1200,
    status: "Draft",
    customerId: "beta",
  },
];

/** Demo quotes tied to customers for the customer profile page. */
export const customerQuotes: CustomerQuoteRow[] = [
  {
    id: "quo-acme-1",
    number: "Q-104",
    dateCreated: "Jan 8, 2026",
    expiryDate: "Feb 8, 2026",
    amount: 4200,
    status: "Accepted",
    customerId: "acme",
  },
  {
    id: "quo-acme-2",
    number: "Q-118",
    dateCreated: "Mar 20, 2026",
    expiryDate: "Apr 20, 2026",
    amount: 1850,
    status: "Sent",
    customerId: "acme",
  },
  {
    id: "quo-acme-3",
    number: "Q-121",
    dateCreated: "Apr 2, 2026",
    expiryDate: "May 2, 2026",
    amount: 990,
    status: "Draft",
    customerId: "acme",
  },
  {
    id: "quo-beta-1",
    number: "Q-201",
    dateCreated: "Apr 8, 2026",
    expiryDate: "May 8, 2026",
    amount: 850,
    status: "Draft",
    customerId: "beta",
  },
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

export function getActiveCustomers() {
  const archived = new Set(loadArchivedCustomerIds());
  return customers.filter((customer) => !archived.has(customer.id));
}

export function hrefForCustomerInvoice(status: string) {
  const key = status.toLowerCase();
  if (key === "draft") return "/";
  if (key === "viewed") return "/sent/viewed";
  if (key === "paid") return "/sent/paid";
  if (key === "overdue") return "/sent/overdue";
  if (key === "uncollectible") return "/sent/uncollectible";
  if (key === "void") return "/sent/void";
  return "/sent";
}

export function hrefForCustomerQuote(status: string) {
  const key = status.toLowerCase();
  if (key === "draft") return "/quote";
  if (key === "viewed") return "/quote/viewed";
  if (key === "rejected") return "/quote/rejected";
  if (key === "expired") return "/quote/expired";
  if (key === "void") return "/quote/void";
  if (key === "accepted") return "/?from=quote";
  return "/quote/sent";
}

export function getCustomerAccountSummary(customerId: string | null) {
  const invoices = getCustomerInvoices(customerId);
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.balanceOutstanding,
    0,
  );
  const paid = Math.max(0, totalInvoiced - outstanding);
  // Demo: Acme matches the account-summary mock (paid $0, outstanding less than total).
  if (customerId === "acme") {
    return {
      invoiceCount: 3,
      totalInvoiced: 6562.5,
      paid: 0,
      outstanding: 5775,
    };
  }
  return {
    invoiceCount: invoices.length,
    totalInvoiced,
    paid,
    outstanding,
  };
}
