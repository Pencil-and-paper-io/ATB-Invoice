"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  CORE_PAYMENT_METHODS,
  formatGstHstNumber,
  isValidGstHstNumber,
  loadOrganizationSettings,
  parseGstHstNumber,
  paymentMethodLabel,
  saveOrganizationSettings,
  type OrganizationSettings,
  type PaymentMethodId,
} from "@/lib/organization-settings";
import {
  DepositAccountBlock,
  paymentRequestSubtitle,
} from "./DepositAccountConnect";
import { GST_HST_ACCOUNT_SUFFIX } from "./GstHstNumberField";
import { type GstRegistrationStatus } from "@/lib/place-of-supply";
import { ONBOARDING_JUST_COMPLETED_KEY } from "@/components/invoice/OnboardingCompleteModal";
import {
  OnboardingWelcomeHero,
  ONBOARDING_SKIPPED_WELCOME_KEY,
} from "@/components/invoice/OnboardingWelcomeHero";
import { TermsAndConditionsView, TERMS_ACCEPTED_KEY } from "@/components/invoice/TermsAndConditionsView";
import { TopNav } from "@/components/invoice/TopNav";
import { EditCloseButton, InfoTooltip } from "@/components/invoice/ui";

const SETUP_STEPS = [
  {
    title: "Your Info",
    subtitle: "How do you want your contact info to appear as?",
  },
  {
    title: "Legal Name",
    subtitle: "Is this the name registered under the CRA?",
  },
  {
    title: "Display Name",
    subtitle: "What name do you want to use in your communications?",
  },
  {
    title: "Sales Tax",
    subtitle: "Do you have a GST/HST number?",
  },
  {
    title: "Payment Options",
    subtitle: "How would you like to receive your funds?",
  },
] as const;

