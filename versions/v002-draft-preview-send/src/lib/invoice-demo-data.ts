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
};

export const customers: Customer[] = [
  {
    id: "acme",
    name: "Acme Construction Co",
    address: "115-31st Ave SE Calgary, AB T3Z 1R0",
    phone: "1-403-257-0099",
    email: "accounting@acme.co",
  },
  {
    id: "beta",
    name: "Beta Builders Ltd",
    address: "88 Riverfront Ave SW Calgary, AB T2P 0N9",
    phone: "1-403-555-0142",
    email: "billing@betabuilders.ca",
  },
  {
    id: "cedar",
    name: "Cedar Contracting",
    address: "204-12th St NW Calgary, AB T2N 1M5",
    phone: "1-403-555-0177",
    email: "invoices@cedarcontracting.ca",
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
    color: "#F4A21E",
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
  paymentOptions: [
    {
      id: "etransfer",
      label: "Interac e-Transfer Request",
      checked: true,
      details: [
        { label: "Cost to you", text: "$1.50 per request" },
        { label: "Cost to client", text: "Free" },
        {
          label: "Limits",
          text: "Typically capped at $3,000 per day (dependent on client's personal bank plan)",
        },
      ],
    },
    {
      id: "eft",
      label: "EFT (Direct Deposit)",
      checked: false,
      details: [
        {
          label: "Cost to you",
          text: "Up to $1.50 per EFT deposit; check your specific account terms.",
        },
        { label: "Cost to client", text: "Typically free" },
        {
          label: "Limits",
          text: "$3,000 to $10,000 per day (dependent on client's personal bank security limits)",
        },
        {
          label: "Note",
          text: "Selecting this will display your bank deposit info on the invoice. You can turn this payment mechanism for specific clients later.",
          italic: true,
        },
      ],
    },
    {
      id: "cheque",
      label: "Cheque",
      checked: false,
      details: [
        {
          label: "Cost to you",
          text: "Up to $1.00 per cheque; check your specific account terms.",
        },
        {
          label: "Cost to client",
          text: "Up to $2.00 per cheque written",
        },
      ],
    },
    {
      id: "cash",
      label: "Cash",
      checked: false,
      details: [
        {
          label: "Cost to you",
          text: "Up to $2.50 per $1,000 cash; check your specific account terms.",
        },
        {
          label: "Cost to client",
          text: "Free at their own bank's ATM, or up to $2.00 if using an out-of-network machine.",
        },
      ],
    },
  ] as PaymentOption[],
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

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}
