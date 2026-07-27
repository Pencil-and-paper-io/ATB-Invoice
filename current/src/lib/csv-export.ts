import {
  customers,
  customerInvoices,
  customerQuotes,
  type CustomerInvoiceRow,
  type CustomerQuoteRow,
} from "@/lib/invoice-demo-data";

function escapeCsvCell(value: string | number) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers: string[], rows: (string | number)[][]) {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

function customerName(customerId: string) {
  return customers.find((entry) => entry.id === customerId)?.name ?? "";
}

function downloadBlob(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportInvoicesCsv(
  rows: CustomerInvoiceRow[] = customerInvoices,
  filename = "invoices-export.csv",
) {
  const csv = toCsv(
    [
      "Invoice #",
      "Customer",
      "Status",
      "Date Issued",
      "Due Date",
      "Amount",
      "Paid",
      "Outstanding",
    ],
    rows.map((row) => [
      row.number,
      customerName(row.customerId),
      row.status,
      row.dateIssued,
      row.dueDate,
      row.amount.toFixed(2),
      Math.max(0, row.amount - row.balanceOutstanding).toFixed(2),
      row.balanceOutstanding.toFixed(2),
    ]),
  );
  downloadBlob(filename, csv);
}

export function exportQuotesCsv(
  rows: CustomerQuoteRow[] = customerQuotes,
  filename = "quotes-export.csv",
) {
  const csv = toCsv(
    ["Quote #", "Customer", "Status", "Created", "Expiry", "Amount"],
    rows.map((row) => [
      row.number,
      customerName(row.customerId),
      row.status,
      row.dateCreated,
      row.expiryDate,
      row.amount.toFixed(2),
    ]),
  );
  downloadBlob(filename, csv);
}

export function exportSingleInvoiceCsv(invoiceNumber = "3001") {
  const match = customerInvoices.find((row) => row.number === invoiceNumber);
  exportInvoicesCsv(match ? [match] : customerInvoices.slice(0, 1), `invoice-${invoiceNumber}.csv`);
}
