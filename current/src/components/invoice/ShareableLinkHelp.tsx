"use client";

export function ShareableLinkHelp({ mode }: { mode: "send" | "resend" }) {
  if (mode === "resend") {
    return (
      <p className="text-sm leading-6 text-black/70">
        Copy a link to share through your own messaging or alternative means.
        ATB will not send anything on your behalf.
      </p>
    );
  }

  return (
    <p className="text-sm leading-6 text-black/70">
      You can share this link through your own messaging or alternative means.
      ATB will not send anything on your behalf.
    </p>
  );
}
