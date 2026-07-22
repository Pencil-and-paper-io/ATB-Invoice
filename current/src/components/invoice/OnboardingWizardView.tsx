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
import { PencilIcon } from "@/components/invoice/ui";

const SETUP_STEPS = [
  {
    title: "Let's set up your business identity",
    subtitle: null,
  },
  {
    title: "Payment Options",
    subtitle: "Choose how you want to receive payments.",
  },
  {
    title: "Invoicing & Quotes",
    subtitle:
      "Set payment terms, quote validity, and starting document numbers.",
  },
  {
    title: "Branding",
    subtitle: "Add your logo and brand color.",
  },
] as const;

type StepIndex = 0 | 1 | 2 | 3;

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

function InvoiceBrandPreview({
  brandColor,
  logoDataUrl,
}: {
  brandColor: string;
  logoDataUrl: string | null;
}) {
  const color = /^#[0-9A-Fa-f]{6}$/i.test(brandColor) ? brandColor : "#FF7F30";

  return (
    <div
      className="w-full max-w-[180px] overflow-hidden rounded-md border border-black/10 bg-white shadow-sm"
      aria-hidden
    >
      <div className="h-2 w-full" style={{ backgroundColor: color }} />
      <div className="space-y-2.5 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-black/[0.04]">
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDataUrl}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="h-4 w-4 rounded-sm bg-black/15" />
            )}
          </div>
          <div className="flex flex-1 flex-col items-end gap-1 pt-0.5">
            <div className="h-1.5 w-10 rounded-sm bg-black/15" />
            <div className="h-1.5 w-14 rounded-sm bg-black/10" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-sm bg-black/10" />
          <div className="h-1.5 w-[80%] rounded-sm bg-black/10" />
          <div className="h-1.5 w-[60%] rounded-sm bg-black/10" />
        </div>
        <div className="space-y-1.5 border-t border-dashed border-black/10 pt-2">
          <div className="flex justify-between gap-2">
            <div className="h-1.5 w-12 rounded-sm bg-black/10" />
            <div className="h-1.5 w-8 rounded-sm bg-black/10" />
          </div>
          <div className="flex justify-between gap-2">
            <div className="h-1.5 w-16 rounded-sm bg-black/10" />
            <div className="h-1.5 w-6 rounded-sm bg-black/10" />
          </div>
          <div className="flex justify-between gap-2">
            <div className="h-1.5 w-10 rounded-sm bg-black/10" />
            <div className="h-1.5 w-10 rounded-sm bg-black/15" />
          </div>
        </div>
      </div>
      <div className="h-2 w-full" style={{ backgroundColor: color }} />
    </div>
  );
}

