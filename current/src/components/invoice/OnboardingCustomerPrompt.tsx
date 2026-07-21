"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Modal } from "@/components/invoice/ui";

const STORAGE_KEY = "atb-onboarding-customer-prompt-dismissed";

/**
 * Shown after org profile onboarding (dashboard). Prompt to create a customer
 * before invoicing — Epic 1.2 entry point.
 */
export function OnboardingCustomerPrompt() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <Modal
      title="Create a customer"
      titleId="onboarding-customer-prompt"
      onClose={dismiss}
      cancelLabel="Not now"
      onCancel={dismiss}
      confirmLabel="Create customer"
      onConfirm={() => {
        dismiss();
        router.push("/customers/new");
      }}
    >
      <p className="text-sm leading-6 text-black/70">
        Want to create an invoice? Start with creating a customer.
      </p>
    </Modal>
  );
}
