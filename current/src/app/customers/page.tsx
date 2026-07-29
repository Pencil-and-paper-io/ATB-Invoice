import { Suspense } from "react";
import CustomersDirectoryClient from "./CustomersDirectoryClient";

function CustomersFallback() {
  return (
    <div className="min-h-screen bg-page-grey text-black">
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
        <p className="type-body-muted">Loading customers…</p>
      </main>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersFallback />}>
      <CustomersDirectoryClient />
    </Suspense>
  );
}
