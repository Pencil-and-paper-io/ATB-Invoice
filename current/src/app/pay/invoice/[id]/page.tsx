import { Suspense } from "react";
import { InvoicePasswordGateView } from "@/components/invoice/InvoicePasswordGateView";

export default async function PayInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-grey text-sm text-black/50">
          Loading…
        </div>
      }
    >
      <InvoicePasswordGateView invoiceId={id} />
    </Suspense>
  );
}
