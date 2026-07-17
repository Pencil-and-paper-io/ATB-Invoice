"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MenuAction = {
  key: string;
  label: string;
  danger?: boolean;
  dividerBefore?: boolean;
  sectionTitleBefore?: string;
};

export function MoreActionsMenu({
  actions,
  onAction,
  align = "right",
}: {
  actions: MenuAction[];
  onAction?: (key: string) => void;
  align?: "left" | "right";
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

  function renderItem(action: MenuAction) {
    return (
      <button
        key={action.key}
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
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-stretch overflow-hidden rounded border border-black text-sm font-semibold text-midnight-ink transition hover:bg-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="flex items-center px-5">More Actions</span>
        <span className="flex w-11 items-center justify-center bg-black/5">
          <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
            <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {actions.map((action, index) => (
            <div key={action.key}>
              {action.dividerBefore && index > 0 ? (
                <div
                  className="my-1 border-t border-black/10"
                  role="separator"
                />
              ) : null}
              {action.sectionTitleBefore ? (
                <div className="px-4 pb-1 pt-2 text-xs font-semibold text-black/50">
                  {action.sectionTitleBefore}
                </div>
              ) : null}
              {renderItem(action)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
