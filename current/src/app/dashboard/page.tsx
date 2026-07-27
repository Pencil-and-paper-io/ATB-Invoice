"use client";

import { DashboardView } from "@/components/invoice/DashboardView";
import { OnboardingCompleteModal } from "@/components/invoice/OnboardingCompleteModal";
import { OnboardingCustomerPrompt } from "@/components/invoice/OnboardingCustomerPrompt";
import { WelcomeSkippedModal } from "@/components/invoice/WelcomeSkippedModal";

export default function DashboardPage() {
  return (
    <>
      <DashboardView />
      <WelcomeSkippedModal />
      <OnboardingCompleteModal />
      <OnboardingCustomerPrompt />
    </>
  );
}
