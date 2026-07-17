import { Suspense } from "react";
import { DraftInvoiceView } from "@/components/invoice/DraftInvoiceView";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page-grey" />}>
      <DraftInvoiceView />
    </Suspense>
  );
}
