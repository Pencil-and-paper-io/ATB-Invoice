"use client";

import { OnboardingCompleteModal } from "@/components/invoice/OnboardingCompleteModal";
import { OnboardingCustomerPrompt } from "@/components/invoice/OnboardingCustomerPrompt";
import { PlaceholderPage } from "@/components/invoice/PlaceholderPage";
import { WelcomeSkippedModal } from "@/components/invoice/WelcomeSkippedModal";

export default function DashboardPage() {
  return (
    <>
      <PlaceholderPage title="Dashboard" />
      <WelcomeSkippedModal />
      <OnboardingCompleteModal />
      <OnboardingCustomerPrompt />
    </>
  );
}