/** Step header icons (Your Info, Legal Name, Display Name, Sales Tax, Payment Options). */
const STEP_ICONS = [
  "/onboard-icon-people.png",
  "/onboard-icon-join.png",
  "/onboard-icon-join.png",
  "/onboard-moments-icon.png",
  "/onboard-icon-connect.png",
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4;
type OnboardingPhase = "terms" | "welcome" | "wizard";

type PaymentTermsChoice = "receipt" | "7" | "15" | "30" | "custom";

type WizardState = {
  businessName: string;
  craFoundName: string;
  craNameIsCorrect: boolean;
  useLegalNameOnInvoices: boolean;
  tradingAsName: string;
  brandColor: string;
  logoDataUrl: string | null;
  contactName: string;
  replyToEmail: string;
  paymentEnabled: Record<PaymentMethodId, boolean>;
  paymentAccounts: Record<"interac" | "eft", string>;
  paymentAccountsSaved: Record<"interac" | "eft", boolean>;
  paymentTermsChoice: PaymentTermsChoice;
  customPaymentDays: string;
  quoteExpiryDays: string;
  gstRegistrationStatus: GstRegistrationStatus;
  gstHstNumber: string;
  quoteStartNumber: string;
  invoiceStartNumber: string;
};

const GST_WHEN_REGISTER_URL =
  "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html";

function ChoiceCheckIcon({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        selected
          ? "bg-sunshine-yellow text-midnight-ink"
          : "bg-black/[0.08] text-white"
      }`}
      aria-hidden
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.5 7.2L5.6 10.3L11.5 3.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function UnderlineField({
  id,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  onDark = false,
  active,
  inputMode,
  maxLength,
  suffix,
  onBlur,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
  onDark?: boolean;
  /** When true, auto-focus. When false, not tabbable (collapsed choice). Omit for always-enabled fields. */
  active?: boolean;
  inputMode?: "text" | "numeric" | "email";
  maxLength?: number;
  suffix?: string;
  onBlur?: () => void;
  type?: "text" | "email";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (active !== true) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <div
      className={`flex w-full items-end gap-2 border-b transition-colors duration-150 ${
        focused
          ? "border-sunshine-yellow"
          : onDark
            ? "border-white/35"
            : "border-black/25"
      }`}
    >
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={suffix ? `${id}-suffix` : undefined}
        tabIndex={active === false ? -1 : 0}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none ring-0 placeholder:font-normal caret-sunshine-yellow ${
          onDark
            ? "text-white placeholder:text-white/40"
            : "text-midnight-ink placeholder:text-black/35"
        }`}
      />
      {suffix ? (
        <span
          id={`${id}-suffix`}
          className={`shrink-0 pb-2 text-sm select-none ${
            onDark ? "text-white/45" : "text-black/40"
          }`}
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

function InfoFieldCard({
  htmlFor,
  label,
  tip,
  children,
}: {
  htmlFor: string;
  label: ReactNode;
  tip?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[4.5rem] flex-col justify-center rounded-[12px] bg-midnight-ink px-4 py-4 sm:min-h-[5.5rem] sm:px-6 sm:py-6">
      <div className="mb-2 flex items-center gap-1.5 sm:mb-3">
        <label htmlFor={htmlFor} className="type-headline-6 text-white">
          {label}
        </label>
        {tip ? <InfoTooltip text={tip} onDark /> : null}
      </div>
      {children}
    </div>
  );
}

function ChoiceCard({
  name,
  checked,
  onChange,
  title,
  description,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  const hasExpand = children != null && children !== false;

  return (
    <div
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onChange();
        }
      }}
      className={`flex h-full min-w-0 flex-1 cursor-pointer flex-col rounded-[12px] px-4 transition sm:px-6 ${
        checked && hasExpand ? "py-5 sm:py-[30px]" : "py-4 sm:py-8"
      } ${
        checked ? "bg-midnight-ink" : "bg-page-grey hover:bg-black/[0.06]"
      }`}
    >
      <div className="flex min-h-0 flex-1 items-center">
        <div className="flex w-full items-center gap-3 text-left sm:gap-4">
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={checked}
            onChange={onChange}
            tabIndex={-1}
            aria-hidden
          />
          <ChoiceCheckIcon selected={checked} />
          <span className="min-w-0 flex-1">
            <span
              className={`block type-headline-6 ${
                checked ? "text-white" : "text-midnight-ink"
              }`}
            >
              {title}
            </span>
            {description ? (
              <span
                className={`mt-1 block text-sm font-normal leading-5 ${
                  checked ? "text-white/90" : "text-black/55"
                }`}
              >
                {description}
              </span>
            ) : null}
          </span>
        </div>
      </div>
      {hasExpand ? (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            checked ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`pl-12 pt-4 transition-opacity duration-300 ease-out ${
                checked
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              aria-hidden={!checked}
              onClick={(event) => event.stopPropagation()}
            >
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  subtitle,
  children,
  disabled = false,
  alwaysShowChildren = false,
  comingSoon = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  alwaysShowChildren?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] border px-4 py-3 ${
        comingSoon
          ? "border-black/10 bg-[#F3F3F3]"
          : disabled
            ? "border-black/10 bg-white opacity-60"
            : "border-black/10 bg-white"
      }`}
    >
      <label
        className={`flex items-start gap-3 ${
          disabled || comingSoon ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled || comingSoon}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-black/25 accent-prime-blue disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="min-w-0 flex-1">
          <span
            className={`inline-flex flex-wrap items-center gap-2 text-sm font-semibold ${
              comingSoon
                ? "text-black/55"
                : disabled
                  ? "text-black/40"
                  : "text-black"
            }`}
          >
            {label}
          </span>
          {subtitle ? (
            <span className="mt-1 block text-sm font-normal leading-5 text-black">
              {subtitle}
            </span>
          ) : null}
        </span>
      </label>
      {(alwaysShowChildren || checked) && children ? (
        <div className="mt-3 pl-7">{children}</div>
      ) : null}
    </div>
  );
}

function PaymentMethodDetails({
  details,
}: {
  details: readonly { label: string; text: string; italic?: boolean }[];
}) {
  if (!details.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-4 text-sm font-normal text-black/70">
      {details.map((detail) => (
        <li
          key={`${detail.label}-${detail.text}`}
          className={detail.italic ? "italic" : undefined}
        >
          {detail.label}: {detail.text}
        </li>
      ))}
    </ul>
  );
}

function DashedProgress({
  current,
  total,
  onDark = false,
}: {
  current: number;
  total: number;
  onDark?: boolean;
}) {
  return (
    <div
      className="flex gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              complete || active
                ? onDark
                  ? "bg-white"
                  : "bg-midnight-ink"
                : onDark
                  ? "bg-white/30"
                  : "bg-black/10"
            }`}
          />
        );
      })}
    </div>
  );
}

