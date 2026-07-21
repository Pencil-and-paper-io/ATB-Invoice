"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", match: (path: string) => path === "/dashboard" || path.startsWith("/dashboard/") },
  { href: "/invoices", label: "Invoices", match: (path: string) => path === "/invoices" || path.startsWith("/invoices/") },
  { href: "/customers", label: "Customers", match: (path: string) => path === "/customers" || path.startsWith("/customers/") },
  { href: "/payments", label: "Payments", match: (path: string) => path === "/payments" || path.startsWith("/payments/") },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center gap-12 bg-prime-blue pl-[30px] pr-8 text-white shadow-sm">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
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

      <nav className="flex h-full items-stretch gap-8" aria-label="Primary">
        {NAV_LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center type-subtitle-1 text-white transition hover:text-white/90 ${
                active ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-white" : ""
              }`}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
