"use client";

import { useEffect, useState } from "react";
import { UI_CLASS } from "@/lib/design-tokens";
import { Modal } from "@/components/invoice/ui";
import { ONBOARDING_SKIPPED_WELCOME_KEY } from "@/components/invoice/OnboardingWelcomeHero";

/**
 * Shown once on the dashboard when the user skips setup from the welcome hero.
 */
export function WelcomeSkippedModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(ONBOARDING_SKIPPED_WELCOME_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    try {
      window.sessionStorage.removeItem(ONBOARDING_SKIPPED_WELCOME_KEY);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <Modal
      title="Welcome to ATB Invoicing!"
      titleId="welcome-skipped-title"
      onClose={dismiss}
      hideCancel
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={dismiss}
            className={`${UI_CLASS.btnPrimary} h-11 px-6`}
          >
            Close
          </button>
        </div>
      }
    >
      <p className="text-center text-sm leading-6 text-black/70">
        Explore our features at your own pace. You can set up your details later
        by clicking on &quot;New Invoice&quot; or &quot;New Quote&quot;.
      </p>
    </Modal>
  );
}
