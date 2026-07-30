"use client";

import { useEffect, useState } from "react";
import {
  formatLinkCountdown,
  SHAREABLE_LINK_TTL_SECONDS,
} from "@/lib/shareable-link";

function PreviousLinkCountdownCallout() {
  const [remainingSeconds, setRemainingSeconds] = useState(
    SHAREABLE_LINK_TTL_SECONDS,
  );

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(
        Math.max(0, SHAREABLE_LINK_TTL_SECONDS - elapsed),
      );
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-lg border border-sunshine-yellow/60 bg-sunshine-yellow/35 px-4 py-3.5 text-sm leading-5 text-midnight-ink"
      role="status"
    >
      Your previous link is still valid for{" "}
      <span className="font-semibold tabular-nums">
        {formatLinkCountdown(remainingSeconds)}
      </span>{" "}
      minutes. Copy a new link to revoke access to the old link. This new link
      will be valid for 15 minutes.
    </div>
  );
}

export function ShareableLinkHelp({ mode }: { mode: "send" | "resend" }) {
  if (mode === "resend") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-6 text-black/70">
          Copy a link to share through your own messaging or alternative means.
          ATB will not send anything on your behalf.
        </p>
        <PreviousLinkCountdownCallout />
      </div>
    );
  }

  return (
    <p className="text-sm leading-6 text-black/70">
      Once you copy this shareable link, it will be valid and accessible for 15
      minutes. You can share it through your own messaging or alternative means,
      ATB will not send anything on your behalf.
    </p>
  );
}
