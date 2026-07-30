"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { NotificationsPanel } from "./NotificationsPanel";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (path: string) =>
      path === "/dashboard" || path.startsWith("/dashboard/"),
  },
  {
    href: "/quotes",
    label: "Quotes",
    match: (path: string) =>
      path === "/quotes" ||
      path.startsWith("/quotes/") ||
      path.startsWith("/quote"),
  },
  {
    href: "/invoices",
    label: "Invoices",
    match: (path: string) =>
      path === "/invoices" ||
      path.startsWith("/invoices/") ||
      path === "/" ||
      path.startsWith("/sent") ||
      path.startsWith("/preview"),
  },
  {
    href: "/customers",
    label: "Customers",
    match: (path: string) =>
      path === "/customers" || path.startsWith("/customers/"),
  },
] as const;

const USER_DISPLAY_NAME = "meganne";

export function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileNavId = useId();
  const menuId = useId();
  const notificationsId = useId();

  useDismissOnOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);
  useDismissOnOutsideClick(
    notificationsRef,
    () => setNotificationsOpen(false),
    notificationsOpen,
  );
  useDismissOnOutsideClick(
    headerRef,
    () => setMobileNavOpen(false),
    mobileNavOpen,
  );

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  function closeOverlays() {
    setMenuOpen(false);
    setNotificationsOpen(false);
    setMobileNavOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-prime-blue text-white shadow-sm"
    >
      <div className="flex h-[60px] items-center gap-3 pl-4 pr-4 sm:gap-4 sm:pl-[30px] sm:pr-6 md:gap-8 md:pr-8">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2"
          onClick={closeOverlays}
        >
          <Image
            src="/brand/atb-logo.png"
            alt="ATB"
            width={52}
            height={36}
            className="h-9 w-auto"
            priority
          />
          <span className="type-headline-5 text-white-snow">Invoicing</span>
        </Link>

        <nav
          className="hidden h-full min-w-0 flex-1 items-stretch gap-8 overflow-x-auto md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center type-subtitle-1 text-white transition hover:text-white/90 ${
                  active
                    ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-white"
                    : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                setMenuOpen(false);
                setMobileNavOpen(false);
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
              aria-controls={notificationsId}
            >
              <BellIcon />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sunshine-yellow ring-2 ring-prime-blue" />
            </button>
            {notificationsOpen ? (
              <NotificationsPanel
                panelId={notificationsId}
                onClose={() => setNotificationsOpen(false)}
              />
            ) : null}
          </div>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setNotificationsOpen(false);
                setMobileNavOpen(false);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-2.5 text-white transition hover:bg-white/20 sm:px-3.5"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
            >
              <UserIcon />
              <span className="hidden type-subtitle-1 sm:inline">
                {USER_DISPLAY_NAME}
              </span>
              <ChevronIcon open={menuOpen} />
            </button>

            {menuOpen ? (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
              >
                <Link
                  href="/organization"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left type-subtitle-1 text-midnight-ink transition hover:bg-black/[0.04]"
                >
                  <GearIcon />
                  Manage Organization
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left type-subtitle-1 text-midnight-ink transition hover:bg-black/[0.04]"
                >
                  <SignOutIcon />
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 md:hidden"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls={mobileNavId}
            onClick={() => {
              setMobileNavOpen((prev) => !prev);
              setMenuOpen(false);
              setNotificationsOpen(false);
            }}
          >
            {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileNavOpen ? (
        <nav
          id={mobileNavId}
          aria-label="Primary"
          className="border-t border-white/15 px-4 pb-3 pt-1 md:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const active = link.match(pathname);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-3 type-subtitle-1 transition hover:bg-white/10 ${
                      active ? "bg-white/15 text-white" : "text-white/90"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                    {active ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9.5a6 6 0 1 1 12 0c0 3.2.9 4.6 1.6 5.5.3.4 0 1-.5 1H4.9c-.5 0-.8-.6-.5-1 .7-.9 1.6-2.3 1.6-5.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M6.8 18.2a5.5 5.5 0 0 1 10.4 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="6"
      viewBox="0 0 11 6"
      fill="none"
      aria-hidden
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13.1c.05-.36.05-.74 0-1.1l1.7-1.3-1.8-3.1-2 .8c-.5-.38-1.05-.7-1.64-.93L15.2 4h-3.6l-.46 2.47c-.59.23-1.14.55-1.64.93l-2-.8-1.8 3.1 1.7 1.3c-.05.36-.05.74 0 1.1l-1.7 1.3 1.8 3.1 2-.8c.5.38 1.05.7 1.64.93L11.6 20h3.6l.46-2.47c.59-.23 1.14-.55 1.64-.93l2 .8 1.8-3.1-1.7-1.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 7V5.8A1.8 1.8 0 0 1 11.8 4h6.4A1.8 1.8 0 0 1 20 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8h-6.4A1.8 1.8 0 0 1 10 18.2V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 12H4m0 0 2.5-2.5M4 12l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
