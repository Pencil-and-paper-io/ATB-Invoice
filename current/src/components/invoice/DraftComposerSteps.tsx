"use client";

import { useEffect, useState, type ReactNode } from "react";
import { UI_CLASS } from "@/lib/design-tokens";

export type DraftComposerStepId =
  | "customerDetails"
  | "lineItems"
  | "customerNote"
  | "payments"
  | "automations"
  | "noteToSelf"
  | "style";

export type DraftComposerStep = {
  id: DraftComposerStepId;
  title: string;
  /** Display number in the badge (defaults to list order). */
  stepNumber?: number;
  summary: ReactNode;
  content: ReactNode;
  summaryLayout?: "line" | "block";
  /** When false, hide the Save button (e.g. until first line item exists). */
  canSave?: boolean;
  /** Called before the step collapses on Save (e.g. commit an editor). */
  onBeforeSave?: () => void;
};

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-black/35"
    >
      <path
        d="m6 4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepBadge({
  index,
  complete,
}: {
  index: number;
  complete: boolean;
}) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full type-subtitle-2 ${
        complete
          ? "bg-prime-blue text-white"
          : "bg-black/10 text-black/45"
      }`}
      aria-hidden
    >
      {complete ? (
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
          <path
            d="M1 5.2 4.8 8.8 13 1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        index
      )}
    </span>
  );
}

/**
 * Step list → full-screen dedicated step page with a light slide transition.
 * Back / Cancel returns to the list; Save marks the step complete.
 */
export function DraftComposerSteps({
  steps,
  initialStep = null,
  onActiveChange,
}: {
  steps: DraftComposerStep[];
  initialStep?: DraftComposerStepId | null;
  onActiveChange?: (active: boolean) => void;
}) {
  const [activeStep, setActiveStep] = useState<DraftComposerStepId | null>(
    initialStep,
  );
  const [entered, setEntered] = useState(false);
  const [savedSteps, setSavedSteps] = useState<
    Partial<Record<DraftComposerStepId, boolean>>
  >({});

  const active = steps.find((step) => step.id === activeStep) ?? null;
  const showSave = active != null && active.canSave !== false;

  useEffect(() => {
    onActiveChange?.(activeStep != null);
  }, [activeStep, onActiveChange]);

  useEffect(() => {
    if (!activeStep) {
      setEntered(false);
      return;
    }
    setEntered(false);
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [activeStep]);

  function openStep(step: DraftComposerStepId) {
    setActiveStep(step);
  }

  function goBack() {
    setActiveStep(null);
  }

  function saveStep(step: DraftComposerStepId) {
    const def = steps.find((entry) => entry.id === step);
    def?.onBeforeSave?.();
    setSavedSteps((prev) => ({ ...prev, [step]: true }));
    setActiveStep(null);
  }

  return (
    <>
      <div
        className="flex flex-col gap-2.5"
        aria-label="Draft composer steps"
        hidden={active != null}
      >
        {steps.map((step, index) => {
          const complete = Boolean(savedSteps[step.id]);
          const badgeNumber = step.stepNumber ?? index + 1;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => openStep(step.id)}
              className="flex w-full items-start gap-3 rounded-[10px] border border-black/10 bg-white px-5 py-4 text-left transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue sm:px-[30px] sm:py-5"
            >
              <StepBadge index={badgeNumber} complete={complete} />
              <span className="min-w-0 flex-1">
                <span className="block type-headline-5 text-midnight-ink">
                  {step.title}
                </span>
                {step.summaryLayout === "block" ? (
                  <div className="min-w-0">{step.summary}</div>
                ) : (
                  <span className="mt-1 block truncate type-paragraph-2 text-black/55">
                    {step.summary}
                  </span>
                )}
              </span>
              <ChevronRightIcon />
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          className={`fixed inset-0 z-[200] flex flex-col bg-white transition duration-300 ease-out ${
            entered
              ? "translate-x-0 opacity-100"
              : "translate-x-6 opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <header className="shrink-0 border-b border-black/10 bg-white">
            <div className="flex items-center gap-3 px-8 py-4 sm:px-12 lg:px-16 lg:py-5">
              <button
                type="button"
                onClick={goBack}
                className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-midnight-ink transition hover:bg-black/5"
                aria-label="Back"
              >
                <BackIcon />
              </button>
              <h2 className="min-w-0 type-headline-5 text-midnight-ink">
                {active.title}
              </h2>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="px-8 py-6 sm:px-12 sm:py-8 lg:px-16">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                {active.content}
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-black/10 bg-white">
            <div className="flex flex-wrap items-center justify-end gap-3 px-8 py-4 sm:px-12 lg:px-16">
              <button
                type="button"
                onClick={goBack}
                className={`${UI_CLASS.btnSecondary} h-11 px-5`}
              >
                Cancel
              </button>
              {showSave ? (
                <button
                  type="button"
                  onClick={() => saveStep(active.id)}
                  className={`${UI_CLASS.btnPrimary} h-11 px-5`}
                >
                  Save
                </button>
              ) : null}
            </div>
          </footer>
        </div>
      ) : null}
    </>
  );
}
