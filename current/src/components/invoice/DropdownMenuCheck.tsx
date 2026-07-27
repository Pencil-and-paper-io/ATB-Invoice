/** Fixed-width check slot so menu labels stay left-aligned whether selected or not. */
export function DropdownMenuCheck({ selected }: { selected: boolean }) {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
      aria-hidden
    >
      {selected ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="m2.5 8.5 3.5 3.5 7.5-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
