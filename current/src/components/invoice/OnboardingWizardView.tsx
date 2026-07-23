"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  GST_HST_REGISTER_URL,
  GST_REGISTRATION_OPTIONS,
  type GstRegistrationStatus,
} from "@/lib/place-of-supply";
import { ONBOARDING_JUST_COMPLETED_KEY } from "@/components/invoice/OnboardingCompleteModal";
import {
  OnboardingWelcomeHero,
  ONBOARDING_SKIPPED_WELCOME_KEY,
} from "@/components/invoice/OnboardingWelcomeHero";
import { TermsAndConditionsView, TERMS_ACCEPTED_KEY } from "@/components/invoice/TermsAndConditionsView";
import { TopNav } from "@/components/invoice/TopNav";
import { EditCloseButton, PencilIcon } from "@/components/invoice/ui";

const SETUP_STEPS = [
  {
    title: "Your Info",
    subtitle: "How do you want your contact info to appear as?",
  },
  {
    title: "Display Name",
    subtitle: "Do you want to use this name in your communications?",
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

/** Step header icons (Your Info, Display Name, Sales Tax, Payment Options). */
const STEP_ICONS = [
  "/onboard-icon-people.png",
  "/onboard-icon-join.png",
  "/onboard-moments-icon.png",
  "/onboard-icon-connect.png",
] as const;

type StepIndex = 0 | 1 | 2 | 3;
type OnboardingPhase = "terms" | "welcome" | "wizard";

type PaymentTermsChoice = "receipt" | "7" | "15" | "30" | "custom";

type WizardState = {
  businessName: string;
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

const inputClass = UI_CLASS.input;

function FieldLabel({
  children,
  htmlFor,
  tip,
}: {
  children: ReactNode;
  htmlFor?: string;
  tip?: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="type-label">
        {children}
      </label>
      {tip ? (
        <span className="text-xs text-black/40" title={tip}>
          i
        </span>
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

  return {
    businessName: settings.businessName || "Horlicks Company",
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
    gstRegistrationStatus: settings.gstRegistrationStatus || "registered",
    gstHstNumber: settings.gstHstNumber || "",
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
  // Always start as "terms" so SSR and the first client paint match; then
  // sync from localStorage after mount to avoid hydration mismatches.
  const [phase, setPhase] = useState<OnboardingPhase>("terms");
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<StepIndex>(0);
  const [finishing, setFinishing] = useState(false);
  const [editingBusinessName, setEditingBusinessName] = useState(false);
  const [showPaymentConfirmError, setShowPaymentConfirmError] = useState(false);
  const [gstHstShowError, setGstHstShowError] = useState(false);
  const [state, setState] = useState<WizardState>(() =>
    settingsToWizard(loadOrganizationSettings()),
  );

  useEffect(() => {
    window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(TERMS_ACCEPTED_KEY) === "1") {
          setPhase("welcome");
        }
      } catch {
        /* keep terms */
      }
      setState(settingsToWizard(loadOrganizationSettings()));
      setHydrated(true);
    }, 0);
  }, []);

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

  const stepValid = useMemo(() => {
    if (step === 0) {
      return true;
    }
    if (step === 1) {
      if (!state.businessName.trim()) return false;
      if (!state.useLegalNameOnInvoices && !state.tradingAsName.trim()) {
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (
        state.gstRegistrationStatus === "registered" &&
        !isValidGstHstNumber(state.gstHstNumber)
      ) {
        return false;
      }
      return true;
    }
    if (step === 3) {
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
    if (step === 3) {
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
    if (step < 3 && stepValid) {
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
  const gstParts = parseGstHstNumber(state.gstHstNumber);
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
        className="fixed inset-0 z-[180] flex flex-col items-center justify-center gap-5 bg-black/35 px-4 py-6"
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
          className="relative flex h-[min(760px,88vh)] w-full max-w-[960px] flex-col overflow-hidden rounded-xl border border-black/15 bg-white shadow-2xl"
        >
          <EditCloseButton
            onClick={() => closeFlow({ saveWizard: true })}
            className="absolute right-5 top-5 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-10 pb-8 pt-10 sm:px-16 sm:pt-12">
            <div className="flex w-full shrink-0 flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STEP_ICONS[step]}
                alt=""
                className="mb-8 h-14 w-14 object-contain sm:mb-10 sm:h-16 sm:w-16"
              />
              <h3
                id="onboarding-title"
                className="type-headline-3 text-black"
              >
                {heading.title}
              </h3>
              {heading.subtitle ? (
                <p className="type-headline-4 mt-4 max-w-xl text-black">
                  {heading.subtitle}
                </p>
              ) : null}
            </div>

            <div className="mx-auto mt-10 flex w-full max-w-[560px] flex-1 flex-col gap-6">
            {step === 0 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <FieldLabel htmlFor="contact-name">Contact Name</FieldLabel>
                  <input
                    id="contact-name"
                    className={inputClass}
                    value={state.contactName}
                    onChange={(event) =>
                      patch({ contactName: event.target.value })
                    }
                    placeholder="Who customers reply to"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="reply-email">Reply-To Email</FieldLabel>
                  <input
                    id="reply-email"
                    type="email"
                    className={inputClass}
                    value={state.replyToEmail}
                    onChange={(event) =>
                      patch({ replyToEmail: event.target.value })
                    }
                    placeholder="name@business.com"
                  />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <p className="type-body text-black">
                  We found the name registered under Canada Revenue Agency as
                </p>
                {editingBusinessName ? (
                  <div className="flex flex-col gap-2">
                    <input
                      id="business-name"
                      className={inputClass}
                      value={state.businessName}
                      onChange={(event) =>
                        patch({ businessName: event.target.value })
                      }
                      onBlur={() => {
                        if (state.businessName.trim()) {
                          setEditingBusinessName(false);
                        }
                      }}
                      autoFocus
                      aria-label="CRA-registered business name"
                    />
                    <p className="type-danger">
                      This must match your business&apos;s exact Canada Revenue
                      Agency (CRA) registration. Only change the pre-filled name
                      if it&apos;s incorrect.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingBusinessName(true)}
                    className="flex w-full items-center justify-between gap-3 rounded border border-black/20 bg-white px-3 py-2.5 text-left transition hover:border-prime-blue"
                    aria-label="Edit CRA-registered business name"
                  >
                    <span className="type-body font-semibold text-black/55">
                      {state.businessName || "—"}
                    </span>
                    <span className="shrink-0 text-black/35" aria-hidden>
                      <PencilIcon />
                    </span>
                  </button>
                )}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="legal-name-toggle"
                      checked={state.useLegalNameOnInvoices}
                      onChange={() =>
                        patch({ useLegalNameOnInvoices: true })
                      }
                    />
                    Yes, use my legal business name (default)
                  </label>
                  <div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="legal-name-toggle"
                        checked={!state.useLegalNameOnInvoices}
                        onChange={() =>
                          patch({ useLegalNameOnInvoices: false })
                        }
                      />
                      No, I want to use a different name
                    </label>
                    {!state.useLegalNameOnInvoices ? (
                      <div className="mt-1.5 pl-6">
                        <FieldLabel htmlFor="trading-as">
                          Trading As / Operating Name
                        </FieldLabel>
                        <input
                          id="trading-as"
                          className={inputClass}
                          value={state.tradingAsName}
                          onChange={(event) =>
                            patch({ tradingAsName: event.target.value })
                          }
                          placeholder="Shown on invoice headers"
                        />
                        <p className="type-body-muted mt-2">
                          Note: To keep you CRA compliant, we will still show a
                          footnote on your invoices automatically with your
                          legal business name.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-3">
                {GST_REGISTRATION_OPTIONS.map((option) => (
                  <div key={option.value}>
                    <label className="flex items-start gap-2 text-sm leading-5 text-black">
                      <input
                        type="radio"
                        name="gst-registration"
                        className="mt-0.5 accent-prime-blue"
                        checked={state.gstRegistrationStatus === option.value}
                        onChange={() => {
                          setGstHstShowError(false);
                          patch({
                            gstRegistrationStatus: option.value,
                            gstHstNumber:
                              option.value === "registered"
                                ? state.gstHstNumber
                                : "",
                          });
                        }}
                      />
                      <span className="inline-flex items-start gap-1.5">
                        <span>{option.label}</span>
                        {option.tip ? (
                          <span
                            className="mt-0.5 inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full bg-black/10 text-[10px] font-bold text-black/55"
                            title={option.tip}
                            aria-label={option.tip}
                          >
                            i
                          </span>
                        ) : null}
                      </span>
                    </label>
                    {option.value === "pending_number" &&
                    state.gstRegistrationStatus === "pending_number" ? (
                      <p className="mt-1.5 pl-6 text-sm leading-5 text-black">
                        You need a GST/HST number once you exceed $30,000 in
                        revenue.{" "}
                        <a
                          href={GST_HST_REGISTER_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-prime-blue underline underline-offset-2"
                        >
                          Register with the CRA
                        </a>
                        , then add this in later in your organization settings.
                      </p>
                    ) : null}
                    {option.value === "registered" &&
                    state.gstRegistrationStatus === "registered" ? (
                      <div className="mt-1.5 pl-6">
                        <div
                          className="flex flex-nowrap items-center gap-2"
                          onBlur={(event) => {
                            const next = event.relatedTarget as Node | null;
                            if (next && event.currentTarget.contains(next)) {
                              return;
                            }
                            setGstHstShowError(true);
                          }}
                        >
                          <input
                            id="gst-hst-bn"
                            inputMode="numeric"
                            maxLength={9}
                            className={`${inputClass} !w-[9.5rem] shrink-0`}
                            value={gstParts.bn}
                            onChange={(event) => {
                              const bn = event.target.value
                                .replace(/[^\d]/g, "")
                                .slice(0, 9);
                              setGstHstShowError(false);
                              patch({
                                gstHstNumber: formatGstHstNumber(
                                  bn,
                                  gstParts.account,
                                ),
                              });
                            }}
                            placeholder="123456789"
                            aria-label="GST/HST business number, 9 digits"
                          />
                          <span className="shrink-0 type-body text-black">
                            RT
                          </span>
                          <input
                            id="gst-hst-account"
                            inputMode="numeric"
                            maxLength={4}
                            className={`${inputClass} !w-[5.5rem] shrink-0`}
                            value={gstParts.account}
                            onChange={(event) => {
                              const account = event.target.value
                                .replace(/[^\d]/g, "")
                                .slice(0, 4);
                              setGstHstShowError(false);
                              patch({
                                gstHstNumber: formatGstHstNumber(
                                  gstParts.bn,
                                  account,
                                ),
                              });
                            }}
                            placeholder="0001"
                            aria-label="GST/HST account number, 4 digits"
                          />
                        </div>
                        {gstHstShowError &&
                        !isValidGstHstNumber(state.gstHstNumber) ? (
                          <p className="type-danger mt-2">
                            Enter a valid CRA number (9 digits + RT + 4 digits).
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {step === 3 ? (
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

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-10 py-5 sm:px-16">
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
                {step === 3 ? "Finish setup" : "Continue"}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[960px] px-2">
          <DashedProgress current={step} total={SETUP_STEPS.length} onDark />
        </div>
      </div>
    </>
  );
}
