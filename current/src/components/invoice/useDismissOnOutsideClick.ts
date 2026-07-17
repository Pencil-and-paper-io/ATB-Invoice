"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Dismiss an open editor when the user clicks outside the given element. */
export function useDismissOnOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled = true,
) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target || !ref.current) return;
      if (ref.current.contains(target)) return;
      onDismissRef.current();
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ref, enabled]);
}
