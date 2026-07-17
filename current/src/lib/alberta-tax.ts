export type AlbertaTaxOption = {
  label: string;
  rate: number | null;
  gstRate?: number;
  pstRate?: number;
  included?: boolean;
  hint: string;
};

/** Common tax choices for Alberta small businesses, including out-of-province clients. */
export const ALBERTA_TAX_OPTIONS: AlbertaTaxOption[] = [
  {
    label: "GST - 5%",
    rate: 5,
    gstRate: 5,
    hint: "Standard federal GST for most taxable sales to Alberta customers.",
  },
  {
    label: "HST - 13% (ON)",
    rate: 13,
    gstRate: 13,
    hint: "Ontario clients — combined GST/HST when place of supply rules apply.",
  },
  {
    label: "HST - 15% (NS / NB / NL / PE)",
    rate: 15,
    gstRate: 15,
    hint: "Atlantic provinces — Nova Scotia, New Brunswick, Newfoundland & Labrador, or PEI.",
  },
  {
    label: "GST + PST - BC (12%)",
    rate: 12,
    gstRate: 5,
    pstRate: 7,
    hint: "British Columbia — 5% GST + 7% PST when both apply to the supply.",
  },
  {
    label: "GST + PST - SK (11%)",
    rate: 11,
    gstRate: 5,
    pstRate: 6,
    hint: "Saskatchewan — 5% GST + 6% PST when both apply.",
  },
  {
    label: "GST + RST - MB (12%)",
    rate: 12,
    gstRate: 5,
    pstRate: 7,
    hint: "Manitoba — 5% GST + 7% RST when both apply.",
  },
  {
    label: "GST + QST - QC (14.975%)",
    rate: 14.975,
    gstRate: 5,
    pstRate: 9.975,
    hint: "Quebec — 5% GST + 9.975% QST when both apply.",
  },
  {
    label: "Zero-rated - 0%",
    rate: 0,
    gstRate: 0,
    hint: "Taxable at 0% — e.g. many exports of goods/services outside Canada, or other zero-rated commercial supplies.",
  },
  {
    label: "Tax Exempt",
    rate: null,
    hint: "Exempt supplies (e.g. many financial, residential rent, or certain professional services).",
  },
  {
    label: "No Tax",
    rate: null,
    hint: "Use when GST/HST does not apply to this line (outside tax scope).",
  },
  {
    label: "GST Included",
    rate: 5,
    gstRate: 5,
    included: true,
    hint: "Price already includes GST; useful for tax-inclusive Alberta quotes.",
  },
];

export const ALBERTA_TAX_TOOLTIP =
  "Alberta has no provincial sales tax (PST). Local sales usually use GST at 5%. For clients in other provinces, place-of-supply rules may require HST or GST + provincial tax. Zero-rated is for eligible 0% commercial supplies (such as many exports). If you’re unsure, check CRA guidance or your accountant.";

export const TAX_RESOURCES_URL =
  "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html";

export const TAX_RESOURCES_LABEL = "More resources (CRA place of supply)";

export function matchAlbertaTaxOptions(query: string): AlbertaTaxOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALBERTA_TAX_OPTIONS;
  return ALBERTA_TAX_OPTIONS.filter(
    (option) =>
      option.label.toLowerCase().includes(q) ||
      option.hint.toLowerCase().includes(q),
  );
}

export function formatDiscountChip(
  value: number,
  type: "percent" | "fixed",
  formatMoney: (n: number) => string,
) {
  if (value <= 0) return null;
  return type === "percent"
    ? `${value}% Off`
    : `Discount ${formatMoney(value)}`;
}

export function computeLineTotal(
  unitPrice: number,
  qty: number,
  discount: number,
  discountType: "percent" | "fixed",
) {
  const subtotal = unitPrice * qty;
  const discountAmount =
    discountType === "percent" ? (subtotal * discount) / 100 : discount;
  return Math.max(subtotal - discountAmount, 0);
}

export function findTaxOption(label: string): AlbertaTaxOption | undefined {
  return ALBERTA_TAX_OPTIONS.find((option) => option.label === label);
}

export function getLineTaxLabel(badges: { label: string }[]): string {
  return (
    badges.find(
      (badge) =>
        !badge.label.toLowerCase().startsWith("discount") &&
        !/%\s*off/i.test(badge.label),
    )?.label ?? ""
  );
}

