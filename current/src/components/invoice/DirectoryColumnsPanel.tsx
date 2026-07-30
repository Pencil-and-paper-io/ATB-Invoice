"use client";

import { useEffect, useId, useState } from "react";
import type { DirectoryColumnDef } from "./directory-table";
import { EditCloseButton } from "./ui";

export function DirectoryColumnsPanel<Id extends string>({
  open,
  onClose,
  columns,
  hiddenIds,
  onToggle,
  onMove,
}: {
  open: boolean;
  onClose: () => void;
  columns: DirectoryColumnDef<Id>[];
  hiddenIds: Id[];
  onToggle: (id: Id) => void;
  onMove: (fromId: Id, toId: Id) => void;
}) {
  const titleId = useId();
  const [draggingId, setDraggingId] = useState<Id | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close column settings"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-8 py-5">
          <h2 id={titleId} className="type-headline-5 text-midnight-ink">
            Column Settings
          </h2>
          <EditCloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <p className="mb-4 type-body-muted">
            Drag to reorder columns. Toggle to show or hide them in the table.
          </p>
          <ul className="flex flex-col gap-2">
            {columns.map((column) => {
              const visible = !hiddenIds.includes(column.id);
              const canHide = column.hideable !== false;
              return (
                <li
                  key={column.id}
                  draggable
                  onDragStart={() => setDraggingId(column.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId) onMove(draggingId, column.id);
                    setDraggingId(null);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`flex items-center gap-3 rounded-[10px] border border-black/10 bg-page-grey px-3 py-3 ${
                    draggingId === column.id ? "opacity-60" : ""
                  }`}
                >
                  <span
                    className="cursor-grab text-black/35 active:cursor-grabbing"
                    aria-hidden
                  >
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                      <circle cx="3.5" cy="3.5" r="1.25" fill="currentColor" />
                      <circle cx="8.5" cy="3.5" r="1.25" fill="currentColor" />
                      <circle cx="3.5" cy="8" r="1.25" fill="currentColor" />
                      <circle cx="8.5" cy="8" r="1.25" fill="currentColor" />
                      <circle cx="3.5" cy="12.5" r="1.25" fill="currentColor" />
                      <circle cx="8.5" cy="12.5" r="1.25" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold text-midnight-ink">
                    {column.label}
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-black/55">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-prime-blue"
                      checked={visible}
                      disabled={!canHide && visible}
                      onChange={() => onToggle(column.id)}
                      aria-label={`Show ${column.label}`}
                    />
                    Show
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-end border-t border-black/10 px-8 py-5">
          <button type="button" className="ui-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}
