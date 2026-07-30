"use client";

import { UI_CLASS } from "@/lib/design-tokens";
import { Modal } from "@/components/invoice/ui";

export const ONBOARDING_SKIPPED_WELCOME_KEY = "atb-onboarding-skipped-welcome";

/**
 * Welcome modal after terms (adapts Figma 3044:1601 into a dashboard modal).
 */
export function OnboardingWelcomeHero({
  onStart,
  onLater,
  onClose,
  firstDocument = "invoice",
}: {
  onStart: () => void;
  onLater: () => void;
  onClose: () => void;
  /** Shown in the title — quote vs invoice based on entry point. */
  firstDocument?: "invoice" | "quote";
}) {
  return (
    <Modal
      title={`You're moments away from creating your first ${firstDocument}`}
      titleId="onboarding-welcome-title"
      onClose={onClose}
      maxWidthClass="max-w-[41.4rem]"
      paddingClass="flex min-h-[28.75rem] flex-col justify-center p-10 sm:min-h-[33rem] sm:p-14"
      zClass="z-[180]"
      closeOnBackdrop={false}
      hideCancel
      aboveTitle={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/onboard-moments-icon.png"
          alt=""
          className="h-14 w-14 object-contain sm:h-16 sm:w-16"
        />
      }
      footer={
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onStart}
            className={`${UI_CLASS.btnPrimary} h-11 px-6`}
          >
            Let&apos;s Start
          </button>
          <button
            type="button"
            onClick={onLater}
            className="mt-10 type-subtitle-1 text-prime-blue underline underline-offset-2 transition hover:text-prime-blue-hover"
          >
            Do This Later
          </button>
        </div>
      }
    >
      <p className="text-center text-sm leading-6 text-black/70">
        Ready to jump into the setup wizard? You can close anytime — anything
        you&apos;ve entered will be saved.
      </p>
    </Modal>
  );
}
