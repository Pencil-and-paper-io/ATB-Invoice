"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/invoice/TopNav";

/** Payment methods live under Manage Organization → Payment Options. */
export default function PaymentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/organization#payment-options");
  }, [router]);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="type-body-muted">
          Redirecting to Payment Options in Manage Organization…
        </p>
      </main>
    </div>
  );
}