function ContentBox({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-black/10 bg-white px-6 py-5">
      <h3 className="type-headline-6 text-black">{title}</h3>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function DashedProgress({
  current,
  total,
}: {
  current: number;
  total: number;
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
                ? "bg-midnight-ink"
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

function persistWizard(state: WizardState) {
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
    businessName: state.businessName.trim(),
    useLegalNameOnInvoices: state.useLegalNameOnInvoices,
    tradingAsName: state.useLegalNameOnInvoices
      ? ""
      : state.tradingAsName.trim(),
    contactName: state.contactName.trim(),
    email: state.replyToEmail.trim(),
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
    onboardingCompleted: true,
  };

  saveOrganizationSettings(next);
}

function isPositiveDocNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/[^\d]/g, "");
  return Boolean(digits) && Number(digits) > 0;
}

export function OnboardingWizardView() {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);
  const [finishing, setFinishing] = useState(false);
  const [editingBusinessName, setEditingBusinessName] = useState(false);
  const [showPaymentConfirmError, setShowPaymentConfirmError] = useState(false);
  const [gstHstShowError, setGstHstShowError] = useState(false);
  const [state, setState] = useState<WizardState>(() =>
    settingsToWizard(loadOrganizationSettings()),
  );
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    window.setTimeout(() => {
      setState(settingsToWizard(loadOrganizationSettings()));
    }, 0);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function patch(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  const stepValid = useMemo(() => {
    if (step === 0) {
      if (!state.businessName.trim()) return false;
      if (!state.useLegalNameOnInvoices && !state.tradingAsName.trim()) {
        return false;
      }
      if (
        state.gstRegistrationStatus === "registered" &&
        !isValidGstHstNumber(state.gstHstNumber)
      ) {
        return false;
      }
      return true;
    }
    if (step === 1) {
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
    if (step === 2) {
      if (
        state.paymentTermsChoice === "custom" &&
        !state.customPaymentDays.trim()
      ) {
        return false;
      }
      if (!state.quoteExpiryDays.trim()) return false;
      return (
        isPositiveDocNumber(state.quoteStartNumber) &&
        isPositiveDocNumber(state.invoiceStartNumber)
      );
    }
    if (step === 3) {
      return true;
    }
    return true;
  }, [state, step]);

  function goNext() {
    if (step === 1) {
      const needsInteracConfirm =
        state.paymentEnabled.interac && !state.paymentAccountsSaved.interac;
      const needsEftConfirm =
        state.paymentEnabled.eft && !state.paymentAccountsSaved.eft;
      if (needsInteracConfirm || needsEftConfirm) {
        setShowPaymentConfirmError(true);
        return;
      }
      setShowPaymentConfirmError(false);
    }
    if (step === 3) {
      if (finishing) return;
      persistWizard(state);
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
    if (step > 0 && step < 4) {
      setStep((prev) => (prev - 1) as StepIndex);
    }
  }

  function onLogoFile(file: File | null) {
    setLogoError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
        file.type,
      )
    ) {
      setLogoError("Use a .png, .jpeg, or .webp file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Logo must be 5MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      patch({ logoDataUrl: result });
    };
    reader.readAsDataURL(file);
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

  if (finishing) {
    return (
      <div className="fixed inset-0 z-[180] flex items-center justify-center bg-prime-blue">
        <div className="absolute inset-0 bg-black/20" aria-hidden />
        <div
          role="status"
          aria-live="polite"
          className="relative z-10 flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-12 shadow-2xl"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-[3px] border-black/10 border-t-prime-blue"
            aria-hidden
          />
          <p className="type-body text-black/70">Saving your setup…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-prime-blue">
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative z-10 flex h-[96%] w-[96%] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
          <div className="flex w-full max-w-[800px] flex-1 flex-col px-6 pb-8 pt-0 sm:px-10">
            <div className="flex w-full shrink-0 justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/onboard-welcome.png"
                alt=""
                className="h-auto w-[80px] max-w-[20%] object-contain sm:w-[96px]"
              />
            </div>

            {step === 0 ? (
              <h2 className="type-headline-2 mt-6 mb-4 shrink-0 text-center text-black">
                Welcome to Invoicing
              </h2>
            ) : null}

            <div
              className={`shrink-0 text-center ${step === 0 ? "" : "mt-6"}`}
            >
              <h3
                id="onboarding-title"
                className="type-headline-3 text-black"
              >
                {heading.title}
              </h3>
              {heading.subtitle ? (
                <p className="type-headline-6 mt-3 text-black/55">
                  {heading.subtitle}
                </p>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-4">
            {step === 0 ? (
              <>
                <ContentBox title="Invoice Display Name">
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
                        Agency (CRA) registration. Only change the pre-filled
                        name if it&apos;s incorrect.
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
                  <p className="type-body text-black">
                    Do you want to use this name on the top of your invoices and
                    in your customer communications?
                  </p>
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
                </ContentBox>

                <ContentBox title="Contact Details">
                  <p className="type-body text-black">
                    How do you want your information to appear as?
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      />
                    </div>
                  </div>
                </ContentBox>

                <ContentBox title="Sales Tax">
                  <p className="type-body mb-3 text-black">
                    A GST/HST number is needed to charge tax on your invoices
                    once your business has earned $30,000 or more.
                  </p>
                  <div className="flex flex-col gap-3">
                    {GST_REGISTRATION_OPTIONS.map((option) => (
                      <div key={option.value}>
                        <label className="flex items-start gap-2 text-sm leading-5 text-black">
                          <input
                            type="radio"
                            name="gst-registration"
                            className="mt-0.5 accent-prime-blue"
                            checked={
                              state.gstRegistrationStatus === option.value
                            }
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
                          <span>{option.label}</span>
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
                            , then add this in later in your organization
                            settings.
                          </p>
                        ) : null}
                        {option.value === "registered" &&
                        state.gstRegistrationStatus === "registered" ? (
                          <div className="mt-1.5 pl-6">
                            <div
                              className="flex flex-nowrap items-center gap-2"
                              onBlur={(event) => {
                                const next = event.relatedTarget as Node | null;
                                if (
                                  next &&
                                  event.currentTarget.contains(next)
                                ) {
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
                                Enter a valid CRA number (9 digits + RT + 4
                                digits).
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </ContentBox>
              </>
            ) : null}

            {step === 1 ? (
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

            {step === 2 ? (
              <>
                <ContentBox title="Payment Terms">
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        ["receipt", "Due on receipt"],
                        ["7", "7 days"],
                        ["15", "15 days"],
                        ["30", "30 days"],
                        ["custom", "Custom"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="payment-terms"
                          checked={state.paymentTermsChoice === value}
                          onChange={() =>
                            patch({ paymentTermsChoice: value })
                          }
                        />
                        {label}
                        {value === "custom" ? (
                          <input
                            inputMode="numeric"
                            className={`${inputClass} ml-2 h-9 max-w-[100px]`}
                            placeholder="days"
                            value={state.customPaymentDays}
                            onChange={(event) =>
                              patch({
                                customPaymentDays: event.target.value.replace(
                                  /[^\d]/g,
                                  "",
                                ),
                                paymentTermsChoice: "custom",
                              })
                            }
                          />
                        ) : null}
                      </label>
                    ))}
                  </div>
                </ContentBox>

                <ContentBox title="Quote Validity">
                  <p className="type-body text-black">
                    How long do you want quotes to be valid before they expire?
                    You can always edit this later.
                  </p>
                  <div className="relative max-w-[200px]">
                    <input
                      id="quote-expiry"
                      inputMode="numeric"
                      className={`${inputClass} pr-14`}
                      value={state.quoteExpiryDays}
                      onChange={(event) =>
                        patch({
                          quoteExpiryDays: event.target.value.replace(
                            /[^\d]/g,
                            "",
                          ),
                        })
                      }
                      aria-label="Quote validity in days"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 type-body-muted">
                      days
                    </span>
                  </div>
                </ContentBox>

                <ContentBox title="Document Numbers">
                  <div>
                    <FieldLabel htmlFor="quote-start">
                      Starting Quote Number
                    </FieldLabel>
                    <input
                      id="quote-start"
                      className={inputClass}
                      value={state.quoteStartNumber}
                      onChange={(event) =>
                        patch({ quoteStartNumber: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="invoice-start">
                      Starting Invoice Number
                    </FieldLabel>
                    <input
                      id="invoice-start"
                      className={inputClass}
                      value={state.invoiceStartNumber}
                      onChange={(event) =>
                        patch({ invoiceStartNumber: event.target.value })
                      }
                    />
                  </div>
                  <p className="type-body-muted">
                    Numbers must be positive and non-zero. Defaults: QT-1001 and
                    INV-1001.
                  </p>
                </ContentBox>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <ContentBox title="Company Logo">
                  <p className="type-body-muted">
                    This logo will be visible on your invoice. Select a file that
                    is at least 250x250.
                  </p>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-black/20 bg-page-grey px-4 py-8 text-center transition hover:border-prime-blue">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        onLogoFile(event.target.files?.[0] ?? null)
                      }
                    />
                    {state.logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={state.logoDataUrl}
                        alt="Logo preview"
                        className="mb-3 max-h-16 object-contain"
                      />
                    ) : null}
                    <span className="text-sm font-semibold text-prime-blue">
                      Choose file / drag & drop
                    </span>
                    <span className="mt-1 text-xs text-black/45">
                      .png, .jpeg, or .webp · max 5MB
                    </span>
                  </label>
                  {logoError ? (
                    <p className="type-danger">{logoError}</p>
                  ) : null}
                </ContentBox>

                <ContentBox title="Brand Color">
                  <p className="type-body-muted">
                    This will be used to embellish your invoice.
                  </p>
                  <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={
                          /^#[0-9A-Fa-f]{6}$/i.test(state.brandColor)
                            ? state.brandColor
                            : "#FF7F30"
                        }
                        onChange={(event) =>
                          patch({ brandColor: event.target.value })
                        }
                        className="h-11 w-14 cursor-pointer rounded border border-black/15 bg-white p-1"
                        aria-label="Brand color picker"
                      />
                      <input
                        id="brand-color"
                        className={`${inputClass} max-w-[140px] font-mono uppercase`}
                        value={state.brandColor}
                        onChange={(event) =>
                          patch({ brandColor: event.target.value })
                        }
                      />
                    </div>
                    <InvoiceBrandPreview
                      brandColor={state.brandColor}
                      logoDataUrl={state.logoDataUrl}
                    />
                  </div>
                </ContentBox>
              </>
            ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-center border-t border-black/10 bg-white">
            <div className="flex w-full max-w-[800px] flex-col gap-4 px-6 py-4 sm:px-10">
              <DashedProgress current={step} total={SETUP_STEPS.length} />
              <div
                className={`flex items-center gap-3 ${
                  step === 0 ? "justify-end" : "justify-between"
                }`}
              >
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
                  disabled={step === 1 ? finishing : !stepValid || finishing}
                  className={`${UI_CLASS.btnPrimary} h-11 px-6 disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {step === 3 ? "Finish setup" : "Continue"}
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
