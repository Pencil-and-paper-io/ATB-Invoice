"use client";

import Image from "next/image";

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15"
      aria-label="Navigation"
    >
      {children}
    </button>
  );
}

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between bg-prime-blue pl-[30px] text-white shadow-sm">
      <div className="flex items-center gap-2">
        <Image
          src="/brand/atb-logo.png"
          alt="ATB"
          width={52}
          height={36}
          className="h-9 w-auto"
          priority
        />
        <span className="font-display text-xl font-bold tracking-tight">
          Invoicing
        </span>
      </div>

      <div className="flex h-full items-center gap-6 pr-0">
        <div className="flex items-center gap-3">
          <NavIcon>
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden>
              <path
                d="M1 8.5h16M9 1v15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </NavIcon>
          <NavIcon>
            <svg width="19" height="20" viewBox="0 0 19 20" fill="none" aria-hidden>
              <path
                d="M9.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M9.5 6v4.5L12 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </NavIcon>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
            aria-label="Account"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="3.25" stroke="white" strokeWidth="1.6" />
              <path
                d="M5.5 18.5c1.6-2.7 3.8-4 6.5-4s4.9 1.3 6.5 4"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <button
          type="button"
          className="flex h-[60px] w-[60px] items-center justify-center bg-black/8"
          aria-label="App launcher"
        >
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
            <circle cx="2.5" cy="2.5" r="1.5" fill="white" />
            <circle cx="8.5" cy="2.5" r="1.5" fill="white" />
            <circle cx="14.5" cy="2.5" r="1.5" fill="white" />
            <circle cx="2.5" cy="8.5" r="1.5" fill="white" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
            <circle cx="14.5" cy="8.5" r="1.5" fill="white" />
            <circle cx="2.5" cy="14.5" r="1.5" fill="white" />
            <circle cx="8.5" cy="14.5" r="1.5" fill="white" />
            <circle cx="14.5" cy="14.5" r="1.5" fill="white" />
          </svg>
        </button>
      </div>
    </header>
  );
}
