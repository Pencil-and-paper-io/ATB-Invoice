"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MenuAction } from "./MoreActionsMenu";

export function RowKebabMenu({
  actions,
  onAction,
  label = "Row actions",
}: {
  actions: MenuAction[];
  onAction?: (key: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!actions.length) return null;

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-black/45 transition hover:bg-black/[0.06] hover:text-midnight-ink"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="3.5" r="1.35" fill="currentColor" />
          <circle cx="8" cy="8" r="1.35" fill="currentColor" />
          <circle cx="8" cy="12.5" r="1.35" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((action, index) => (
            <div key={action.key}>
              {action.dividerBefore && index > 0 ? (
                <div
                  className="my-1 border-t border-black/10"
                  role="separator"
                />
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onAction?.(action.key);
                  setOpen(false);
                }}
                className={`flex w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.04] ${
                  action.danger ? "text-delete-red" : "text-midnight-ink"
                }`}
              >
                {action.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
