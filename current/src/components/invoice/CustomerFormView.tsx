"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  customers,
  formatMoney,
  getCustomerAccountSummary,
  getCustomerInvoices,
} from "@/lib/invoice-demo-data";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  CORE_PAYMENT_METHODS,
  getCustomerCascadeDefaults,
  getEnabledPaymentMethodLabels,
  loadOrganizationSettings,
} from "@/lib/organization-settings";
import {
  CA_PROVINCES_TERRITORIES,
  CUSTOMER_TAG_OPTIONS,
  LOCKED_CURRENCY,
  provinceLabel,
} from "@/lib/canada";
import { ORGANIZATION_DEFAULTS } from "@/lib/org-defaults";
import { TopNav } from "./TopNav";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { EditCloseButton, InfoTooltip, Modal, PencilIcon, TertiaryButton } from "./ui";

const TAX_OPTIONS = ["Taxable", "Tax-exempt"] as const;

const PAYMENT_TERMS_OPTIONS = ["Net 30", "Net 15", "Upon receipt"] as const;

const LEGAL_NAME_TIP =
  "Required for CRA records and Canada Small Business Financing Loan eligibility. Use the customer’s official legal business name.";

/** Single source for edit FieldLabel + view ViewField copy. */
const FIELD = {
  businessLegalName: "Customer / Business Legal Name",
  businessEmail: "Business Email",
  phoneNumber: "Phone Number",
  billingAddress: "Billing Address",
  shippingAddress: "Shipping Address",
  addShipping: "Add shipping address or service address",
  contactName: "Contact Name",
  contactEmail: "Contact Email",
  sendCommsHere: "Send all communications to this email",
  tags: "Tags",
  taxSetting: "Tax Setting",
  quoteExpiry: "Quote Expiry",
  paymentTerms: "Payment Terms",
  autoSend: "Auto-send",
  reminders: "Reminders",
  receipts: "Receipts",
  internalNotes: "Internal Notes",
  province: "Province / Territory",
} as const;

type SectionKey =
  | "business"
  | "address"
  | "contact"
  | "tags"
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
  hasShippingAddress: boolean;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  contactName: string;
  contactEmail: string;
  useContactEmailForComms: boolean;
  tags: string[];
  internalNotes: string;
};

function emptyCustomerForm(
  cascade = ORGANIZATION_DEFAULTS,
): CustomerFormState {
  return {
    businessName: "",
    email: "",
    phone: "",
    currency: LOCKED_CURRENCY,
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
    hasShippingAddress: false,
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingProvince: "",
    shippingPostalCode: "",
    contactName: "",
    contactEmail: "",
    useContactEmailForComms: false,
    tags: [],
    internalNotes: "",
  };
}

const inputClass = UI_CLASS.input;

const hoverCardClass = UI_CLASS.hoverCard;

const sectionShellClass = UI_CLASS.sectionShell;

/** Dashed divider between subsections inside edit cards */
const sectionDividerClass =
  "mt-6 border-t border-dashed border-black/15 pt-6";

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
    [parts.city, parts.province ? provinceLabel(parts.province) : ""]
      .filter(Boolean)
      .join(", "),
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
      : { value: option.code, label: `${option.name} (${option.code})` },
  );
  const selected = normalized.find((option) => option.value === value);

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
        <span className={`truncate ${selected ? "" : "text-black/45"}`}>
          {selected?.label ?? "Select…"}
        </span>
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
        className={`type-headline-6 ${
          tone === "edit" ? "text-black" : "text-black/45"
        }`}
      >
        {title}
      </h3>
    </div>
  );
}

/** Stacked label + value pairs for view-mode cards. */
function EmptyValue() {
  return <span className="text-black/40">N/A</span>;
}

function displayOrNa(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : <EmptyValue />;
}

function ViewField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="type-subtitle-1 text-black">{label}</p>
      <div className="type-body">{value}</div>
    </div>
  );
}

