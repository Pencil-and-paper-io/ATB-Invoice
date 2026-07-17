"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { customers } from "@/lib/invoice-demo-data";
import { UI_CLASS } from "@/lib/design-tokens";
import { getCustomerCascadeDefaults, getEnabledPaymentMethodLabels, loadOrganizationSettings } from "@/lib/organization-settings";
import { ORGANIZATION_DEFAULTS } from "@/lib/org-defaults";
import { TopNav } from "./TopNav";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { EditCloseButton, InfoTooltip, PencilIcon, TertiaryButton, ContactBlock } from "./ui";

const CURRENCIES = [
  { code: "CAD", name: "Canadian Dollar" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
] as const;

const TAX_OPTIONS = ["Taxable", "Tax-exempt"] as const;

const PAYMENT_TERMS_OPTIONS = ["Net 30", "Net 15", "Upon receipt"] as const;

type SectionKey =
  | "business"
  | "contact"
  | "settings"
  | "paymentPreferences"
  | "automations"
  | "notes";

type CustomerFormState = {
  businessName: string;
  email: string;
  phone: string;
  currency: string;
  taxStatus: (typeof TAX_OPTIONS)[number];
  quoteExpiryDays: string;
  paymentTerms: string;
  paymentPreferences: string[];
  autoSend: boolean;
  reminders: boolean;
  reminderDays: string;
  receipts: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  shippingSame: boolean;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  useContactEmailForComms: boolean;
  internalNotes: string;
};

function emptyCustomerForm(
  cascade = ORGANIZATION_DEFAULTS,
): CustomerFormState {
  return {
    businessName: "",
    email: "",
    phone: "",
    currency: cascade.currency,
    taxStatus: cascade.taxStatus,
    quoteExpiryDays: cascade.quoteExpiryDays,
    paymentTerms: cascade.paymentTerms,
    paymentPreferences: [...cascade.paymentPreferences],
    autoSend: cascade.autoSend,
    reminders: cascade.reminders,
    reminderDays: cascade.reminderDays,
    receipts: cascade.receipts,
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    shippingSame: true,
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingProvince: "",
    shippingPostalCode: "",
    firstName: "",
    lastName: "",
    contactEmail: "",
    useContactEmailForComms: false,
    internalNotes: "",
  };
}

const inputClass = UI_CLASS.input;

const hoverCardClass = UI_CLASS.hoverCard;

const sectionShellClass = UI_CLASS.sectionShell;

/** Dashed divider between subsections inside edit cards */
const sectionDividerClass =
  "mt-6 border-t border-dashed border-black/15 pt-6";

function currencyLabel(code: string) {
  const match = CURRENCIES.find((entry) => entry.code === code);
  return match ? `${match.code} — ${match.name}` : code;
}

function formatAddress(parts: {
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
}) {
  const lines = [
    parts.line1,
    parts.line2,
    [parts.city, parts.province].filter(Boolean).join(", "),
    parts.postalCode,
  ].filter(Boolean);
  return lines.length ? lines : null;
}

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
      {tip ? <InfoTooltip text={tip} /> : null}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  children,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className={`flex items-start gap-2.5 text-sm text-black ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border ${
            disabled ? "opacity-40" : ""
          } ${
            checked
              ? "border-prime-blue bg-prime-blue text-white"
              : "border-black/25 bg-white"
          }`}
          aria-hidden
        >
          {checked ? (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path
                d="M1 5.2 4.2 8.5 11 1.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="text-black">{label}</span>
      </label>
      {checked && children ? (
        <div className="pl-7">{children}</div>
      ) : null}
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: readonly (string | { code: string; name: string })[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const normalized = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option.code, label: `${option.code} — ${option.name}` },
  );
  const selected =
    normalized.find((option) => option.value === value) ?? normalized[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className="truncate">{selected.label}</span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
          <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
        >
          {normalized.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-black/[0.04]"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center text-prime-blue">
                  {option.value === value ? (
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path
                        d="M1 5.2 4.8 8.8 13 1.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SectionHeader({ title, tip }: { title: string; tip?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <h2 className="type-headline-5">{title}</h2>
      {tip ? <InfoTooltip text={tip} /> : null}
    </div>
  );
}

function BoxTitle({
  title,
  tone = "view",
}: {
  title: string;
  tone?: "view" | "edit";
}) {
  return (
    <div className="mb-5 pr-8">
      <h3
        className={`type-subtitle-1 ${
          tone === "edit" ? "text-black" : "text-black/45"
        }`}
      >
        {title}
      </h3>
    </div>
  );
}

function ViewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={`relative w-full px-7 pb-5 pt-7 text-left ${hoverCardClass}`}
    >
      <BoxTitle title={title} tone="view" />
      <div className="pr-8">{children}</div>
      <span className="absolute right-4 top-4 text-black/30" aria-hidden>
        <PencilIcon />
      </span>
    </button>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function SectionEditor({
  title,
  onClose,
  onSave,
  saveDisabled = false,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(formRef, onClose);

  return (
    <div ref={formRef} className={`relative px-7 pb-5 pt-7 ${hoverCardClass}`}>
      <EditCloseButton onClick={onClose} />
      <BoxTitle title={title} tone="edit" />
      <div className="flex flex-col gap-6 pr-6">{children}</div>
      <div className="mt-6 border-t border-dashed border-black/15 pt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="type-danger transition hover:opacity-80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="ui-btn-primary h-9"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressFields({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    province: string;
    postalCode: string;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel htmlFor={`${idPrefix}-line1`}>Address Line 1</FieldLabel>
        <input
          id={`${idPrefix}-line1`}
          className={inputClass}
          value={values.addressLine1}
          onChange={(event) => onChange({ addressLine1: event.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-line2`}>Address Line 2</FieldLabel>
        <input
          id={`${idPrefix}-line2`}
          className={inputClass}
          value={values.addressLine2}
          onChange={(event) => onChange({ addressLine2: event.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-city`}>City</FieldLabel>
        <input
          id={`${idPrefix}-city`}
          className={inputClass}
          value={values.city}
          onChange={(event) => onChange({ city: event.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-province`}>Province</FieldLabel>
        <input
          id={`${idPrefix}-province`}
          className={inputClass}
          value={values.province}
          onChange={(event) => onChange({ province: event.target.value })}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`${idPrefix}-postal`}>Postal Code</FieldLabel>
        <input
          id={`${idPrefix}-postal`}
          className={inputClass}
          value={values.postalCode}
          onChange={(event) => onChange({ postalCode: event.target.value })}
        />
      </div>
    </div>
  );
}

function formFromCustomerId(id: string | null): CustomerFormState {
  const base = emptyCustomerForm(getCustomerCascadeDefaults());
  if (!id) return base;
  const customer = customers.find((entry) => entry.id === id);
  if (!customer) return base;

  const addressParts = customer.address.split(",");
  const line1 = addressParts[0]?.trim() ?? "";
  const cityPart = addressParts[1]?.trim() ?? "";
  const provincePostal = addressParts[2]?.trim() ?? "";
  const [province = "", ...postalRest] = provincePostal.split(/\s+/);
  const postalCode = postalRest.join(" ");

  return {
    ...base,
    businessName: customer.name,
    email: customer.email,
    phone: customer.phone,
    addressLine1: line1,
    city: cityPart,
    province,
    postalCode,
  };
}

function CustomerFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id");
  const isEdit = Boolean(customerId);

  const [saved, setSaved] = useState<CustomerFormState>(() =>
    formFromCustomerId(customerId),
  );
  const [editing, setEditing] = useState<SectionKey | null>(() =>
    customerId ? null : "business",
  );
  const [draft, setDraft] = useState<CustomerFormState>(saved);
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState<
    string[]
  >(() => [...ORGANIZATION_DEFAULTS.paymentPreferences]);

  useEffect(() => {
    const next = formFromCustomerId(customerId);
    window.setTimeout(() => {
      const org = loadOrganizationSettings();
      setAvailablePaymentOptions(getEnabledPaymentMethodLabels(org));
      setSaved(next);
      setDraft(next);
      setEditing(customerId ? null : "business");
    }, 0);
  }, [customerId]);

  function startEdit(section: SectionKey) {
    setDraft(saved);
    setEditing(section);
  }

  function closeEdit() {
    setDraft(saved);
    setEditing(null);
  }

  function saveSection() {
    setSaved(draft);
    setEditing(null);
  }

  function patchDraft(patch: Partial<CustomerFormState>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function togglePaymentPreference(option: string) {
    setDraft((prev) => {
      const exists = prev.paymentPreferences.includes(option);
      return {
        ...prev,
        paymentPreferences: exists
          ? prev.paymentPreferences.filter((item) => item !== option)
          : [...prev.paymentPreferences, option],
      };
    });
  }

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  function handleSaveCustomer() {
    if (editing) {
      setSaved(draft);
      setEditing(null);
    }
    goBack();
  }

  const businessEmpty =
    !saved.businessName &&
    !saved.email &&
    !saved.phone &&
    !saved.addressLine1 &&
    !saved.addressLine2 &&
    !saved.city &&
    !saved.province &&
    !saved.postalCode;
  const contactEmpty =
    !saved.firstName && !saved.lastName && !saved.contactEmail;
  const notesEmpty = !saved.internalNotes.trim();

  const billingAddress = formatAddress({
    line1: saved.addressLine1,
    line2: saved.addressLine2,
    city: saved.city,
    province: saved.province,
    postalCode: saved.postalCode,
  })?.join(", ");
  const shippingLines = formatAddress({
    line1: saved.shippingAddressLine1,
    line2: saved.shippingAddressLine2,
    city: saved.shippingCity,
    province: saved.shippingProvince,
    postalCode: saved.shippingPostalCode,
  });

  const enabledAutomations = [
    saved.autoSend ? "Auto-send invoices" : null,
    saved.reminders
      ? `Reminders (${saved.reminderDays || "—"} days before)`
      : null,
    saved.receipts ? "Auto-send receipts" : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[900px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="type-page-title">
            {isEdit ? "Edit Customer" : "New Customer"}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={goBack}
              className={UI_CLASS.btnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomer}
              className={UI_CLASS.btnPrimary}
            >
              Save
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Customer Details */}
          <section className={sectionShellClass}>
            <SectionHeader title="Customer Details" />
            {editing === "business" ? (
              <SectionEditor
                title="Business Details"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <div>
                  <FieldLabel
                    htmlFor="business-name"
                    tip="The official name of this customer’s business—the one they use on government paperwork and contracts."
                  >
                    Business Legal Name
                  </FieldLabel>
                  <input
                    id="business-name"
                    className={inputClass}
                    value={draft.businessName}
                    onChange={(event) =>
                      patchDraft({ businessName: event.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="email">Business Email</FieldLabel>
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    value={draft.email}
                    onChange={(event) =>
                      patchDraft({ email: event.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <input
                    id="phone"
                    type="tel"
                    className={inputClass}
                    value={draft.phone}
                    onChange={(event) =>
                      patchDraft({ phone: event.target.value })
                    }
                  />
                </div>

                <div className={sectionDividerClass}>
                  <p className="type-subtitle-1">Billing Address</p>
                  <p className="type-body-muted mt-1 mb-4">
                    Some loan applications ask for this address. Add it if you
                    have it.
                  </p>
                  <AddressFields
                    idPrefix="billing"
                    values={{
                      addressLine1: draft.addressLine1,
                      addressLine2: draft.addressLine2,
                      city: draft.city,
                      province: draft.province,
                      postalCode: draft.postalCode,
                    }}
                    onChange={(patch) => patchDraft(patch)}
                  />
                  <div className="mt-4">
                    <CheckboxRow
                      checked={draft.shippingSame}
                      onChange={(checked) =>
                        patchDraft({ shippingSame: checked })
                      }
                      label="Shipping address is the same"
                    />
                  </div>
                  {!draft.shippingSame ? (
                    <div
                      className={`flex flex-col gap-4 ${sectionDividerClass}`}
                    >
                      <h4 className="type-subtitle-1">Shipping Address</h4>
                      <AddressFields
                        idPrefix="shipping"
                        values={{
                          addressLine1: draft.shippingAddressLine1,
                          addressLine2: draft.shippingAddressLine2,
                          city: draft.shippingCity,
                          province: draft.shippingProvince,
                          postalCode: draft.shippingPostalCode,
                        }}
                        onChange={(patch) =>
                          patchDraft({
                            shippingAddressLine1:
                              patch.addressLine1 ?? draft.shippingAddressLine1,
                            shippingAddressLine2:
                              patch.addressLine2 ?? draft.shippingAddressLine2,
                            shippingCity: patch.city ?? draft.shippingCity,
                            shippingProvince:
                              patch.province ?? draft.shippingProvince,
                            shippingPostalCode:
                              patch.postalCode ?? draft.shippingPostalCode,
                          })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </SectionEditor>
            ) : businessEmpty ? (
              <TertiaryButton onClick={() => startEdit("business")}>
                Add Business Details
              </TertiaryButton>
            ) : (
              <ViewCard
                title="Business Details"
                onEdit={() => startEdit("business")}
              >
                <ContactBlock
                  name={saved.businessName || "Untitled business"}
                  address={billingAddress}
                  phone={saved.phone || undefined}
                  email={saved.email || undefined}
                  emailNote={
                    saved.useContactEmailForComms
                      ? "Communications will not be sent here and are sent to the contact address"
                      : undefined
                  }
                />
                {!saved.shippingSame ? (
                  <div className="mt-3">
                    <p className="type-caption mb-1 uppercase tracking-wide">
                      Shipping
                    </p>
                    {shippingLines?.map((line) => (
                      <p key={line} className="type-body">
                        {line}
                      </p>
                    )) ?? <p className="type-body-muted">Not set</p>}
                  </div>
                ) : null}
              </ViewCard>
            )}

            {editing === "contact" ? (
              <SectionEditor
                title="Contact Info"
                onClose={closeEdit}
                onSave={saveSection}
                saveDisabled={
                  draft.useContactEmailForComms &&
                  !isValidEmail(draft.contactEmail)
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                    <input
                      id="first-name"
                      className={inputClass}
                      value={draft.firstName}
                      onChange={(event) =>
                        patchDraft({ firstName: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                    <input
                      id="last-name"
                      className={inputClass}
                      value={draft.lastName}
                      onChange={(event) =>
                        patchDraft({ lastName: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="contact-email">Contact Email</FieldLabel>
                  <input
                    id="contact-email"
                    type="email"
                    className={inputClass}
                    value={draft.contactEmail}
                    onChange={(event) =>
                      patchDraft({ contactEmail: event.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <CheckboxRow
                    checked={draft.useContactEmailForComms}
                    onChange={(checked) =>
                      patchDraft({ useContactEmailForComms: checked })
                    }
                    label="Send quotes and invoices here instead of the business email"
                  />
                  {draft.useContactEmailForComms &&
                  !isValidEmail(draft.contactEmail) ? (
                    <p className="type-danger pl-7">
                      Enter a valid contact email to use this option.
                    </p>
                  ) : null}
                </div>
              </SectionEditor>
            ) : contactEmpty ? (
              <TertiaryButton onClick={() => startEdit("contact")}>
                Add Contact Info
              </TertiaryButton>
            ) : (
              <ViewCard
                title="Contact Info"
                onEdit={() => startEdit("contact")}
              >
                <div className="flex flex-col gap-1.5">
                  <p className="type-emphasis">
                    {[saved.firstName, saved.lastName]
                      .filter(Boolean)
                      .join(" ") || "Contact"}
                  </p>
                  {saved.contactEmail ? (
                    <div>
                      <p className="type-body">{saved.contactEmail}</p>
                      {saved.useContactEmailForComms ? (
                        <p className="type-body-muted mt-0.5">
                          Communication is sent to this address based on your
                          preferences.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </ViewCard>
            )}
          </section>

          {/* Default Settings */}
          <section className={sectionShellClass}>
            <SectionHeader
              title="Default Settings"
              tip="These start with your business defaults. Change them here only if this customer needs different rules."
            />

            {editing === "settings" ? (
              <SectionEditor
                title="Settings"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel tip="The money type used on this customer’s quotes and invoices (for example, Canadian dollars).">
                      Currency
                    </FieldLabel>
                    <SelectField
                      ariaLabel="Currency"
                      value={draft.currency}
                      options={CURRENCIES}
                      onChange={(value) => patchDraft({ currency: value })}
                    />
                  </div>
                  <div>
                    <FieldLabel tip="Whether you usually charge sales tax for this customer.">
                      Tax Setting
                    </FieldLabel>
                    <SelectField
                      ariaLabel="Tax status"
                      value={draft.taxStatus}
                      options={TAX_OPTIONS}
                      onChange={(value) =>
                        patchDraft({
                          taxStatus: value as CustomerFormState["taxStatus"],
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel
                      htmlFor="quote-expiry"
                      tip="How long a quote stays open for this customer before it expires."
                    >
                      Quote Expiry
                    </FieldLabel>
                    <div className="relative">
                      <input
                        id="quote-expiry"
                        inputMode="numeric"
                        className={`${inputClass} pr-14`}
                        value={draft.quoteExpiryDays}
                        onChange={(event) =>
                          patchDraft({
                            quoteExpiryDays: event.target.value.replace(
                              /[^\d]/g,
                              "",
                            ),
                          })
                        }
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 type-body-muted">
                        days
                      </span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel tip="How soon this customer is usually expected to pay after you send an invoice (for example, within 30 days).">
                      Payment Terms
                    </FieldLabel>
                    <SelectField
                      ariaLabel="Payment terms"
                      value={draft.paymentTerms}
                      options={PAYMENT_TERMS_OPTIONS}
                      onChange={(value) =>
                        patchDraft({ paymentTerms: value })
                      }
                    />
                  </div>
                </div>
              </SectionEditor>
            ) : (
              <ViewCard title="Settings" onEdit={() => startEdit("settings")}>
                <div className="flex flex-col gap-2 type-body">
                  <p>
                    <span className="text-black/45">Currency: </span>
                    {currencyLabel(saved.currency)}
                  </p>
                  <p>
                    <span className="text-black/45">Tax: </span>
                    {saved.taxStatus}
                  </p>
                  <p>
                    <span className="text-black/45">Quote expiry: </span>
                    {saved.quoteExpiryDays || "—"} days
                  </p>
                  <p>
                    <span className="text-black/45">Payment terms: </span>
                    {saved.paymentTerms}
                  </p>
                </div>
              </ViewCard>
            )}

            {editing === "paymentPreferences" ? (
              <SectionEditor
                title="Payment Preferences"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <p className="type-body-muted">
                  Pick how this customer can usually pay you. These choices
                  start from your business payment options.
                </p>
                <div className="flex flex-col gap-2.5">
                  {availablePaymentOptions.length === 0 ? (
                    <p className="type-body-muted">
                      No payment methods are set up for your business yet.
                    </p>
                  ) : (
                    availablePaymentOptions.map((option) => (
                      <CheckboxRow
                        key={option}
                        checked={draft.paymentPreferences.includes(option)}
                        onChange={() => togglePaymentPreference(option)}
                        label={option}
                      />
                    ))
                  )}
                </div>
                <div>
                  <TertiaryButton
                    onClick={() =>
                      router.push("/organization#payment-options")
                    }
                  >
                    Add payment option
                  </TertiaryButton>
                </div>
              </SectionEditor>
            ) : (
              <ViewCard
                title="Payment Preferences"
                onEdit={() => startEdit("paymentPreferences")}
              >
                <p className="type-body">
                  {saved.paymentPreferences.length
                    ? saved.paymentPreferences.join(", ")
                    : "None selected"}
                </p>
              </ViewCard>
            )}

            {editing === "automations" ? (
              <SectionEditor
                title="Default Automations"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <p className="type-body-muted">
                  Optional helpers that save time. You can turn them off on any
                  single quote or invoice later.
                </p>
                <div className="flex flex-col gap-3">
                  <CheckboxRow
                    checked={draft.autoSend}
                    onChange={(checked) => patchDraft({ autoSend: checked })}
                    label="Auto-send: Send invoices automatically on their issuance date."
                  />
                  <CheckboxRow
                    checked={draft.reminders}
                    onChange={(checked) => patchDraft({ reminders: checked })}
                    label="Reminders: Send a reminder before a quote expires or an invoice is due."
                  >
                    <div className="relative max-w-[220px]">
                      <input
                        inputMode="numeric"
                        className={`${inputClass} pr-24`}
                        value={draft.reminderDays}
                        onChange={(event) =>
                          patchDraft({
                            reminderDays: event.target.value.replace(
                              /[^\d]/g,
                              "",
                            ),
                          })
                        }
                        aria-label="Reminder days"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 type-body-muted">
                        days before
                      </span>
                    </div>
                  </CheckboxRow>
                  <CheckboxRow
                    checked={draft.receipts}
                    onChange={(checked) => patchDraft({ receipts: checked })}
                    label="Receipts: Automatically email a receipt when you mark a payment as received."
                  />
                </div>
              </SectionEditor>
            ) : (
              <ViewCard
                title="Default Automations"
                onEdit={() => startEdit("automations")}
              >
                <p className="type-body">
                  {enabledAutomations.length
                    ? enabledAutomations.join(" · ")
                    : "None enabled"}
                </p>
              </ViewCard>
            )}
          </section>

          {/* Internal Notes */}
          <section className={sectionShellClass}>
            {editing === "notes" ? (
              <SectionEditor
                title="Internal Notes"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <p className="type-body-muted">
                  Private notes for you and your team. Customers will not see
                  these.
                </p>
                <div className="relative">
                  <textarea
                    className={`${inputClass} min-h-[140px] resize-y`}
                    maxLength={1000}
                    value={draft.internalNotes}
                    onChange={(event) =>
                      patchDraft({
                        internalNotes: event.target.value.slice(0, 1000),
                      })
                    }
                    aria-label="Internal notes"
                  />
                  <p className="pointer-events-none absolute bottom-2.5 right-3 text-xs text-black/40">
                    {draft.internalNotes.length}/1000
                  </p>
                </div>
              </SectionEditor>
            ) : notesEmpty ? (
              <TertiaryButton onClick={() => startEdit("notes")}>
                Add Internal Notes
              </TertiaryButton>
            ) : (
              <ViewCard
                title="Internal Notes"
                onEdit={() => startEdit("notes")}
              >
                <p className="type-body whitespace-pre-wrap leading-5">
                  {saved.internalNotes}
                </p>
              </ViewCard>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export function CustomerFormView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page-grey text-black">
          <TopNav />
          <main className="mx-auto max-w-[900px] px-4 py-16">
            <p className="text-sm text-black/50">Loading…</p>
          </main>
        </div>
      }
    >
      <CustomerFormInner />
    </Suspense>
  );
}
