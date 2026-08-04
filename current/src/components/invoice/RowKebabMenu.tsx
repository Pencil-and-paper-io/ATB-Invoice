"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MenuAction } from "./MoreActionsMenu";

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
          className="absolute right-0 top-full z-50 mt-1 min-w-[220px] overflow-visible rounded-lg border border-black/10 bg-white py-1 shadow-lg"
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
              {action.sectionTitleBefore ? (
                <div className="px-4 pb-1 pt-2 text-xs font-semibold text-black/50">
                  {action.sectionTitleBefore}
                </div>
              ) : null}
              {action.submenu?.length ? (
                <div
                  className="relative"
                  onMouseEnter={() => openSubmenu(action.key)}
                  onMouseLeave={scheduleCloseSubmenu}
                >
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup="menu"
                    aria-expanded={openSubmenuKey === action.key}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-midnight-ink transition hover:bg-black/[0.04]"
                  >
                    <span>{action.label}</span>
                    <SubmenuChevron />
                  </button>
                  {openSubmenuKey === action.key ? (
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
                            sub.danger
                              ? "text-delete-red"
                              : "text-midnight-ink"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
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
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
