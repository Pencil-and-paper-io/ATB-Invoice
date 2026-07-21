"use client";

import { OnboardingCustomerPrompt } from "@/components/invoice/OnboardingCustomerPrompt";
import { PlaceholderPage } from "@/components/invoice/PlaceholderPage";

export default function DashboardPage() {
  return (
    <>
      <PlaceholderPage title="Dashboard" />
      <OnboardingCustomerPrompt />
    </>
  );
}
