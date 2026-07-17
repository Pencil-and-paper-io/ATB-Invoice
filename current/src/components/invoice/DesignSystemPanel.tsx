"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  COLOR_TOKENS,
  TYPE_TOKENS,
  UI_CLASS,
} from "@/lib/design-tokens";
import { CloseIcon } from "./ui";

/** Prototype-only design system browser — not part of the product UI. */
export function DesignSystemPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"type" | "color">("type");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-2"
      data-prototype-chrome="design-system"
    >
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Design system"
          className="max-h-[min(75vh,720px)] w-[min(92vw,420px)] overflow-auto rounded-xl border border-black/15 bg-white p-4 text-black shadow-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="type-headline-6">Design system</p>
              <p className="type-body-muted mt-0.5">
                ATB Library ·{" "}
                <code className="text-[11px]">globals.css</code>. Type styles
                inherit color so they work on any surface.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
              aria-label="Close design system"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mb-4 flex gap-1 rounded-lg bg-black/[0.04] p-1">
            {(
              [
                ["type", "Type"],
                ["color", "Color"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 rounded-md px-3 py-2 type-button transition ${
                  tab === id
                    ? "bg-white text-black shadow-sm"
                    : "text-black/55 hover:text-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "type" ? (
            <ul className="flex flex-col gap-4">
              {TYPE_TOKENS.map((token) => (
                <li
                  key={token.id}
                  className="rounded-lg border border-black/10 p-3"
                >
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className="type-caption uppercase tracking-wide">
                      {token.label}
                    </p>
                    <code className="text-[10px] text-black/40">
                      .{token.className}
                    </code>
                  </div>
                  <p className={token.className}>{token.sample}</p>
                  <p className="type-body-muted mt-2">{token.recipe}</p>
                  <p className="mt-1 text-[11px] text-black/40">{token.usage}</p>
                </li>
              ))}

              <li className="rounded-lg border border-dashed border-black/15 bg-page-grey p-3">
                <p className="type-caption mb-2 uppercase tracking-wide">
                  Shared UI classes
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    className={UI_CLASS.input}
                    readOnly
                    value="ui-input"
                    aria-label="Input sample"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={UI_CLASS.btnPrimary}>
                      ui-btn-primary
                    </button>
                    <button type="button" className={UI_CLASS.btnSecondary}>
                      ui-btn-secondary
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {COLOR_TOKENS.map((token) => (
                <li
                  key={token.id}
                  className="overflow-hidden rounded-lg border border-black/10"
                >
                  <div className={`h-14 ${token.swatchClass}`} />
                  <div className="p-2.5">
                    <p className="type-button text-xs">{token.label}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-black/55">
                      {token.hex}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-black/40">
                      {token.cssVar}
                    </p>
                    <p className="type-body-muted mt-1.5 text-xs leading-snug">
                      {token.usage}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 type-button text-midnight-ink shadow-lg transition hover:bg-black/[0.03]"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect
            x="2"
            y="2"
            width="5"
            height="5"
            rx="1"
            fill="currentColor"
            opacity="0.35"
          />
          <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
          <rect
            x="2"
            y="9"
            width="5"
            height="5"
            rx="1"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="9"
            y="9"
            width="5"
            height="5"
            rx="1"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
        Styles
      </button>
    </div>
  );
}