function ViewFieldList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
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
  requireProvince = false,
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
  requireProvince?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-line1`}>Street Address</FieldLabel>
        <input
          id={`${idPrefix}-line1`}
          className={inputClass}
          value={values.addressLine1}
          onChange={(event) => onChange({ addressLine1: event.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-line2`}>
          Address Line 2{" "}
          <span className="font-normal text-black/45">(optional)</span>
        </FieldLabel>
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
        <FieldLabel
          tip={
            requireProvince
              ? "Required for GST, HST, and PST/RST tax calculations."
              : undefined
          }
        >
          {FIELD.province}
          {requireProvince ? (
            <span className="type-danger"> *</span>
          ) : null}
        </FieldLabel>
        <SelectField
          ariaLabel={FIELD.province}
          value={values.province}
          options={CA_PROVINCES_TERRITORIES}
          onChange={(value) => onChange({ province: value })}
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
    currency: LOCKED_CURRENCY,
  };
}

function SortHeader({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <svg width="8" height="10" viewBox="0 0 8 10" fill="none" aria-hidden>
        <path d="M4 1 7 4H1L4 1Z" fill="currentColor" opacity="0.45" />
        <path d="M4 9 1 6h6L4 9Z" fill="currentColor" opacity="0.45" />
      </svg>
    </span>
  );
}

const CUSTOMER_TABS = ["Account Summary", "About Customer"] as const;
type CustomerTab = (typeof CUSTOMER_TABS)[number];

function CustomerFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id");
  const isEdit = Boolean(customerId);

  const [saved, setSaved] = useState<CustomerFormState>(() =>
    formFromCustomerId(customerId),
  );
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<CustomerFormState>(saved);
  const [availablePaymentOptions, setAvailablePaymentOptions] = useState<
    string[]
  >(() => [...ORGANIZATION_DEFAULTS.paymentPreferences]);
  const [customerCreated, setCustomerCreated] = useState(() =>
    Boolean(customerId),
  );
  const [tab, setTab] = useState<CustomerTab>(() =>
    customerId ? "Account Summary" : "About Customer",
  );
  const [createDraft, setCreateDraft] = useState({
    businessName: "",
    email: "",
    phone: "",
  });
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(
    createMenuRef,
    () => setCreateMenuOpen(false),
    createMenuOpen,
  );

  const showCreateModal = !isEdit && !customerCreated;

  useEffect(() => {
    const next = formFromCustomerId(customerId);
    window.setTimeout(() => {
      const org = loadOrganizationSettings();
      setAvailablePaymentOptions(getEnabledPaymentMethodLabels(org));
      setSaved(next);
      setDraft(next);
      setEditing(null);
      setCustomerCreated(Boolean(customerId));
      setTab(customerId ? "Account Summary" : "About Customer");
      setCreateDraft({ businessName: "", email: "", phone: "" });
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

  function toggleTag(tag: string) {
    setDraft((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((item) => item !== tag)
          : [...prev.tags, tag],
      };
    });
  }

  function setShippingEnabled(enabled: boolean) {
    setDraft((prev) => {
      if (!enabled) {
        return { ...prev, hasShippingAddress: false };
      }
      return {
        ...prev,
        hasShippingAddress: true,
        shippingAddressLine1: prev.addressLine1,
        shippingAddressLine2: prev.addressLine2,
        shippingCity: prev.city,
        shippingProvince: prev.province,
        shippingPostalCode: prev.postalCode,
      };
    });
  }

  function saveCreateModal() {
    const name = createDraft.businessName.trim();
    if (!name) return;
    if (createDraft.email.trim() && !isValidEmail(createDraft.email)) return;
    const next: CustomerFormState = {
      ...saved,
      businessName: name,
      email: createDraft.email.trim(),
      phone: createDraft.phone.trim(),
      currency: LOCKED_CURRENCY,
    };
    setSaved(next);
    setDraft(next);
    setCustomerCreated(true);
    setTab("About Customer");
    setEditing(null);
  }

  function cancelCreateModal() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/customers");
  }

  const createEmailValid =
    !createDraft.email.trim() || isValidEmail(createDraft.email);
  const createNameValid = createDraft.businessName.trim().length > 0;
  const createCanSave = createNameValid && createEmailValid;

  const businessEmpty =
    !saved.businessName && !saved.email && !saved.phone;
  const addressEmpty =
    !saved.addressLine1 &&
    !saved.addressLine2 &&
    !saved.city &&
    !saved.province &&
    !saved.postalCode &&
    !saved.hasShippingAddress;
  const contactEmpty =
    !saved.contactName && !saved.contactEmail;
  const tagsEmpty = saved.tags.length === 0;
  const notesEmpty = !saved.internalNotes.trim();

  const businessSaveDisabled =
    !draft.businessName.trim() ||
    (Boolean(draft.email.trim()) && !isValidEmail(draft.email));
  const addressSaveDisabled = !draft.province.trim();
  const contactSaveDisabled =
    draft.useContactEmailForComms && !isValidEmail(draft.contactEmail);

  const billingLines = formatAddress({
    line1: saved.addressLine1,
    line2: saved.addressLine2,
    city: saved.city,
    province: saved.province,
    postalCode: saved.postalCode,
  });
  const shippingLines = formatAddress({
    line1: saved.shippingAddressLine1,
    line2: saved.shippingAddressLine2,
    city: saved.shippingCity,
    province: saved.shippingProvince,
    postalCode: saved.shippingPostalCode,
  });

  const invoices = getCustomerInvoices(customerId);
  const accountSummary = getCustomerAccountSummary(customerId);

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main
        className={`mx-auto max-w-[900px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16 ${
          showCreateModal ? "pointer-events-none select-none opacity-40" : ""
        }`}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="type-page-title">
            {saved.businessName.trim()
              ? saved.businessName.trim()
              : isEdit
                ? "Edit Customer"
                : "New Customer"}
          </h1>
          {!showCreateModal ? (
            <div ref={createMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCreateMenuOpen((prev) => !prev)}
                className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5`}
                aria-haspopup="menu"
                aria-expanded={createMenuOpen}
              >
                Create New
                <svg
                  width="11"
                  height="6"
                  viewBox="0 0 11 6"
                  fill="none"
                  aria-hidden
                  className={`transition ${createMenuOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M1 1l4.5 4L10 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {createMenuOpen ? (
                <ul
                  role="menu"
                  className="absolute right-0 z-30 mt-1 w-[340px] overflow-hidden rounded-lg border border-black/10 bg-white py-1 shadow-lg"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-prime-blue/10"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        router.push("/quote");
                      }}
                    >
                      <span className="text-sm font-semibold text-midnight-ink">
                        Quote
                      </span>
                      <span className="text-xs font-normal leading-4 text-black/55">
                        An estimate to help your client understand costs. This
                        can be turned into an invoice later.
                      </span>
                    </button>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-prime-blue/10"
                      onClick={() => {
                        setCreateMenuOpen(false);
                        router.push("/");
                      }}
                    >
                      <span className="text-sm font-semibold text-midnight-ink">
                        Invoice
                      </span>
                      <span className="text-xs font-normal leading-4 text-black/55">
                        A formal request of payment for goods and services
                        rendered.
                      </span>
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mb-6 border-b border-black/15">
          <div className="flex flex-wrap gap-1">
            {CUSTOMER_TABS.map((id) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-t-md px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-midnight-ink text-white"
                      : "bg-transparent text-black hover:bg-black/[0.04]"
                  }`}
                >
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "Account Summary" ? (
          <section className={sectionShellClass}>
            <div className={`px-7 pb-6 pt-7 ${hoverCardClass}`}>
              <h2 className="type-headline-6 text-black">Account summary</h2>
              <p className="type-body-muted mt-1">
                Read-only totals from invoicing.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                    Invoices
                  </p>
                  <p className="mt-1 text-lg font-semibold text-black">
                    {accountSummary.invoiceCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                    Total invoiced
                  </p>
                  <p className="mt-1 text-lg font-semibold text-black">
                    {formatMoney(accountSummary.totalInvoiced)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                    Paid
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#1B7A4E]">
                    {formatMoney(accountSummary.paid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                    Outstanding
                  </p>
                  <p className="mt-1 text-lg font-semibold text-status-danger">
                    {formatMoney(accountSummary.outstanding)}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-black/10 bg-white">
              <div className="grid grid-cols-[1fr_1.2fr_0.9fr_1fr_0.9fr] gap-3 border-b border-black/10 bg-cloud-grey px-5 py-3 text-xs font-semibold text-black/55">
                <SortHeader label="Invoice" />
                <SortHeader label="Client" />
                <SortHeader label="Status" />
                <SortHeader label="Due Date" />
                <SortHeader label="Amount" />
              </div>

              {invoices.length > 0 ? (
                <ul>
                  {invoices.map((invoice, index) => (
                    <li
                      key={invoice.id}
                      className={`grid grid-cols-[1fr_1.2fr_0.9fr_1fr_0.9fr] gap-3 px-5 py-3.5 text-sm text-black ${
                        index < invoices.length - 1
                          ? "border-b border-black/10"
                          : ""
                      }`}
                    >
                      <span className="font-medium">{invoice.number}</span>
                      <span className="truncate">{invoice.client}</span>
                      <span>{invoice.status}</span>
                      <span>{invoice.dueDate}</span>
                      <span className="font-medium">
                        {formatMoney(invoice.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-12 text-center type-body-muted">
                  No invoices yet for this customer.
                </div>
              )}
            </div>
          </section>
        ) : (
        <div className="flex flex-col gap-5">
          {/* Customer Details */}
          <section className={sectionShellClass}>
            <SectionHeader title="Customer Details" />
            {editing === "business" ? (
              <SectionEditor
                title="Business Details"
                onClose={closeEdit}
                onSave={saveSection}
                saveDisabled={businessSaveDisabled}
              >
                <div>
                  <FieldLabel htmlFor="business-name" tip={LEGAL_NAME_TIP}>
                    {FIELD.businessLegalName}{" "}
                    <span className="type-danger">*</span>
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
                  <FieldLabel htmlFor="email">{FIELD.businessEmail}</FieldLabel>
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    value={draft.email}
                    onChange={(event) =>
                      patchDraft({ email: event.target.value })
                    }
                  />
                  {draft.email.trim() && !isValidEmail(draft.email) ? (
                    <p className="type-danger mt-1.5">
                      Enter a valid email address.
                    </p>
                  ) : null}
                </div>
                <div>
                  <FieldLabel htmlFor="phone">{FIELD.phoneNumber}</FieldLabel>
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
                <ViewFieldList>
                  <ViewField
                    label={FIELD.businessLegalName}
                    value={displayOrNa(saved.businessName)}
                  />
                  <ViewField
                    label={FIELD.businessEmail}
                    value={
                      saved.email.trim() ? (
                        <>
                          {saved.email}
                          {saved.useContactEmailForComms ? (
                            <p className="type-body-muted mt-0.5">
                              Emails are not sent here.
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <EmptyValue />
                      )
                    }
                  />
                  <ViewField
                    label={FIELD.phoneNumber}
                    value={displayOrNa(saved.phone)}
                  />
                </ViewFieldList>
              </ViewCard>
            )}

            {editing === "address" ? (
              <SectionEditor
                title="Address"
                onClose={closeEdit}
                onSave={saveSection}
                saveDisabled={addressSaveDisabled}
              >
                <p className="type-body-muted -mt-2">
                  Billing locality is used for CRA alignment and tax
                  calculations. Province / Territory is required.
                </p>
                <AddressFields
                  idPrefix="billing"
                  requireProvince
                  values={{
                    addressLine1: draft.addressLine1,
                    addressLine2: draft.addressLine2,
                    city: draft.city,
                    province: draft.province,
                    postalCode: draft.postalCode,
                  }}
                  onChange={(patch) => patchDraft(patch)}
                />
                {!draft.province.trim() ? (
                  <p className="type-danger -mt-2">
                    Select a province or territory to enable tax calculations.
                  </p>
                ) : null}
                <div>
                  <CheckboxRow
                    checked={draft.hasShippingAddress}
                    onChange={setShippingEnabled}
                    label={FIELD.addShipping}
                  />
                </div>
                {draft.hasShippingAddress ? (
                  <div className={`flex flex-col gap-4 ${sectionDividerClass}`}>
                    <h4 className="type-subtitle-1">{FIELD.shippingAddress}</h4>
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
              </SectionEditor>
            ) : addressEmpty ? (
              <TertiaryButton onClick={() => startEdit("address")}>
                Add Address
              </TertiaryButton>
            ) : (
              <ViewCard title="Address" onEdit={() => startEdit("address")}>
                <ViewFieldList>
                  <ViewField
                    label={FIELD.billingAddress}
                    value={
                      billingLines ? billingLines.join(", ") : <EmptyValue />
                    }
                  />
                  <ViewField
                    label={FIELD.shippingAddress}
                    value={
                      saved.hasShippingAddress
                        ? shippingLines
                          ? shippingLines.join(", ")
                          : <EmptyValue />
                        : <EmptyValue />
                    }
                  />
                </ViewFieldList>
              </ViewCard>
            )}

            {editing === "contact" ? (
              <SectionEditor
                title="Contact Info"
                onClose={closeEdit}
                onSave={saveSection}
                saveDisabled={contactSaveDisabled}
              >
                <div>
                  <FieldLabel htmlFor="contact-name">
                    {FIELD.contactName}
                  </FieldLabel>
                  <input
                    id="contact-name"
                    className={inputClass}
                    value={draft.contactName}
                    onChange={(event) =>
                      patchDraft({ contactName: event.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="contact-email">
                    {FIELD.contactEmail}
                  </FieldLabel>
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
                    label={FIELD.sendCommsHere}
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
                <ViewFieldList>
                  <ViewField
                    label={FIELD.contactName}
                    value={displayOrNa(saved.contactName)}
                  />
                  <ViewField
                    label={FIELD.contactEmail}
                    value={
                      saved.contactEmail.trim() ? (
                        <>
                          {saved.contactEmail}
                          {saved.useContactEmailForComms ? (
                            <p className="type-body-muted mt-0.5">
                              All communications are sent to this email.
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <EmptyValue />
                      )
                    }
                  />
                </ViewFieldList>
              </ViewCard>
            )}

            {editing === "tags" ? (
              <SectionEditor
                title="Tags"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <p className="type-body-muted -mt-2">
                  Group accounts for filtering (for example, VIP or Contractor).
                </p>
                <div className="flex flex-col gap-2.5">
                  {CUSTOMER_TAG_OPTIONS.map((tag) => (
                    <CheckboxRow
                      key={tag}
                      checked={draft.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      label={tag}
                    />
                  ))}
                </div>
              </SectionEditor>
            ) : tagsEmpty ? (
              <TertiaryButton onClick={() => startEdit("tags")}>
                Add Tags
              </TertiaryButton>
            ) : (
              <ViewCard title="Tags" onEdit={() => startEdit("tags")}>
                <div className="flex flex-wrap gap-2">
                  {saved.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-prime-blue/10 px-2.5 py-1 text-sm font-semibold text-prime-blue"
                    >
                      {tag}
                    </span>
                  ))}
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
                    <FieldLabel tip="Whether you usually charge sales tax for this customer.">
                      {FIELD.taxSetting}
                    </FieldLabel>
                    <SelectField
                      ariaLabel={FIELD.taxSetting}
                      value={draft.taxStatus}
                      options={TAX_OPTIONS}
                      onChange={(value) =>
                        patchDraft({
                          taxStatus: value as CustomerFormState["taxStatus"],
                        })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="quote-expiry"
                      tip="How long a quote stays open for this customer before it expires. Starts from your organization default."
                    >
                      {FIELD.quoteExpiry}
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
                      {FIELD.paymentTerms}
                    </FieldLabel>
                    <SelectField
                      ariaLabel={FIELD.paymentTerms}
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
                <ViewFieldList>
                  <ViewField
                    label={FIELD.taxSetting}
                    value={saved.taxStatus}
                  />
                  <ViewField
                    label={FIELD.quoteExpiry}
                    value={
                      saved.quoteExpiryDays.trim() ? (
                        `${saved.quoteExpiryDays} days`
                      ) : (
                        <EmptyValue />
                      )
                    }
                  />
                  <ViewField
                    label={FIELD.paymentTerms}
                    value={displayOrNa(saved.paymentTerms)}
                  />
                </ViewFieldList>
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
                    availablePaymentOptions.map((option) => {
                      const method = CORE_PAYMENT_METHODS.find(
                        (entry) => entry.label === option,
                      );
                      return (
                        <CheckboxRow
                          key={option}
                          checked={draft.paymentPreferences.includes(option)}
                          onChange={() => togglePaymentPreference(option)}
                          label={option}
                        >
                          {method?.details.length ? (
                            <ul className="list-disc space-y-1 pl-5 text-sm text-black">
                              {method.details.map((detail) => (
                                <li key={`${detail.label}-${detail.text}`}>
                                  <span
                                    className={
                                      detail.italic ? "italic" : undefined
                                    }
                                  >
                                    <span className="font-bold">
                                      {detail.label}:
                                    </span>{" "}
                                    {detail.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </CheckboxRow>
                      );
                    })
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
                <ViewFieldList>
                  {saved.paymentPreferences.length ? (
                    saved.paymentPreferences.map((option) => {
                      const method = CORE_PAYMENT_METHODS.find(
                        (entry) => entry.label === option,
                      );
                      const costSummary = method?.details
                        .filter((detail) =>
                          detail.label.startsWith("Cost to"),
                        )
                        .map((detail) => `${detail.label}: ${detail.text}`)
                        .join(" · ");
                      return (
                        <ViewField
                          key={option}
                          label={option}
                          value={costSummary || "Accepted"}
                        />
                      );
                    })
                  ) : (
                    <ViewField label="Selected" value="None selected" />
                  )}
                </ViewFieldList>
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
                    label={`${FIELD.autoSend}: Send invoices automatically on their issuance date.`}
                  />
                  <CheckboxRow
                    checked={draft.reminders}
                    onChange={(checked) => patchDraft({ reminders: checked })}
                    label={`${FIELD.reminders}: Send a reminder before a quote expires or an invoice is due.`}
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
                    label={`${FIELD.receipts}: Automatically email a receipt when you mark a payment as received.`}
                  />
                </div>
              </SectionEditor>
            ) : (
              <ViewCard
                title="Default Automations"
                onEdit={() => startEdit("automations")}
              >
                <ViewFieldList>
                  <ViewField
                    label={FIELD.autoSend}
                    value={saved.autoSend ? "On" : "Off"}
                  />
                  <ViewField
                    label={FIELD.reminders}
                    value={
                      saved.reminders ? (
                        saved.reminderDays.trim() ? (
                          `On · ${saved.reminderDays} days before`
                        ) : (
                          <>
                            On · <EmptyValue />
                          </>
                        )
                      ) : (
                        "Off"
                      )
                    }
                  />
                  <ViewField
                    label={FIELD.receipts}
                    value={saved.receipts ? "On" : "Off"}
                  />
                </ViewFieldList>
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
                    aria-label={FIELD.internalNotes}
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
                <ViewFieldList>
                  <ViewField
                    label={FIELD.internalNotes}
                    value={
                      <p className="whitespace-pre-wrap leading-5">
                        {saved.internalNotes}
                      </p>
                    }
                  />
                </ViewFieldList>
              </ViewCard>
            )}
          </section>
        </div>
        )}
      </main>

      {showCreateModal ? (
        <Modal
          title="Create New Customer"
          titleId="create-customer-title"
          onClose={cancelCreateModal}
          closeOnBackdrop={false}
          zClass="z-[220]"
          maxWidthClass="max-w-xl"
          confirmLabel="Save"
          onConfirm={saveCreateModal}
          confirmDisabled={!createCanSave}
        >
          <h3 className="type-headline-6">Business Details</h3>
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <FieldLabel
                htmlFor="create-business-name"
                tip={LEGAL_NAME_TIP}
              >
                {FIELD.businessLegalName}{" "}
                <span className="type-danger">*</span>
              </FieldLabel>
              <input
                id="create-business-name"
                className={inputClass}
                value={createDraft.businessName}
                onChange={(event) =>
                  setCreateDraft((prev) => ({
                    ...prev,
                    businessName: event.target.value,
                  }))
                }
                autoFocus
              />
            </div>
            <div>
              <FieldLabel htmlFor="create-email">
                {FIELD.businessEmail}
              </FieldLabel>
              <input
                id="create-email"
                type="email"
                className={inputClass}
                value={createDraft.email}
                onChange={(event) =>
                  setCreateDraft((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
              {!createEmailValid ? (
                <p className="type-danger mt-1.5">
                  Enter a valid email address.
                </p>
              ) : null}
            </div>
            <div>
              <FieldLabel htmlFor="create-phone">
                {FIELD.phoneNumber}
              </FieldLabel>
              <input
                id="create-phone"
                type="tel"
                className={inputClass}
                value={createDraft.phone}
                onChange={(event) =>
                  setCreateDraft((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </Modal>
      ) : null}
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
