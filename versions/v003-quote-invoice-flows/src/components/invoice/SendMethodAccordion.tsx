"use client";

import { useState } from "react";

export type SendAccordionMethod = "email" | "text" | "link";

export type SendAccordionSection = {
  method: SendAccordionMethod;
  title: string;
  summary: string;
  available: boolean;
  children: React.ReactNode;
};

function CheckmarkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0 text-prime-blue"
    >
      <path
        d="m2.5 8.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`shrink-0 text-black/40 transition-transform ${expanded ? "rotate-180" : ""}`}
    >
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SendMethodAccordion({
  sections,
  selected,
  onSelect,
}: {
  sections: SendAccordionSection[];
  selected: SendAccordionMethod | null;
  onSelect: (method: SendAccordionMethod) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5" aria-label="Send methods">
      {sections.map((section) => {
        const expanded = selected === section.method;
        return (
          <div
            key={section.method}
            className={`overflow-hidden rounded-lg border transition ${
              !section.available
                ? "border-black/10 bg-black/[0.02] opacity-60"
                : expanded
                  ? "border-prime-blue"
                  : "border-black/15 bg-white"
            }`}
          >
            <button
              type="button"
              aria-expanded={expanded}
              disabled={!section.available}
              onClick={() => onSelect(section.method)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                section.available ? "hover:bg-black/[0.02]" : "cursor-not-allowed"
              }`}
            >
              {expanded ? <CheckmarkIcon /> : null}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-black">
                  {section.title}
                </span>
                <span className="mt-0.5 block text-sm text-black/60">
                  {section.summary}
                </span>
              </span>
              <ChevronIcon expanded={expanded} />
            </button>
            {expanded && section.available ? (
              <div className="border-t border-black/10 px-4 py-4">
                {section.children}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function SendButtonIcon({
  method,
}: {
  method: SendAccordionMethod;
}) {
  if (method === "email") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 6.5h16v11H4v-11Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="m4.5 7 7.5 6 7.5-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (method === "text") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 4h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4l-4 3v-3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="8.5"
        y="8.5"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 5.5v-1a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MessagePreview({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">
        Preview
      </p>
      <p className="rounded-lg bg-black/[0.03] px-3.5 py-3 text-sm leading-6 text-black/80">
        {children}
      </p>
    </div>
  );
}

export function useSendMethodSelection() {
  const [selected, setSelected] = useState<SendAccordionMethod | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  function selectMethod(method: SendAccordionMethod) {
    setSelected(method);
    setCopied(false);
  }

  return { selected, copied, sending, setCopied, setSending, selectMethod };
}
