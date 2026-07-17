"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "./ui";

type FlowNode = {
  id: string;
  label: string;
  href: string;
  description: string;
  children?: FlowNode[];
};

/** Prototype-only navigation — not part of the product UI. */
const FLOW_ROOTS: FlowNode[] = [
  {
    id: "quote-draft",
    label: "Draft Quote",
    href: "/quote",
    description: "Editable quote — no payment options",
    children: [
      {
        id: "quote-preview",
        label: "Preview Quote",
        href: "/quote/preview",
        description: "Customer-facing quote preview",
        children: [
          {
            id: "quote-sent",
            label: "Quote Sent",
            href: "/quote/sent",
            description: "Awaiting accept / reject",
            children: [
              {
                id: "quote-viewed",
                label: "Quote Viewed",
                href: "/quote/viewed",
                description: "Customer opened link or marked manually",
              },
              {
                id: "quote-rejected",
                label: "Quote Rejected",
                href: "/quote/rejected",
                description: "Customer declined",
              },
              {
                id: "quote-expired",
                label: "Quote Expired",
                href: "/quote/expired",
                description: "Past Valid Until (stub)",
              },
              {
                id: "quote-void",
                label: "Quote Void",
                href: "/quote/void",
                description: "Voided by owner",
              },
              {
                id: "invoice-draft",
                label: "Draft Invoice",
                href: "/?from=quote",
                description: "Created when a quote is accepted",
                children: [
                  {
                    id: "invoice-preview",
                    label: "Preview Invoice",
                    href: "/preview",
                    description: "Customer-facing invoice preview",
                    children: [
                      {
                        id: "invoice-sent",
                        label: "Invoice Sent · Due",
                        href: "/sent",
                        description: "Awaiting payment",
                        children: [
                          {
                            id: "invoice-viewed",
                            label: "Invoice Viewed",
                            href: "/sent/viewed",
                            description: "Opened or marked viewed",
                          },
                          {
                            id: "invoice-paid",
                            label: "Paid",
                            href: "/sent/paid",
                            description: "Payment recorded",
                          },
                          {
                            id: "invoice-overdue",
                            label: "Overdue",
                            href: "/sent/overdue",
                            description: "Under 90 days",
                          },
                          {
                            id: "invoice-overdue-90",
                            label: "Overdue 90+",
                            href: "/sent/overdue-90",
                            description: "Over 90 days",
                          },
                          {
                            id: "invoice-void",
                            label: "Void",
                            href: "/sent/void",
                            description: "Voided invoice",
                          },
                          {
                            id: "invoice-uncollectible",
                            label: "Uncollectible",
                            href: "/sent/uncollectible",
                            description: "Written off",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/" || href.startsWith("/?")) return pathname === "/";
  return pathname === href;
}

function isOnBranch(pathname: string, node: FlowNode): boolean {
  if (isActivePath(pathname, node.href)) return true;
  return (node.children ?? []).some((child) => isOnBranch(pathname, child));
}

function FlowBranch({
  node,
  pathname,
  depth = 0,
  onNavigate,
}: {
  node: FlowNode;
  pathname: string;
  depth?: number;
  onNavigate: () => void;
}) {
  const active = isActivePath(pathname, node.href);
  const onBranch = isOnBranch(pathname, node);
  const children = node.children ?? [];

  return (
    <li className="relative">
      {depth > 0 ? (
        <span
          className="absolute -left-4 top-5 h-px w-4 bg-black/20"
          aria-hidden
        />
      ) : null}

      <Link
        href={node.href}
        onClick={onNavigate}
        className={`block rounded-lg border px-3.5 py-3 transition ${
          active
            ? "border-prime-blue bg-prime-blue/5 ring-1 ring-prime-blue"
            : onBranch
              ? "border-black/20 bg-white hover:border-prime-blue"
              : "border-black/10 bg-white hover:border-black/25"
        }`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-black">{node.label}</span>
          {active ? (
            <span className="rounded bg-prime-blue px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Here
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-black/55">
          {node.description}
        </span>
      </Link>

      {children.length ? (
        <ul className="relative ml-2 mt-3 space-y-3 border-l border-black/15 pl-4">
          {children.map((child) => (
            <FlowBranch
              key={child.id}
              node={child}
              pathname={pathname}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function QuickLinks() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 left-5 z-[200] flex flex-col items-start gap-2"
      data-prototype-chrome="quick-links"
    >
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Prototype flow map"
          className="max-h-[min(75vh,640px)] w-[min(92vw,380px)] overflow-auto rounded-xl border border-black/15 bg-white p-4 text-black shadow-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-black">Prototype flow</p>
              <p className="mt-0.5 text-xs text-black/55">
                Not part of the product UI — jump between quote and invoice
                stages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
              aria-label="Close Quick Links"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mb-3 rounded-lg border border-dashed border-black/15 bg-[#FFF8E6] px-3 py-2 text-[11px] leading-4 text-black/70">
            Accepting a quote creates a draft invoice.{" "}
            <Link
              href="/status"
              onClick={() => setOpen(false)}
              className="font-semibold text-prime-blue underline"
            >
              View plan status
            </Link>{" "}
            for what is in vs deferred.
          </div>

          <ul className="space-y-3">
            {FLOW_ROOTS.map((node) => (
              <FlowBranch
                key={node.id}
                node={node}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-midnight-ink px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-black"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 4h4M3 8h10M3 12h7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <circle cx="13" cy="12" r="1.5" fill="currentColor" />
        </svg>
        Quick Links
      </button>
    </div>
  );
}
