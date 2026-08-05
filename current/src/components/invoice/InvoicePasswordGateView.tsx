"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UI_CLASS } from "@/lib/design-tokens";
import { draftInvoice, previewMeta } from "@/lib/invoice-demo-data";
import {
  enableInvoicePassword,
  generateInvoicePassword,
  loadInvoicePasswordState,
  tryUnlockInvoice,
} from "@/lib/invoice-password";
import { CustomerInvoiceCard } from "./CustomerInvoiceCard";

/**
 * Customer-facing share link gate. Demo-only: no real auth.
 * Use ?setup=1 to seed a password if you open this URL cold.
 */
export function InvoicePasswordGateView({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [hintPassword, setHintPassword] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const setup = searchParams.get("setup") === "1";
    const forceUnlocked = searchParams.get("unlocked") === "1";
    let state = loadInvoicePasswordState();

    if (setup && !state.enabled) {
      const generated = generateInvoicePassword();
      enableInvoicePassword(generated);
      state = loadInvoicePasswordState();
      setHintPassword(generated);
    } else if (state.enabled && state.password) {
      // Review aid only — show expected password when seeded via setup.
      if (setup) setHintPassword(state.password);
    }

    if (!state.enabled || state.unlocked || forceUnlocked) {
      setUnlocked(true);
    }
    setReady(true);
  }, [searchParams]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (tryUnlockInvoice(password)) {
      setError(null);
      setUnlocked(true);
      return;
    }
    setError("That password doesn’t match. Try again.");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-grey text-sm text-black/50">
        Loading…
      </div>
    );
  }

  if (unlocked) {
    return (
      <div className="min-h-screen bg-page-grey text-black">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-[960px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                Shared invoice
              </p>
              <p className="type-headline-6 text-midnight-ink">
                {previewMeta.invoiceNumber} · {draftInvoice.customer.name}
              </p>
            </div>
            <Link
              href="/sent"
              className="text-sm font-semibold text-prime-blue transition hover:underline"
            >
              Back to sender view
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[960px] px-4 py-8 sm:px-8 sm:py-12">
          <CustomerInvoiceCard shadow="sent" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-grey px-4 py-12 text-black">
      <div className="w-full max-w-md rounded-[12px] border border-black/10 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
          {draftInvoice.business.name}
        </p>
        <h1 className="mt-2 type-headline-5 text-midnight-ink">
          Password required
        </h1>
        <p className="mt-2 text-sm leading-5 text-black/65">
          Enter the password shared by {draftInvoice.business.name} to view
          invoice {previewMeta.invoiceNumber}
          {invoiceId !== previewMeta.invoiceNumber.replace(/^#/, "")
            ? ` (${invoiceId})`
            : ""}
          .
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="unlock-password" className="type-label">
              Password
            </label>
            <input
              id="unlock-password"
              type="password"
              autoComplete="current-password"
              className={`${UI_CLASS.input} mt-1.5`}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
            />
            {error ? <p className="type-danger mt-1.5">{error}</p> : null}
          </div>
          <button type="submit" className={`${UI_CLASS.btnPrimary} h-11 w-full`}>
            View invoice
          </button>
        </form>

        {hintPassword ? (
          <p className="mt-5 rounded-md bg-black/[0.04] px-3 py-2 text-xs leading-4 text-black/55">
            Demo hint (review only): password is{" "}
            <span className="font-mono font-semibold text-midnight-ink">
              {hintPassword}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
