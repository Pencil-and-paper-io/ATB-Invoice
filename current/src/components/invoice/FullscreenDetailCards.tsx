"use client";

import { useEffect, useState, type ReactNode } from "react";
import { UI_CLASS } from "@/lib/design-tokens";

export type FullscreenDetailCard = {
  id: string;
  title: string;
  summary: ReactNode;
  content: ReactNode;
  summaryLayout?: "line" | "block";
  /** When false, hide Save and label the dismiss action Close. */
  canSave?: boolean;
  saveLabel?: string;
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

/**
 * Compact list cards that open a full-screen detail sheet
 * (same interaction pattern as draft composer steps).
 */
export function FullscreenDetailCards({
  cards,
  listLabel = "Details",
  onActiveChange,
}: {
  cards: FullscreenDetailCard[];
  listLabel?: string;
  onActiveChange?: (active: boolean) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  const active = cards.find((card) => card.id === activeId) ?? null;
  const showSave = active != null && active.canSave !== false;

  useEffect(() => {
    onActiveChange?.(activeId != null);
  }, [activeId, onActiveChange]);

  useEffect(() => {
    if (!activeId) {
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
  }, [activeId]);

  function goBack() {
    setActiveId(null);
  }

  function saveCard() {
    if (!active) return;
    active.onBeforeSave?.();
    setActiveId(null);
  }

  return (
    <>
      <div
        className="flex flex-col gap-2.5"
        aria-label={listLabel}
        hidden={active != null}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveId(card.id)}
            className="flex w-full items-start gap-3 rounded-[10px] border border-black/10 bg-white px-5 py-4 text-left transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue sm:px-[30px] sm:py-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block type-headline-5 text-midnight-ink">
                {card.title}
              </span>
              {card.summaryLayout === "block" ? (
                <div className="min-w-0">{card.summary}</div>
              ) : (
                <span className="mt-1 block truncate type-paragraph-2 text-black/55">
                  {card.summary}
                </span>
              )}
            </span>
            <ChevronRightIcon />
          </button>
        ))}
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
                {showSave ? "Cancel" : "Close"}
              </button>
              {showSave ? (
                <button
                  type="button"
                  onClick={saveCard}
                  className={`${UI_CLASS.btnPrimary} h-11 px-5`}
                >
                  {active.saveLabel ?? "Save"}
                </button>
              ) : null}
            </div>
          </footer>
        </div>
      ) : null}
    </>
  );
}
