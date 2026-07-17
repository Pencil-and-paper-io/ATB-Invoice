import { Suspense } from "react";
import { OrganizationSettingsView } from "@/components/invoice/OrganizationSettingsView";
import { TopNav } from "@/components/invoice/TopNav";

export default function OrganizationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page-grey text-black">
          <TopNav />
          <main className="mx-auto max-w-[900px] px-4 py-16">
            <p className="type-body-muted">Loading…</p>
          </main>
        </div>
      }
    >
      <OrganizationSettingsView />
    </Suspense>
  );
}
