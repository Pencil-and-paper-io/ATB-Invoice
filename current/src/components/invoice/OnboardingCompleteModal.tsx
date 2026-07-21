"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UI_CLASS } from "@/lib/design-tokens";
import { Modal } from "@/components/invoice/ui";

export const ONBOARDING_JUST_COMPLETED_KEY = "atb-onboarding-just-completed";

function OnboardingCompleteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill="#0072F0" />
      <path
        d="M20 32.5 28.5 41 44 23"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Shown once on the dashboard immediately after finishing invoicing onboarding.
 */
export function OnboardingCompleteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(ONBOARDING_JUST_COMPLETED_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    try {
      window.sessionStorage.removeItem(ONBOARDING_JUST_COMPLETED_KEY);
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <Modal
      title="You're all set!"
      titleId="onboarding-complete-title"
      onClose={dismiss}
      hideCancel
      aboveTitle={<OnboardingCompleteIcon className="h-14 w-14" />}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-semibold text-black/55 transition hover:text-black"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              router.push("/customers/new");
            }}
            className={`${UI_CLASS.btnPrimary} h-11 px-5`}
          >
            Create an Invoice
          </button>
        </div>
      }
    >
      <p className="text-center text-sm leading-6 text-black/70">
        Your organization&apos;s information and defaults have been successfully
        saved.
      </p>
    </Modal>
  );
}
