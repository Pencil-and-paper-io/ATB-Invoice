"use client";

import type { FilterTag } from "@/lib/directory-filters";

export function DirectoryFilterTags({
  tags,
  onRemove,
  onClearAll,
  className = "mb-4",
}: {
  tags: FilterTag[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onRemove(tag.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-prime-blue/25 bg-prime-blue/8 py-1.5 pl-3 pr-2 text-xs font-semibold text-prime-blue transition hover:bg-prime-blue/15"
          aria-label={`Remove filter ${tag.label}`}
        >
          {tag.label}
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-prime-blue/80"
            aria-hidden
          >
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-xs font-semibold text-black/50 transition hover:text-midnight-ink hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

export function FilterIconButton({
  activeCount,
  onClick,
}: {
  activeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-black/15 bg-white text-midnight-ink transition hover:bg-black/[0.03]"
      aria-label={
        activeCount > 0 ? `Filters, ${activeCount} applied` : "Open filters"
      }
    >
      <FilterIcon />
      {activeCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-prime-blue px-1 text-[10px] font-bold text-white">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 3.5h12l-4.5 5.25V13l-3-1.5V8.75L2 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
