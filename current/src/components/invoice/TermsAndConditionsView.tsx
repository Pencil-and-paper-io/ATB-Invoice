"use client";

import { useEffect, useRef, useState } from "react";
import { UI_CLASS } from "@/lib/design-tokens";
import { Modal } from "@/components/invoice/ui";

export const TERMS_ACCEPTED_KEY = "atb-invoicing-terms-accepted";

const TERMS_SECTIONS = [
  {
    title: "1. Introduction",
    body: "These Terms and Conditions govern your use of ATB Invoicing (the “Service”), including creating quotes and invoices, collecting payments, and managing customer records. By accepting these terms, you agree to use the Service in accordance with applicable law and these conditions.",
  },
  {
    title: "2. Eligibility and account",
    body: "You must be authorized to act for the business you set up in the Service. You are responsible for keeping account credentials secure and for activity that occurs under your organization. Provide accurate business, tax, and contact information and keep it up to date.",
  },
  {
    title: "3. Invoicing and payments",
    body: "The Service helps you prepare and send quotes and invoices and may support payment requests through available methods. You remain responsible for the accuracy of amounts, taxes, due dates, and customer details. Payment timing, fees, and deposit outcomes depend on the payment method and financial institution involved.",
  },
  {
    title: "4. Taxes and compliance",
    body: "You are solely responsible for determining, charging, remitting, and reporting applicable taxes, including GST/HST where required. ATB Invoicing does not provide tax, legal, or accounting advice. Confirm requirements with a qualified advisor or the Canada Revenue Agency.",
  },
  {
    title: "5. Acceptable use",
    body: "You agree not to use the Service for unlawful, fraudulent, or abusive purposes; to misrepresent your business identity; or to interfere with the Service or other users. We may suspend or limit access if we reasonably believe these terms have been violated.",
  },
  {
    title: "6. Data and privacy",
    body: "Business and customer information you enter is used to operate the Service for your organization. Handle personal information in line with applicable privacy laws. Review ATB’s privacy materials for how banking-related information may be processed in connection with the Service.",
  },
  {
    title: "7. Availability and changes",
    body: "We may update, suspend, or discontinue features of the Service. We may also update these Terms and Conditions from time to time. Continued use after updates constitutes acceptance of the revised terms where permitted by law.",
  },
  {
    title: "8. Limitation of liability",
    body: "To the fullest extent permitted by law, ATB and its affiliates are not liable for indirect, incidental, special, or consequential damages arising from your use of the Service, including lost profits, lost data, or business interruption. Your remedies are limited as set out in applicable agreements with ATB.",
  },
  {
    title: "9. Contact",
    body: "If you have questions about these Terms and Conditions or the Service, contact your ATB representative or support channel provided in the product.",
  },
] as const;

/** Terms modal overlaid on the dashboard. */
export function TermsAndConditionsView({
  onAccepted,
  onClose,
}: {
  onAccepted: () => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function checkScroll() {
      if (!el) return;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining <= 8) {
        setScrolledToEnd(true);
      }
    }

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const canAccept = scrolledToEnd && agreed;

  function accept() {
    if (!canAccept) return;
    try {
      window.localStorage.setItem(TERMS_ACCEPTED_KEY, "1");
    } catch {
      /* ignore */
    }
    onAccepted();
  }

  return (
    <Modal
      title="Terms and conditions"
      titleId="terms-title"
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      zClass="z-[180]"
      closeOnBackdrop={false}
      hideCancel
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-black/55 transition hover:text-black"
          >
            Close
          </button>
          <button
            type="button"
            onClick={accept}
            disabled={!canAccept}
            className={`${UI_CLASS.btnPrimary} h-11 px-6`}
          >
            Accept and continue
          </button>
        </div>
      }
    >
      <p className="type-body text-black/70">
        Please review the terms below. You must scroll to the end before you can
        accept and continue into the app.
      </p>

      <div
        ref={scrollRef}
        className="mt-5 max-h-[min(36vh,18rem)] overflow-y-auto rounded-[10px] border border-black/10 px-5 py-5"
        tabIndex={0}
        aria-label="ATB Invoicing Terms and Conditions"
      >
        <h3 className="type-headline-6 text-black">
          ATB Invoicing Terms and Conditions
        </h3>
        <div className="mt-4 flex flex-col gap-4">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title}>
              <h4 className="text-sm font-semibold text-black">
                {section.title}
              </h4>
              <p className="mt-1.5 text-sm leading-6 text-black/80">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-black/45">
        {scrolledToEnd
          ? "You can now accept the terms to continue."
          : "Scroll to the bottom of the document to enable acceptance."}
      </p>

      <label
        className={`mt-4 flex items-start gap-3 text-sm leading-5 ${
          scrolledToEnd
            ? "cursor-pointer text-black"
            : "cursor-not-allowed text-black/40"
        }`}
      >
        <input
          type="checkbox"
          checked={agreed}
          disabled={!scrolledToEnd}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-black/25 accent-prime-blue disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span>
          I have read and agree to the ATB Invoicing Terms and Conditions.
        </span>
      </label>
    </Modal>
  );
}
