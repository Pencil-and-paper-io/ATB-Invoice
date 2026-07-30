import { Suspense } from "react";
import { OnboardingWizardView } from "@/components/invoice/OnboardingWizardView";
import { TopNav } from "@/components/invoice/TopNav";

function OnboardingFallback() {
  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="type-body text-black/55">Loading…</p>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingWizardView />
    </Suspense>
  );
}
