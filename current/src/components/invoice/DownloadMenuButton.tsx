"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Secondary button with a Download PDF / Download CSV menu. */
export function DownloadMenuButton({
  onDownloadPdf,
  onDownloadCsv,
  align = "right",
}: {
  onDownloadPdf: () => void;
  onDownloadCsv: () => void;
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-stretch overflow-hidden rounded border border-midnight-ink text-sm font-semibold text-midnight-ink transition hover:bg-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="flex items-center px-5">Download</span>
        <span className="flex w-11 items-center justify-center border-l border-midnight-ink/15 bg-black/[0.03]">
          <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
            <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDownloadPdf();
              setOpen(false);
            }}
            className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-midnight-ink transition hover:bg-black/[0.04]"
          >
            Download PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDownloadCsv();
              setOpen(false);
            }}
            className="flex w-full px-4 py-2.5 text-left text-sm font-medium text-midnight-ink transition hover:bg-black/[0.04]"
          >
            Download CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}
