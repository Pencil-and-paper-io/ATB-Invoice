"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UI_CLASS } from "@/lib/design-tokens";
import { EditCloseButton } from "@/components/invoice/ui";

export const ONBOARDING_JUST_COMPLETED_KEY = "atb-onboarding-just-completed";
/** Session flag: first invoice after onboarding — empty Bill To, no templates. */
export const FIRST_INVOICE_PLAYTHROUGH_KEY = "atb-first-invoice-playthrough";

/**
 * Shown once on the dashboard immediately after finishing invoicing onboarding.
 * Matches the setup wizard modal size; icon/title/body are vertically centered.
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

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 px-4 py-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-complete-title"
        className="relative flex h-[min(760px,88vh)] w-full max-w-[960px] flex-col overflow-hidden rounded-xl border border-black/15 bg-white shadow-2xl"
      >
        <EditCloseButton
          onClick={dismiss}
          className="absolute right-5 top-5 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
        />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-10 py-10 text-center sm:px-16">
          <Image
            src="/onboard-icon-tada.png"
            alt=""
            width={64}
            height={64}
            className="mb-8 h-14 w-14 object-contain sm:mb-10 sm:h-16 sm:w-16"
            priority
          />
          <h2
            id="onboarding-complete-title"
            className="type-headline-3 text-black"
          >
            You&apos;re all set!
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-black/70">
            Your organization&apos;s information and defaults have been
            successfully saved.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-10 py-5 sm:px-16">
          <button
            type="button"
            onClick={dismiss}
            className={`${UI_CLASS.btnSecondary} h-11 px-5`}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              dismiss();
              try {
                window.sessionStorage.setItem(
                  FIRST_INVOICE_PLAYTHROUGH_KEY,
                  "1",
                );
                window.localStorage.setItem(
                  "atb-onboarding-customer-prompt-dismissed",
                  "1",
                );
              } catch {
                /* ignore */
              }
              router.push("/?fresh=1");
            }}
            className={`${UI_CLASS.btnPrimary} h-11 px-6`}
          >
            Create an Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
