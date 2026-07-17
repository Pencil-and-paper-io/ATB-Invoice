"use client";

import { useRouter } from "next/navigation";

/** Browser-history back for moving between draft / preview / sent while iterating. */
export function ModeBackButton({
  label,
  fallbackHref,
}: {
  label: string;
  fallbackHref: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="inline-flex items-center gap-2 text-sm font-semibold text-midnight-ink transition hover:text-prime-blue"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M10 3 5 8l5 5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
