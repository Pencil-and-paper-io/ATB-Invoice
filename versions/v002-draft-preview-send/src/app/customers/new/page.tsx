import Link from "next/link";
import { TopNav } from "@/components/invoice/TopNav";

export default function NewCustomerPage() {
  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-[720px] px-4 py-16 sm:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-prime-blue underline underline-offset-2 transition hover:opacity-80"
          >
            ← Back to invoice
          </Link>
        </div>
        <h1 className="font-display text-[42px] font-bold tracking-tight">
          Create Customer
        </h1>
        <div className="mt-8 rounded-[10px] border border-black/10 bg-white p-[30px]">
          <p className="text-base text-black">
            Customer creation form placeholder. This page will be defined later —
            both <span className="font-semibold">Create new</span> and{" "}
            <span className="font-semibold">Edit Customer Details</span> route
            here.
          </p>
        </div>
      </main>
    </div>
  );
}
