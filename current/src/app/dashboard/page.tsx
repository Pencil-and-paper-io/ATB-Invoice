"use client";

import { OnboardingCompleteModal } from "@/components/invoice/OnboardingCompleteModal";
import { OnboardingCustomerPrompt } from "@/components/invoice/OnboardingCustomerPrompt";
import { PlaceholderPage } from "@/components/invoice/PlaceholderPage";

export default function DashboardPage() {
  return (
    <>
      <PlaceholderPage title="Dashboard" />
      <OnboardingCompleteModal />
      <OnboardingCustomerPrompt />
    </>
  );
}