function settingsToWizard(settings: OrganizationSettings): WizardState {
  const terms = settings.paymentTerms.trim().toLowerCase();
  let paymentTermsChoice: PaymentTermsChoice = "30";
  let customPaymentDays = "";
  if (terms.includes("receipt") || terms === "upon receipt") {
    paymentTermsChoice = "receipt";
  } else if (terms.includes("7")) {
    paymentTermsChoice = "7";
  } else if (terms.includes("15")) {
    paymentTermsChoice = "15";
  } else if (terms.includes("30")) {
    paymentTermsChoice = "30";
  } else {
    const match = terms.match(/(\d+)/);
    if (match) {
      paymentTermsChoice = "custom";
      customPaymentDays = match[1] ?? "";
    }
  }

  const craFoundName = "Horlicks Beverage Corporation";
  return {
    businessName: craFoundName,
    craFoundName,
    craNameIsCorrect: true,
    useLegalNameOnInvoices: settings.useLegalNameOnInvoices !== false,
    tradingAsName: settings.tradingAsName || "",
    brandColor: settings.brandColor || "#FF7F30",
    logoDataUrl: settings.logoDataUrl,
    contactName: settings.contactName || "",
    replyToEmail: settings.email || "",
    paymentEnabled: {
      interac: true,
      eft: false,
      cash: false,
      cheque: false,
    },
    paymentAccounts: {
      interac: "",
      eft: "",
    },
    paymentAccountsSaved: {
      interac: false,
      eft: false,
    },
    paymentTermsChoice,
    customPaymentDays,
    quoteExpiryDays: settings.quoteExpiryDays || "30",
    gstRegistrationStatus: "small_supplier",
    gstHstNumber: "",
    quoteStartNumber: settings.quoteStartNumber || "QT-1001",
    invoiceStartNumber: settings.invoiceStartNumber || "INV-1001",
  };
}

function paymentTermsFromWizard(state: WizardState) {
  switch (state.paymentTermsChoice) {
    case "receipt":
      return "Upon receipt";
    case "7":
      return "Net 7";
    case "15":
      return "Net 15";
    case "30":
      return "Net 30";
    case "custom":
      return state.customPaymentDays.trim()
        ? `Net ${state.customPaymentDays.trim()}`
        : "Net 30";
  }
}

function persistWizard(
  state: WizardState,
  options: { completed?: boolean } = {},
) {
  const completed = options.completed ?? true;
  const current = loadOrganizationSettings();
  const paymentMethods = CORE_PAYMENT_METHODS.map((method) => {
    const enabled = state.paymentEnabled[method.id];
    const accountLabel =
      method.id === "interac" || method.id === "eft"
        ? state.paymentAccounts[method.id]
        : "";
    return {
      id: method.id,
      enabled,
      accountLabel,
    };
  });

  const paymentPreferences = paymentMethods
    .filter((method) => method.enabled)
    .map((method) => paymentMethodLabel(method.id));

  const next: OrganizationSettings = {
    ...current,
    businessName: state.businessName.trim() || current.businessName,
    useLegalNameOnInvoices: state.useLegalNameOnInvoices,
    tradingAsName: state.useLegalNameOnInvoices
      ? ""
      : state.tradingAsName.trim(),
    contactName: state.contactName.trim(),
    email: state.replyToEmail.trim() || current.email,
    brandColor: state.brandColor,
    logoDataUrl: state.logoDataUrl,
    paymentMethods,
    paymentPreferences,
    paymentTerms: paymentTermsFromWizard(state),
    quoteExpiryDays: state.quoteExpiryDays.replace(/[^\d]/g, "") || "30",
    taxStatus:
      state.gstRegistrationStatus === "small_supplier"
        ? "Tax-exempt"
        : "Taxable",
    gstRegistrationStatus: state.gstRegistrationStatus,
    gstHstNumber:
      state.gstRegistrationStatus === "registered"
        ? state.gstHstNumber.trim()
        : "",
    quoteStartNumber: state.quoteStartNumber.trim() || "QT-1001",
    invoiceStartNumber: state.invoiceStartNumber.trim() || "INV-1001",
    onboardingCompleted: completed ? true : current.onboardingCompleted,
  };

  saveOrganizationSettings(next);
}

