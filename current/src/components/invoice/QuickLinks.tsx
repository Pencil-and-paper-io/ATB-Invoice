"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CloseIcon } from "./ui";

type QuickLink = {
  id: string;
  label: string;
  href: string;
  description: string;
  /** Match query params for customer demo profiles, e.g. id=acme */
  matchId?: string | null;
  /** When true, active only if `empty=1` is on the URL. */
  matchEmpty?: boolean;
};

type QuickSection = {
  id: string;
  title: string;
  subtitle?: string;
  links: QuickLink[];
};

const SECTIONS: QuickSection[] = [
  {
    id: "directories",
    title: "Directories",
    subtitle: "Searchable lists",
    links: [
      {
        id: "dir-quotes",
        label: "Quotes",
        href: "/quotes",
        description: "Global quote list",
      },
      {
        id: "dir-invoices",
        label: "Invoices",
        href: "/invoices",
        description: "Global invoice list",
      },
      {
        id: "dir-customers",
        label: "Customers",
        href: "/customers",
        description: "Customer directory",
      },
      {
        id: "dir-dashboard",
        label: "Dashboard",
        href: "/dashboard",
        description: "Metrics overview",
      },
    ],
  },
  {
    id: "customer-view",
    title: "Customer view",
    subtitle: "What the customer sees",
    links: [
      {
        id: "customer-quote-review",
        label: "Quote · Review",
        href: "/quote/review",
        description: "Accept & Sign / Decline",
      },
      {
        id: "customer-quote-accepted",
        label: "Quote · Accepted",
        href: "/quote/review/accepted",
        description: "Post-accept confirmation",
      },
      {
        id: "customer-quote-declined",
        label: "Quote · Declined",
        href: "/quote/review/declined",
        description: "Post-decline confirmation",
      },
      {
        id: "customer-invoice-pay",
        label: "Invoice · Pay",
        href: "/invoice/review",
        description: "Sent invoice with payment options",
      },
    ],
  },
  {
    id: "quotes-owner",
    title: "Quotes · Owner",
    subtitle: "Business owner screens",
    links: [
      {
        id: "quote-draft",
        label: "Draft",
        href: "/quote",
        description: "Editable quote builder",
      },
      {
        id: "quote-preview",
        label: "Preview",
        href: "/quote/preview",
        description: "Before send",
      },
      {
        id: "quote-sent",
        label: "Sent",
        href: "/quote/sent",
        description: "Awaiting accept / reject",
      },
      {
        id: "quote-viewed",
        label: "Viewed",
        href: "/quote/viewed",
        description: "Opened or marked viewed",
      },
      {
        id: "quote-accepted",
        label: "Accepted",
        href: "/quote/accepted",
        description: "Creates draft invoice",
      },
      {
        id: "quote-rejected",
        label: "Rejected",
        href: "/quote/rejected",
        description: "Declined offline or by customer",
      },
      {
        id: "quote-expired",
        label: "Expired",
        href: "/quote/expired",
        description: "Past Valid Until",
      },
      {
        id: "quote-void",
        label: "Void",
        href: "/quote/void",
        description: "Voided by owner",
      },
    ],
  },
  {
    id: "invoices-owner",
    title: "Invoices · Owner",
    subtitle: "Business owner screens",
    links: [
      {
        id: "invoice-draft",
        label: "Draft (blank)",
        href: "/",
        description: "Standalone create",
      },
      {
        id: "invoice-draft-quote",
        label: "Draft (from quote)",
        href: "/?from=quote",
        description: "After quote accept",
      },
      {
        id: "invoice-preview",
        label: "Preview",
        href: "/preview",
        description: "Before send",
      },
      {
        id: "invoice-sent",
        label: "Sent · Due",
        href: "/sent",
        description: "Awaiting payment",
      },
      {
        id: "invoice-viewed",
        label: "Viewed",
        href: "/sent/viewed",
        description: "Opened or marked viewed",
      },
      {
        id: "invoice-paid",
        label: "Paid",
        href: "/sent/paid",
        description: "Full payment recorded",
      },
      {
        id: "invoice-partial",
        label: "Partially Paid",
        href: "/sent/partially-paid",
        description: "Balance still open",
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
        description: "Write-off candidate",
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
  {
    id: "setup",
    title: "Setup & profiles",
    subtitle: "Onboarding and demo customers",
    links: [
      {
        id: "onboarding",
        label: "Invoicing Onboarding",
        href: "/onboarding",
        description: "Wizard: brand, payments, tax, numbering",
      },
      {
        id: "organization",
        label: "Manage Organization",
        href: "/organization",
        description: "Business defaults",
      },
      {
        id: "customer-new",
        label: "New Customer",
        href: "/customers/new",
        description: "Create from scratch",
        matchId: null,
      },
      {
        id: "customer-cedar",
        label: "Customer · No docs",
        href: "/customers/new?id=cedar",
        description: "Cedar — can permanently delete",
        matchId: "cedar",
      },
      {
        id: "customer-beta",
        label: "Customer · Drafts only",
        href: "/customers/new?id=beta",
        description: "Beta — archive, cannot delete",
        matchId: "beta",
      },
      {
        id: "customer-acme",
        label: "Customer · Sent history",
        href: "/customers/new?id=acme",
        description: "Acme — archive for audit trail",
        matchId: "acme",
      },
    ],
  },
  {
    id: "empty-states",
    title: "Empty States",
    subtitle: "Pre-onboarding / nothing created yet",
    links: [
      {
        id: "empty-organization",
        label: "My Organization",
        href: "/organization?empty=1",
        description: "No onboarding — business details not supplied",
        matchEmpty: true,
      },
      {
        id: "empty-quotes",
        label: "Quotes",
        href: "/quotes?empty=1",
        description: "No quotes yet — setup not completed",
        matchEmpty: true,
      },
      {
        id: "empty-invoices",
        label: "Invoices",
        href: "/invoices?empty=1",
        description: "No invoices yet — setup not completed",
        matchEmpty: true,
      },
      {
        id: "empty-customers",
        label: "Customers",
        href: "/customers?empty=1",
        description: "No customers yet — setup not completed",
        matchEmpty: true,
      },
      {
        id: "empty-first-customer",
        label: "Create First Customer",
        href: "/customers/new?empty=1",
        description: "First customer while setup incomplete",
        matchEmpty: true,
      },
    ],
  },
];

function linkPath(href: string) {
  return href.split("?")[0] ?? href;
}

function isLinkActive(
  pathname: string,
  customerIdParam: string | null,
  fromParam: string | null,
  emptyParam: string | null,
  link: QuickLink,
) {
  const path = linkPath(link.href);
  const isEmpty = emptyParam === "1";

  if (link.matchId !== undefined) {
    if (pathname !== "/customers/new") return false;
    // Empty-state first-customer flow uses matchEmpty instead.
    if (isEmpty) return false;
    return customerIdParam === link.matchId;
  }
  if (link.matchEmpty) {
    return pathname === path && isEmpty;
  }
  if (link.href.startsWith("/?from=quote")) {
    return pathname === "/" && fromParam === "quote";
  }
  if (path === "/") {
    return pathname === "/" && fromParam !== "quote";
  }
  if (
    path === "/organization" ||
    path === "/quotes" ||
    path === "/invoices" ||
    path === "/customers"
  ) {
    return pathname === path && !isEmpty;
  }
  return pathname === path;
}

function sectionHasActive(
  section: QuickSection,
  pathname: string,
  customerIdParam: string | null,
  fromParam: string | null,
  emptyParam: string | null,
) {
  return section.links.some((link) =>
    isLinkActive(pathname, customerIdParam, fromParam, emptyParam, link),
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={`shrink-0 text-black/45 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4.25 6 7.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccordionSection({
  section,
  open,
  onToggle,
  pathname,
  customerIdParam,
  fromParam,
  emptyParam,
  onNavigate,
}: {
  section: QuickSection;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  customerIdParam: string | null;
  fromParam: string | null;
  emptyParam: string | null;
  onNavigate: () => void;
}) {
  const panelId = useId();
  const hasActive = sectionHasActive(
    section,
    pathname,
    customerIdParam,
    fromParam,
    emptyParam,
  );

  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        hasActive ? "border-prime-blue/40" : "border-black/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition ${
          open ? "bg-[#FAFAFA]" : "bg-white hover:bg-black/[0.02]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-midnight-ink">
              {section.title}
            </span>
            {hasActive ? (
              <span className="rounded bg-prime-blue px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Here
              </span>
            ) : null}
          </span>
          {section.subtitle ? (
            <span className="mt-0.5 block text-xs text-black/50">
              {section.subtitle}
            </span>
          ) : null}
        </div>
        <Chevron open={open} />
      </button>

      {open ? (
        <ul id={panelId} className="space-y-1 border-t border-black/8 bg-white p-2">
          {section.links.map((link) => {
            const active = isLinkActive(
              pathname,
              customerIdParam,
              fromParam,
              emptyParam,
              link,
            );
            return (
              <li key={link.id}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className={`block rounded-md px-3 py-2.5 transition ${
                    active
                      ? "bg-prime-blue/8 ring-1 ring-prime-blue"
                      : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-midnight-ink">
                      {link.label}
                    </span>
                    {active ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-prime-blue">
                        Here
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-black/50">
                    {link.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function QuickLinks() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get("id");
  const fromParam = searchParams.get("from");
  const emptyParam = searchParams.get("empty");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const activeSectionIds = useMemo(
    () =>
      SECTIONS.filter((section) =>
        sectionHasActive(
          section,
          pathname,
          customerIdParam,
          fromParam,
          emptyParam,
        ),
      ).map((section) => section.id),
    [pathname, customerIdParam, fromParam, emptyParam],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((section) => [section.id, false])),
  );

  useEffect(() => {
    if (!open) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const id of activeSectionIds) next[id] = true;
      return next;
    });
  }, [open, activeSectionIds]);

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

  function toggleSection(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div
      ref={rootRef}
      className="fixed bottom-24 left-5 z-[200] flex flex-col items-start gap-2 lg:bottom-5"
      data-prototype-chrome="quick-links"
    >
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Prototype quick links"
          className="max-h-[min(78vh,680px)] w-[min(92vw,360px)] overflow-auto rounded-xl border border-black/15 bg-white p-3.5 text-black shadow-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3 px-0.5">
            <div>
              <p className="text-sm font-semibold text-black">Quick Links</p>
              <p className="mt-0.5 text-xs text-black/55">
                Prototype only — jump by area. Expand a group to browse.
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

          <div className="space-y-2">
            {SECTIONS.map((section) => (
              <AccordionSection
                key={section.id}
                section={section}
                open={Boolean(expanded[section.id])}
                onToggle={() => toggleSection(section.id)}
                pathname={pathname}
                customerIdParam={customerIdParam}
                fromParam={fromParam}
                emptyParam={emptyParam}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
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
