"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MenuAction = {
  key: string;
  label: string;
  danger?: boolean;
  dividerBefore?: boolean;
  sectionTitleBefore?: string;
  submenu?: { key: string; label: string; danger?: boolean }[];
};

function SubmenuChevron() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden>
      <path
        d="M1 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoreActionsMenu({
  actions,
  onAction,
  align = "right",
  placement = "bottom",
}: {
  actions: MenuAction[];
  onAction?: (key: string) => void;
  align?: "left" | "right";
  /** Where the menu opens relative to the button. Use "top" for fixed bottom bars. */
  placement?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [openSubmenuKey, setOpenSubmenuKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const closeSubmenuTimer = useRef<number | null>(null);

  function clearCloseSubmenuTimer() {
    if (closeSubmenuTimer.current != null) {
      window.clearTimeout(closeSubmenuTimer.current);
      closeSubmenuTimer.current = null;
    }
  }

  function openSubmenu(key: string) {
    clearCloseSubmenuTimer();
    setOpenSubmenuKey(key);
  }

  function scheduleCloseSubmenu() {
    clearCloseSubmenuTimer();
    closeSubmenuTimer.current = window.setTimeout(() => {
      setOpenSubmenuKey(null);
      closeSubmenuTimer.current = null;
    }, 120);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setOpenSubmenuKey(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setOpenSubmenuKey(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      clearCloseSubmenuTimer();
      setOpenSubmenuKey(null);
    }
  }, [open]);

  useEffect(() => () => clearCloseSubmenuTimer(), []);

  if (!actions.length) return null;

  function renderItem(action: MenuAction) {
    if (action.submenu?.length) {
      const submenuOpen = openSubmenuKey === action.key;
      return (
        <div
          key={action.key}
          className="relative"
          onMouseEnter={() => openSubmenu(action.key)}
          onMouseLeave={scheduleCloseSubmenu}
        >
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={submenuOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-midnight-ink transition hover:bg-black/[0.04]"
          >
            <span>{action.label}</span>
            <SubmenuChevron />
          </button>
          {submenuOpen ? (
            <div
              role="menu"
              className="absolute left-full top-0 z-[60] ml-1 min-w-[160px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg"
              onMouseEnter={() => openSubmenu(action.key)}
              onMouseLeave={scheduleCloseSubmenu}
            >
              {action.submenu.map((sub) => (
                <button
                  key={sub.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAction?.(sub.key);
                    setOpen(false);
                    setOpenSubmenuKey(null);
                  }}
                  className={`flex w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.04] ${
                    sub.danger ? "text-delete-red" : "text-midnight-ink"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <button
        key={action.key}
        type="button"
        role="menuitem"
        onClick={() => {
          onAction?.(action.key);
          setOpen(false);
        }}
        onMouseEnter={() => setOpenSubmenuKey(null)}
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
          <svg
            width="11"
            height="6"
            viewBox="0 0 11 6"
            fill="none"
            aria-hidden
            className={placement === "top" ? "rotate-180" : undefined}
          >
            <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute z-50 min-w-[220px] overflow-visible rounded-lg border border-black/10 bg-white py-1 shadow-lg ${
            placement === "top" ? "bottom-full mb-1" : "top-full mt-1"
          } ${align === "right" ? "right-0" : "left-0"}`}
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