export function OnboardingWizardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startWizard = searchParams.get("start") === "wizard";
  // Empty-state CTAs pass ?start=wizard — jump straight to Your Info (skip
  // terms + welcome). Seed phase/hydrated so the first paint isn't a flash.
  const [phase, setPhase] = useState<OnboardingPhase>(() =>
    startWizard ? "wizard" : "terms",
  );
  const [hydrated, setHydrated] = useState(() => startWizard);
  const [step, setStep] = useState<StepIndex>(0);
  const [finishing, setFinishing] = useState(false);
  const [showPaymentConfirmError, setShowPaymentConfirmError] = useState(false);
  const [gstHstShowError, setGstHstShowError] = useState(false);
  const [state, setState] = useState<WizardState>(() =>
    settingsToWizard(loadOrganizationSettings()),
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.setTimeout(() => {
      try {
        if (startWizard) {
          window.localStorage.setItem(TERMS_ACCEPTED_KEY, "1");
          setPhase("wizard");
        } else if (window.localStorage.getItem(TERMS_ACCEPTED_KEY) === "1") {
          setPhase("welcome");
        }
      } catch {
        if (startWizard) setPhase("wizard");
      }
      setState(settingsToWizard(loadOrganizationSettings()));
      setHydrated(true);
    }, 0);
  }, [startWizard]);

  useEffect(() => {
    if (phase !== "wizard" || finishing) return;
    const overlay = overlayRef.current;
    const vv = window.visualViewport;
    if (!overlay || !vv) return;

    const desktopMq = window.matchMedia("(min-width: 640px)");

    function syncToVisualViewport() {
      if (!overlay || !vv) return;
      if (desktopMq.matches) {
        overlay.style.top = "";
        overlay.style.height = "";
        return;
      }
      // Keep the sheet in the visible viewport so the footer stays above the keyboard.
      overlay.style.top = `${vv.offsetTop}px`;
      overlay.style.height = `${vv.height}px`;
    }

    syncToVisualViewport();
    vv.addEventListener("resize", syncToVisualViewport);
    vv.addEventListener("scroll", syncToVisualViewport);
    desktopMq.addEventListener("change", syncToVisualViewport);
    return () => {
      vv.removeEventListener("resize", syncToVisualViewport);
      vv.removeEventListener("scroll", syncToVisualViewport);
      desktopMq.removeEventListener("change", syncToVisualViewport);
      overlay.style.top = "";
      overlay.style.height = "";
    };
  }, [phase, finishing]);

  useEffect(() => {
    if (phase !== "wizard" || finishing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        persistWizard(state, { completed: false });
        router.push("/dashboard");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, finishing, state, router]);

  function patch(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  const lastStep = (SETUP_STEPS.length - 1) as StepIndex;

  const stepValid = useMemo(() => {
    if (step === 0) {
      return true;
    }
    if (step === 1) {
      return Boolean(state.businessName.trim());
    }
    if (step === 2) {
      if (!state.useLegalNameOnInvoices && !state.tradingAsName.trim()) {
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (
        state.gstRegistrationStatus === "registered" &&
        !isValidGstHstNumber(state.gstHstNumber)
      ) {
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (
        state.paymentEnabled.interac &&
        !state.paymentAccountsSaved.interac
      ) {
        return false;
      }
      if (state.paymentEnabled.eft && !state.paymentAccountsSaved.eft) {
        return false;
      }
      return true;
    }
    return true;
  }, [state, step]);

  function goNext() {
    if (step === lastStep) {
      const needsInteracConfirm =
        state.paymentEnabled.interac && !state.paymentAccountsSaved.interac;
      const needsEftConfirm =
        state.paymentEnabled.eft && !state.paymentAccountsSaved.eft;
      if (needsInteracConfirm || needsEftConfirm) {
        setShowPaymentConfirmError(true);
        return;
      }
      setShowPaymentConfirmError(false);
      if (finishing) return;
      persistWizard(state, { completed: true });
      setFinishing(true);
      try {
        window.sessionStorage.setItem(ONBOARDING_JUST_COMPLETED_KEY, "1");
      } catch {
        /* ignore */
      }
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 400);
      return;
    }
    if (step < lastStep && stepValid) {
      setStep((prev) => (prev + 1) as StepIndex);
    }
  }

  function goBack() {
    if (finishing) return;
    if (step > 0) {
      setStep((prev) => (prev - 1) as StepIndex);
    }
  }

  function onDoThisLater() {
    try {
      window.sessionStorage.setItem(ONBOARDING_SKIPPED_WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  }

  function closeFlow(options?: { saveWizard?: boolean; skippedWelcome?: boolean }) {
    if (options?.saveWizard) {
      persistWizard(state, { completed: false });
    }
    if (options?.skippedWelcome) {
      try {
        window.sessionStorage.setItem(ONBOARDING_SKIPPED_WELCOME_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    router.push("/dashboard");
  }

  const interacMeta = CORE_PAYMENT_METHODS.find(
    (method) => method.id === "interac",
  );
  const eftMeta = CORE_PAYMENT_METHODS.find((method) => method.id === "eft");
  const chequeMeta = CORE_PAYMENT_METHODS.find(
    (method) => method.id === "cheque",
  );
  const cashMeta = CORE_PAYMENT_METHODS.find((method) => method.id === "cash");
  const heading = SETUP_STEPS[step];
  const organizationDisplayName = state.useLegalNameOnInvoices
    ? state.businessName
    : state.tradingAsName.trim() || state.businessName;

  const dashboardShell = (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="type-headline-2 text-midnight-ink">Dashboard</h1>
        <p className="mt-4 text-base text-black/55">
          This page is a placeholder and is not built yet.
        </p>
      </main>
    </div>
  );

  if (!hydrated) {
    return dashboardShell;
  }

  if (phase === "terms") {
    return (
      <>
        {dashboardShell}
        <TermsAndConditionsView
          onAccepted={() => setPhase("welcome")}
          onClose={() => closeFlow()}
        />
      </>
    );
  }

  if (phase === "welcome") {
    return (
      <>
        {dashboardShell}
        <OnboardingWelcomeHero
          onStart={() => setPhase("wizard")}
          onLater={onDoThisLater}
          onClose={() => closeFlow({ skippedWelcome: true })}
        />
      </>
    );
  }

  if (finishing) {
    return (
      <>
        {dashboardShell}
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 px-4">
          <div
            role="status"
            aria-live="polite"
            className="relative z-10 flex flex-col items-center gap-4 rounded-xl border border-black/15 bg-white px-10 py-12 shadow-2xl"
          >
            <div
              className="h-10 w-10 animate-spin rounded-full border-[3px] border-black/10 border-t-prime-blue"
              aria-hidden
            />
            <p className="type-body text-black/70">Saving your setup…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {dashboardShell}
      <div
        ref={overlayRef}
        className="fixed inset-x-0 top-0 z-[180] flex h-[100dvh] flex-col bg-white sm:inset-0 sm:h-auto sm:items-center sm:justify-center sm:gap-5 sm:bg-black/35 sm:px-4 sm:py-6"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeFlow({ saveWizard: true });
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white sm:h-[min(760px,88vh)] sm:max-w-[960px] sm:flex-none sm:rounded-xl sm:border sm:border-black/15 sm:shadow-2xl"
        >
          <EditCloseButton
            onClick={() => closeFlow({ saveWizard: true })}
            className="absolute right-4 top-4 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70 sm:right-5 sm:top-5"
          />
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-[max(2.5rem,10%)] sm:px-16 sm:pb-8 sm:pt-12 ${
              step < 4 ? "sm:justify-center" : ""
            }`}
          >
            <div className="flex w-full shrink-0 flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STEP_ICONS[step]}
                alt=""
                className="mb-4 h-10 w-10 object-contain sm:mb-10 sm:h-16 sm:w-16"
              />
              <h3 id="onboarding-title" className="text-black">
                <span className="type-headline-4 sm:hidden">{heading.title}</span>
                <span className="type-headline-3 hidden sm:inline">
                  {heading.title}
                </span>
              </h3>
              {heading.subtitle ? (
                <p className="mt-2 max-w-xl text-black sm:mt-4">
                  <span className="type-headline-5 sm:hidden">
                    {heading.subtitle}
                  </span>
                  <span className="type-headline-4 hidden sm:inline">
                    {heading.subtitle}
                  </span>
                </p>
              ) : null}
            </div>

            <div
              className={`mx-auto mt-6 flex w-full flex-col gap-6 sm:mt-10 ${
                step === 0
                  ? "max-w-[504px]"
                  : step < 4
                    ? "max-w-[720px]"
                    : "max-w-[720px] flex-1"
              }`}
            >
            {step === 0 ? (
              <div className="flex flex-col gap-4">
                <InfoFieldCard
                  htmlFor="contact-name"
                  label="Contact Name"
                  tip="Shown as the sender on quote and invoice emails and texts (for example, “from Meganne at Horlicks Company”)."
                >
                  <UnderlineField
                    id="contact-name"
                    value={state.contactName}
                    onChange={(contactName) => patch({ contactName })}
                    placeholder="Who customers reply to"
                    aria-label="Contact name"
                    onDark
                  />
                </InfoFieldCard>
                <InfoFieldCard
                  htmlFor="reply-email"
                  label="Reply-To Email"
                  tip="Customer replies to your quotes and invoices go to this address."
                >
                  <UnderlineField
                    id="reply-email"
                    type="email"
                    value={state.replyToEmail}
                    onChange={(replyToEmail) => patch({ replyToEmail })}
                    placeholder="name@business.com"
                    aria-label="Reply-to email"
                    inputMode="email"
                    onDark
                  />
                </InfoFieldCard>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-6 sm:gap-10">
                <p className="mx-auto w-fit rounded-[10px] bg-page-grey px-4 py-3 text-center type-headline-6 text-black sm:px-6 sm:py-5">
                  {state.craFoundName || "—"}
                </p>
                <div
                  className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4"
                  role="radiogroup"
                  aria-label="CRA-registered legal name"
                >
                  <ChoiceCard
                    name="cra-name-correct"
                    checked={state.craNameIsCorrect}
                    onChange={() =>
                      patch({
                        craNameIsCorrect: true,
                        businessName: state.craFoundName,
                      })
                    }
                    title="Yes"
                  />
                  <ChoiceCard
                    name="cra-name-correct"
                    checked={!state.craNameIsCorrect}
                    onChange={() => patch({ craNameIsCorrect: false })}
                    title="No"
                  >
                    <UnderlineField
                      id="legal-business-name"
                      value={state.businessName}
                      onChange={(businessName) => patch({ businessName })}
                      placeholder="Legal business name"
                      aria-label="CRA-registered business name"
                      onDark
                      active={!state.craNameIsCorrect}
                    />
                    <p className="mt-2 text-sm leading-5 text-white/80">
                      Tip: This should match your business&apos;s exact Canada
                      Revenue Agency (CRA) registration.
                    </p>
                  </ChoiceCard>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div
                className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4"
                role="radiogroup"
                aria-label="Display name"
              >
                <ChoiceCard
                  name="display-name-toggle"
                  checked={state.useLegalNameOnInvoices}
                  onChange={() => patch({ useLegalNameOnInvoices: true })}
                  title={
                    <>
                      Use my legal business name,{" "}
                      {state.businessName.trim() || "—"}
                    </>
                  }
                />
                <ChoiceCard
                  name="display-name-toggle"
                  checked={!state.useLegalNameOnInvoices}
                  onChange={() => patch({ useLegalNameOnInvoices: false })}
                  title="Use a different name"
                >
                  <UnderlineField
                    id="display-as-name"
                    value={state.tradingAsName}
                    onChange={(tradingAsName) => patch({ tradingAsName })}
                    placeholder="Shown on invoice headers"
                    aria-label="Display name"
                    onDark
                    active={!state.useLegalNameOnInvoices}
                  />
                  <p className="mt-2 text-sm leading-5 text-white/75">
                    Tip: To keep you CRA compliant, we will still show a
                    footnote on your invoices automatically with your legal
                    business name.
                  </p>
                </ChoiceCard>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-4">
                <div
                  className="flex flex-col items-stretch gap-3 sm:flex-row sm:gap-4"
                  role="radiogroup"
                  aria-label="GST/HST registration"
                >
                  <ChoiceCard
                    name="gst-registration"
                    checked={state.gstRegistrationStatus !== "registered"}
                    onChange={() => {
                      setGstHstShowError(false);
                      patch({
                        gstRegistrationStatus: "small_supplier",
                        gstHstNumber: "",
                      });
                    }}
                    title="No, I do not"
                  />
                  <ChoiceCard
                    name="gst-registration"
                    checked={state.gstRegistrationStatus === "registered"}
                    onChange={() => {
                      setGstHstShowError(false);
                      patch({ gstRegistrationStatus: "registered" });
                    }}
                    title="Yes, I have a GST/HST number"
                  >
                    <UnderlineField
                      id="gst-hst-bn"
                      value={parseGstHstNumber(state.gstHstNumber).bn}
                      onChange={(nextBn) => {
                        setGstHstShowError(false);
                        const digits = nextBn
                          .replace(/[^\d]/g, "")
                          .slice(0, 9);
                        patch({
                          gstHstNumber: digits
                            ? formatGstHstNumber(
                                digits,
                                GST_HST_ACCOUNT_SUFFIX,
                              )
                            : "",
                        });
                      }}
                      onBlur={() => setGstHstShowError(true)}
                      placeholder="123456789"
                      aria-label="GST/HST business number, 9 digits"
                      onDark
                      active={state.gstRegistrationStatus === "registered"}
                      inputMode="numeric"
                      maxLength={9}
                      suffix={`RT${GST_HST_ACCOUNT_SUFFIX}`}
                    />
                    {gstHstShowError &&
                    !isValidGstHstNumber(state.gstHstNumber) ? (
                      <p className="type-danger mt-2">
                        Enter a valid 9-digit CRA business number.
                      </p>
                    ) : null}
                  </ChoiceCard>
                </div>
                <p className="text-sm leading-5 text-black/60">
                  Businesses with taxable revenue of over $30,000 may require a
                  GST/HST number. You can add this in later in your organization
                  settings. For more information, check the{" "}
                  <a
                    href={GST_WHEN_REGISTER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-prime-blue underline underline-offset-2"
                  >
                    CRA
                  </a>
                  .
                </p>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="flex flex-col gap-3">
                <CheckboxRow
                  checked={state.paymentEnabled.interac}
                  onChange={(checked) => {
                    setShowPaymentConfirmError(false);
                    patch({
                      paymentEnabled: {
                        ...state.paymentEnabled,
                        interac: checked,
                      },
                    });
                  }}
                  label="Interac e-Transfer Request"
                  subtitle={
                    state.paymentEnabled.interac
                      ? paymentRequestSubtitle(
                          organizationDisplayName,
                          state.replyToEmail,
                        )
                      : undefined
                  }
                >
                  {interacMeta ? (
                    <PaymentMethodDetails details={interacMeta.details} />
                  ) : null}
                  <DepositAccountBlock
                    ariaLabel="Interac deposit account"
                    value={state.paymentAccounts.interac}
                    onChange={(value) => {
                      setShowPaymentConfirmError(false);
                      patch({
                        paymentAccounts: {
                          ...state.paymentAccounts,
                          interac: value,
                        },
                        paymentAccountsSaved: {
                          ...state.paymentAccountsSaved,
                          interac: false,
                        },
                      });
                    }}
                    onSave={() => {
                      if (!state.paymentAccounts.interac.trim()) return;
                      setShowPaymentConfirmError(false);
                      patch({
                        paymentAccountsSaved: {
                          ...state.paymentAccountsSaved,
                          interac: true,
                        },
                      });
                    }}
                    saved={state.paymentAccountsSaved.interac}
                    errorMessage={
                      showPaymentConfirmError &&
                      state.paymentEnabled.interac &&
                      !state.paymentAccountsSaved.interac
                        ? "Select and confirm a payment destination to continue."
                        : undefined
                    }
                  />
                </CheckboxRow>

                <CheckboxRow
                  checked={state.paymentEnabled.eft}
                  onChange={(checked) => {
                    setShowPaymentConfirmError(false);
                    patch({
                      paymentEnabled: {
                        ...state.paymentEnabled,
                        eft: checked,
                      },
                    });
                  }}
                  label="EFT (Direct Deposit)"
                  subtitle={
                    state.paymentEnabled.eft
                      ? paymentRequestSubtitle(
                          organizationDisplayName,
                          state.replyToEmail,
                        )
                      : undefined
                  }
                >
                  {eftMeta ? (
                    <PaymentMethodDetails details={eftMeta.details} />
                  ) : null}
                  <DepositAccountBlock
                    ariaLabel="EFT deposit account"
                    value={state.paymentAccounts.eft}
                    onChange={(value) => {
                      setShowPaymentConfirmError(false);
                      patch({
                        paymentAccounts: {
                          ...state.paymentAccounts,
                          eft: value,
                        },
                        paymentAccountsSaved: {
                          ...state.paymentAccountsSaved,
                          eft: false,
                        },
                      });
                    }}
                    onSave={() => {
                      if (!state.paymentAccounts.eft.trim()) return;
                      setShowPaymentConfirmError(false);
                      patch({
                        paymentAccountsSaved: {
                          ...state.paymentAccountsSaved,
                          eft: true,
                        },
                      });
                    }}
                    saved={state.paymentAccountsSaved.eft}
                    errorMessage={
                      showPaymentConfirmError &&
                      state.paymentEnabled.eft &&
                      !state.paymentAccountsSaved.eft
                        ? "Select and confirm a payment destination to continue."
                        : undefined
                    }
                  />
                </CheckboxRow>

                <CheckboxRow
                  checked={state.paymentEnabled.cheque}
                  onChange={(checked) =>
                    patch({
                      paymentEnabled: {
                        ...state.paymentEnabled,
                        cheque: checked,
                      },
                    })
                  }
                  label="Cheque"
                >
                  {chequeMeta ? (
                    <PaymentMethodDetails details={chequeMeta.details} />
                  ) : null}
                </CheckboxRow>

                <CheckboxRow
                  checked={state.paymentEnabled.cash}
                  onChange={(checked) =>
                    patch({
                      paymentEnabled: {
                        ...state.paymentEnabled,
                        cash: checked,
                      },
                    })
                  }
                  label="Cash"
                >
                  {cashMeta ? (
                    <PaymentMethodDetails details={cashMeta.details} />
                  ) : null}
                </CheckboxRow>

                <CheckboxRow
                  checked={false}
                  onChange={() => undefined}
                  comingSoon
                  label={
                    <>
                      Credit Card
                      <span className="rounded-md bg-black/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black/45">
                        Coming Soon
                      </span>
                    </>
                  }
                />
              </div>
            ) : null}
            </div>
          </div>

          <div className="shrink-0 px-5 pb-2 pt-1 sm:hidden">
            <DashedProgress
              current={step}
              total={SETUP_STEPS.length}
              onDark={false}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-5 py-3 sm:px-16 sm:py-5">
            <button
              type="button"
              onClick={() => closeFlow({ saveWizard: true })}
              className={`${UI_CLASS.btnSecondary} h-11 px-5`}
            >
              Save and Close
            </button>
            <div className="flex items-center gap-4">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="type-link text-sm font-semibold text-black/55"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={goNext}
                disabled={!stepValid || finishing}
                className={`${UI_CLASS.btnPrimary} h-11 px-6 disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {step === lastStep ? "Finish setup" : "Continue"}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden w-full max-w-[960px] px-2 sm:block">
          <DashedProgress current={step} total={SETUP_STEPS.length} onDark />
        </div>
      </div>
    </>
  );
}