export function computeLineDiscountAmount(
  unitPrice: number,
  qty: number,
  discount: number,
  discountType: "percent" | "fixed" = "fixed",
) {
  const subtotal = unitPrice * qty;
  const amount =
    discountType === "percent" ? (subtotal * discount) / 100 : discount;
  return Math.min(Math.max(amount, 0), subtotal);
}

export function computeLineTaxAmounts(
  taxableBase: number,
  taxLabel: string,
): { gst: number; pst: number } {
  const option = findTaxOption(taxLabel);
  if (!option || option.gstRate == null) {
    return { gst: 0, pst: 0 };
  }

  if (option.included) {
    const gst = taxableBase - taxableBase / (1 + option.gstRate / 100);
    return { gst, pst: 0 };
  }

  return {
    gst: (taxableBase * (option.gstRate ?? 0)) / 100,
    pst: (taxableBase * (option.pstRate ?? 0)) / 100,
  };
}

export type InvoiceLineForTotals = {
  unitPrice: number;
  qty: number;
  discount: number;
  discountType: "percent" | "fixed";
  total: number;
  taxBadges: { label: string }[];
};

export type TaxMode = "inclusive" | "exclusive";

export type InvoiceTotals = {
  subtotal: number;
  itemDiscount: number;
  invoiceDiscount: number;
  shipping: number;
  gst: number;
  pst: number;
  /** Grand total the customer pays (includes tax in both modes). */
  total: number;
};

/**
 * Aggregate line items into invoice totals.
 *
 * - "exclusive": each line total is pre-tax; GST/PST are added on top and the
 *   grand total is the after-tax amount the customer pays.
 * - "inclusive": each line total already contains tax; GST/PST are the portion
 *   extracted from within, and the grand total equals the sum of line totals.
 */
export function computeInvoiceTotals(
  items: InvoiceLineForTotals[],
  taxMode: TaxMode = "exclusive",
  extras: {
    invoiceDiscount?: number;
    invoiceDiscountType?: "fixed" | "percent";
    shipping?: number;
  } = {},
): InvoiceTotals {
  const base = items.reduce(
    (acc, item) => {
      const lineSubtotal = item.unitPrice * item.qty;
      const discount = computeLineDiscountAmount(
        item.unitPrice,
        item.qty,
        item.discount,
        item.discountType,
      );

      const option = findTaxOption(getLineTaxLabel(item.taxBadges));
      const gstRate = option?.gstRate ?? 0;
      const pstRate = option?.pstRate ?? 0;
      const hasTax = option != null && option.gstRate != null;

      let gst = 0;
      let pst = 0;
      let lineTotalWithTax = item.total;

      if (hasTax) {
        if (taxMode === "inclusive") {
          const combined = (gstRate + pstRate) / 100;
          const net = combined > 0 ? item.total / (1 + combined) : item.total;
          gst = (net * gstRate) / 100;
          pst = (net * pstRate) / 100;
          lineTotalWithTax = item.total;
        } else {
          gst = (item.total * gstRate) / 100;
          pst = (item.total * pstRate) / 100;
          lineTotalWithTax = item.total + gst + pst;
        }
      }

      return {
        subtotal: acc.subtotal + lineSubtotal,
        itemDiscount: acc.itemDiscount + discount,
        gst: acc.gst + gst,
        pst: acc.pst + pst,
        total: acc.total + lineTotalWithTax,
      };
    },
    { subtotal: 0, itemDiscount: 0, gst: 0, pst: 0, total: 0 },
  );

  const rawDiscount = Math.max(extras.invoiceDiscount ?? 0, 0);
  const invoiceDiscount =
    extras.invoiceDiscountType === "percent"
      ? (base.total * rawDiscount) / 100
      : rawDiscount;
  const shipping = Math.max(extras.shipping ?? 0, 0);

  return {
    ...base,
    invoiceDiscount,
    shipping,
    total: Math.max(base.total - invoiceDiscount + shipping, 0),
  };
}

export const TAX_SETTING_TOOLTIP = {
  inclusive: [
    "Line prices already contain GST/PST.",
    "The customer pays the listed price.",
    "Tax shown in totals is the portion inside that price.",
    "Best for all-in consumer pricing.",
  ],
  exclusive: [
    "Tax is added on top of your line prices.",
    "The customer pays more than the listed amount.",
    "Tax appears as a separate line in the totals.",
    "Best for standard B2B invoicing.",
  ],
};
