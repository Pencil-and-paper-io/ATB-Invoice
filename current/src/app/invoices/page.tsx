import { Suspense } from "react";
import { DocumentDirectoryView } from "@/components/invoice/DocumentDirectoryView";
import { TopNav } from "@/components/invoice/TopNav";

function DirectoryFallback({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-[1180px] px-4 py-16">
        <p className="type-body-muted">Loading {title}…</p>
      </main>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<DirectoryFallback title="invoices" />}>
      <DocumentDirectoryView kind="invoices" />
    </Suspense>
  );
}
