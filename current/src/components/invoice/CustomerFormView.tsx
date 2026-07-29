"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  archiveCustomer,
  findCustomer,
  formatMoney,
  getCustomerAccountSummary,
  getCustomerDocumentLifecycle,
  getCustomerInvoices,
  getCustomerQuotes,
  isCustomerArchived,
  unarchiveCustomer,
} from "@/lib/invoice-demo-data";
import { CreateCustomerModal } from "./CreateCustomerModal";
import { CustomerDocumentsPanel } from "./CustomerDocumentsPanel";
import { UI_CLASS } from "@/lib/design-tokens";
import {
  CORE_PAYMENT_METHODS,
  getCustomerCascadeDefaults,
  getEnabledPaymentMethodLabels,
  loadOrganizationSettings,
} from "@/lib/organization-settings";
import {
  CA_LOCATION_OPTIONS,
  LOCKED_CURRENCY,
  isCanadianProvince,
  provinceLabel,
} from "@/lib/canada";
import { loadCustomerTags } from "@/lib/customer-tags";
import { ORGANIZATION_DEFAULTS } from "@/lib/org-defaults";
import {
  CUSTOMER_NON_TAXABLE_OPTIONS,
  CUSTOMER_TAXABLE_OPTIONS,
  TAX_SETTING_OPTIONS,
  suggestCustomerTaxCascade,
  suggestNonTaxableForCustomer,
  suggestTaxableForCustomer,
  type TaxSuggestions,
} from "@/lib/tax-suggestions";
import {
  loadCustomerProfileSettings,
  saveCustomerProfileSettings,
} from "@/lib/customer-profile-settings";
import { TopNav } from "./TopNav";
import { TaxSuggestionsEditor } from "./TaxSuggestionsEditor";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { CreatePlusIcon, EditCloseButton, InfoTooltip, Modal, PencilIcon, TertiaryButton } from "./ui";

const TAX_OPTIONS = ["Taxable", "Tax-exempt"] as const;

const PAYMENT_TERMS_OPTIONS = ["Net 30", "Net 15", "Upon receipt"] as const;

const LEGAL_NAME_TIP =
  "Add the business or individual's full legal name";

/** Single source for edit FieldLabel + view ViewField copy. */
const FIELD = {
  businessLegalName: "Customer Legal Name",
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
  internalNotes: "Internal Notes",
  province: "Province / Territory",
} as const;

type SectionKey =
  | "business"
  | "address"
  | "contact"
  | "tags"
  | "settings"
  | "tax"
  | "paymentPreferences"
  | "automations"
  | "notes";

type CustomerFormState = {
  businessName: string;
  email: string;
  phone: string;
  currency: string;
  taxStatus: (typeof TAX_OPTIONS)[number];
  taxSuggestions: TaxSuggestions;
  quoteExpiryDays: string;
  paymentTerms: string;
  paymentPreferences: string[];
  autoSend: boolean;
  reminders: boolean;
  reminderDays: string;
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
  const taxCascade = suggestCustomerTaxCascade("");
  return {
    businessName: "",
    email: "",
    phone: "",
    currency: LOCKED_CURRENCY,
    taxStatus: taxCascade.taxStatus,
    taxSuggestions: { ...taxCascade.suggestions },
    quoteExpiryDays: cascade.quoteExpiryDays,
    paymentTerms: cascade.paymentTerms,
    paymentPreferences: [...cascade.paymentPreferences],
    autoSend: cascade.autoSend,
    reminders: cascade.reminders,
    reminderDays: cascade.reminderDays,
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

/** Static panel (no blue hover outline) — e.g. Account Summary metrics. */
const staticCardClass = "rounded-[10px] border border-black/10";

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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function placeMenu() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const maxHeight = 224;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUpward = spaceBelow < Math.min(maxHeight, 160) && spaceAbove > spaceBelow;
      const height = Math.min(maxHeight, openUpward ? spaceAbove : spaceBelow);
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 400,
        maxHeight: height,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const normalized = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : {
          value: option.code,
          label:
            option.code === "OUTSIDE_CA"
              ? option.name
              : `${option.name} (${option.code})`,
        },
  );
  const selected = normalized.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
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
      {open && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuRef}
              role="listbox"
              data-portal-menu
              style={menuStyle}
              className="overflow-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
            >
              {normalized.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-black/[0.04]"
                    onMouseDown={(event) => {
                      // Select before outside-click dismissals (portaled menus
                      // sit outside SectionEditor) can revert draft state.
                      event.preventDefault();
                      event.stopPropagation();
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center text-prime-blue">
                      {option.value === value ? (
                        <svg
                          width="14"
                          height="10"
                          viewBox="0 0 14 10"
                          fill="none"
                        >
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
                  {option.value === "OUTSIDE_CA" ? (
                    <div
                      className="mx-3 my-1 border-t border-black/10"
                      role="separator"
                      aria-hidden
                    />
                  ) : null}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
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

/** Stacked label + value pairs for view-mode cards. Empty values are omitted. */
function ViewField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  if (
    value == null ||
    value === false ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

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

/** Horizontal label/value pairs for compact view-mode rows (matches org settings). */
function ViewFieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function ViewCard({
  title,
  onEdit,
  children,
  hideTitle = false,
}: {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
  hideTitle?: boolean;
}) {
  if (!onEdit) {
    return (
      <div className={`relative w-full px-7 pb-5 pt-7 text-left ${staticCardClass}`}>
        {hideTitle ? null : <BoxTitle title={title} tone="view" />}
        <div>{children}</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`relative w-full px-7 pb-5 pt-7 text-left ${hoverCardClass}`}
      aria-label={hideTitle ? title : undefined}
    >
      {hideTitle ? null : <BoxTitle title={title} tone="view" />}
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
      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-city`}>City</FieldLabel>
        <input
          id={`${idPrefix}-city`}
          className={inputClass}
          value={values.city}
          onChange={(event) => onChange({ city: event.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
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
          options={CA_LOCATION_OPTIONS}
          onChange={(value) => onChange({ province: value })}
        />
      </div>
      <div className="sm:col-span-2">
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
  const customer = findCustomer(id);
  if (!customer) return base;

  const addressParts = customer.address.split(",");
  const line1 = addressParts[0]?.trim() ?? "";
  const cityPart = addressParts[1]?.trim() ?? "";
  const provincePostal = addressParts[2]?.trim() ?? "";
  const [province = "", ...postalRest] = provincePostal.split(/\s+/);
  const postalCode = postalRest.join(" ");
  const profile = loadCustomerProfileSettings(id);
  const taxCascade = suggestCustomerTaxCascade(province);
  const cascade = getCustomerCascadeDefaults();

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
    taxStatus: profile?.taxStatus ?? taxCascade.taxStatus,
    taxSuggestions: profile?.taxSuggestions
      ? { ...profile.taxSuggestions }
      : { ...taxCascade.suggestions },
    autoSend: profile?.autoSend ?? cascade.autoSend,
    reminders: profile?.reminders ?? cascade.reminders,
    reminderDays: profile?.reminderDays?.trim() || cascade.reminderDays,
    tags: [...customer.tags],
    // Demo: show compact identity strip with alternate contact when present.
    ...(id === "acme"
      ? {
          contactName: "Jamie Rivera",
          contactEmail: "ap@acmeconstruction.example",
          useContactEmailForComms: true,
          hasShippingAddress: true,
          shippingAddressLine1: "88 Yard Gate",
          shippingCity: cityPart || "Calgary",
          shippingProvince: province || "AB",
          shippingPostalCode: postalCode || "T2E 1A1",
        }
      : {}),
  };
}

const CUSTOMER_TABS = ["Account Summary", "Customer Settings"] as const;
type CustomerTab = (typeof CUSTOMER_TABS)[number];

/** Customer Details card order (filled cards keep this sequence above Add links). */
const CUSTOMER_DETAIL_ORDER = [
  "business",
  "contact",
  "address",
  "notes",
  "tags",
] as const;

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
    customerId ? "Account Summary" : "Customer Settings",
  );
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<
    "delete" | "archive" | null
  >(null);
  const [archived, setArchived] = useState(false);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
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
      setTab(customerId ? "Account Summary" : "Customer Settings");
      setArchived(isCustomerArchived(customerId));
      setLifecycleConfirm(null);
      setTagOptions(loadCustomerTags());
    }, 0);
  }, [customerId]);

  useEffect(() => {
    if (archived) setEditing(null);
  }, [archived]);

  function startEdit(section: SectionKey) {
    if (archived) return;
    setDraft(saved);
    setEditing(section);
  }

  function closeEdit() {
    setDraft(saved);
    setEditing(null);
  }

  function saveSection() {
    const section = editing;
    setSaved(draft);
    setEditing(null);
    if (
      customerId &&
      (section === "settings" ||
        section === "tax" ||
        section === "automations")
    ) {
      saveCustomerProfileSettings(customerId, {
        taxStatus: draft.taxStatus,
        taxSuggestions: draft.taxSuggestions,
        autoSend: draft.autoSend,
        reminders: draft.reminders,
        reminderDays: draft.reminderDays,
      });
    }
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

  function cancelCreateModal() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/customers");
  }

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
  const addressSaveDisabled = false;
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
  const quotes = getCustomerQuotes(customerId);
  const accountSummary = getCustomerAccountSummary(customerId);
  const documentLifecycle = getCustomerDocumentLifecycle(customerId);
  const canDeleteCustomer = documentLifecycle === "none";
  const canArchiveCustomer =
    documentLifecycle === "drafts_only" || documentLifecycle === "has_sent";
  const showLifecycleActions = Boolean(customerId) || customerCreated;

  const internalNotesEditor =
    editing === "notes" ? (
      <SectionEditor
        title="Internal Notes"
        onClose={closeEdit}
        onSave={saveSection}
      >
        <p className="type-body-muted">
          Private notes for you and your team. Customers will not see these.
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
    ) : null;

  const internalNotesView = !notesEmpty ? (
    <ViewCard
      title="Internal Notes"
      hideTitle
      onEdit={archived ? undefined : () => startEdit("notes")}
    >
      <p className="type-body whitespace-pre-wrap leading-5">
        {saved.internalNotes}
      </p>
    </ViewCard>
  ) : null;

  /** Shared notes UI for Customer Details (includes Add when empty). */
  const internalNotesBlock =
    internalNotesEditor ??
    (notesEmpty
      ? archived
        ? null
        : (
            <TertiaryButton onClick={() => startEdit("notes")}>
              Add Internal Notes
            </TertiaryButton>
          )
      : internalNotesView);

  const legalName = saved.businessName.trim();
  const customerDisplayName = legalName || "this customer";

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main
        className={`mx-auto max-w-[1180px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16 ${
          showCreateModal ? "pointer-events-none select-none opacity-40" : ""
        }`}
      >
        {archived ? (
          <div className="mb-6 rounded-lg border border-black/10 bg-sunshine-yellow/40 px-4 py-3 text-sm font-semibold text-midnight-ink">
            ⚠️ This customer is archived. Their historical record is locked for
            compliance.
          </div>
        ) : null}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="type-page-title">
              {legalName || (isEdit ? "Edit Customer" : "New Customer")}
            </h1>
            {archived ? (
              <span className="rounded-md bg-black/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-black/60">
                Archived
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {archived && customerId ? (
              <button
                type="button"
                onClick={() => {
                  unarchiveCustomer(customerId);
                  setArchived(false);
                }}
                className="ui-btn-secondary h-11 px-5"
              >
                Unarchive Customer
              </button>
            ) : null}
            {!showCreateModal && !archived ? (
            <div ref={createMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCreateMenuOpen((prev) => !prev)}
                className={`${UI_CLASS.btnPrimary} inline-flex h-11 items-center gap-2 px-5`}
                aria-haspopup="menu"
                aria-expanded={createMenuOpen}
              >
                <CreatePlusIcon />
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
                        An estimate to help your customer understand costs. This
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

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="min-w-0 lg:order-1">
            {tab === "Account Summary" ? (
          <section className={sectionShellClass}>
            <div className={`px-7 pb-6 pt-7 ${staticCardClass}`}>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
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
                    Lifetime paid
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/45">
                    Overdue
                  </p>
                  <p className="mt-1 text-lg font-semibold text-status-danger">
                    {formatMoney(accountSummary.overdue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <CustomerDocumentsPanel invoices={invoices} quotes={quotes} />
            </div>
          </section>
        ) : (
          <>
          <section className={sectionShellClass}>
            <SectionHeader
              title="Default Settings"
              tip="These start with your business defaults. Change them here only if this customer needs different rules."
            />

            {editing === "settings" ? (
              <SectionEditor
                title="Invoice and Quote Details"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
              <ViewCard
                title="Invoice and Quote Details"
                onEdit={
                  archived ? undefined : () => startEdit("settings")
                }
              >
                <ViewFieldRow>
                  <ViewField
                    label={FIELD.quoteExpiry}
                    value={
                      saved.quoteExpiryDays.trim()
                        ? `${saved.quoteExpiryDays} days`
                        : null
                    }
                  />
                  <ViewField
                    label={FIELD.paymentTerms}
                    value={saved.paymentTerms.trim() || null}
                  />
                </ViewFieldRow>
              </ViewCard>
            )}

            {editing === "tax" ? (
              <SectionEditor
                title="Tax Info"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <FieldLabel>{FIELD.taxSetting}</FieldLabel>
                <p className="type-body-muted mb-3">
                  This starts from your organization default. Change it if this
                  customer needs different rules.
                </p>
                <div
                  className="flex flex-col gap-3"
                  role="radiogroup"
                  aria-label={FIELD.taxSetting}
                >
                  {TAX_SETTING_OPTIONS.map((option) => (
                    <div key={option.value}>
                      <label className="flex items-start gap-2.5 text-sm text-black">
                        <input
                          type="radio"
                          name="customer-tax-status"
                          className="mt-0.5 h-4 w-4 accent-prime-blue"
                          checked={draft.taxStatus === option.value}
                          onChange={() => {
                            if (option.value === "Tax-exempt") {
                              const nonTaxable = suggestNonTaxableForCustomer(
                                draft.province,
                              );
                              patchDraft({
                                taxStatus: option.value,
                                taxSuggestions: nonTaxable.suggestions,
                              });
                              return;
                            }

                            const taxable = suggestTaxableForCustomer(
                              draft.province,
                            );
                            patchDraft({
                              taxStatus: "Taxable",
                              taxSuggestions: taxable.suggestions,
                            });
                          }}
                        />
                        <span className="font-semibold">{option.label}</span>
                      </label>
                      <p className="mt-1.5 pl-6 text-sm leading-5 text-black/70">
                        {option.customerDetails}
                      </p>
                      {option.value === "Taxable" &&
                      draft.taxStatus === "Taxable" ? (
                        <div className="mt-1.5 pl-6">
                          {(() => {
                            const taxable = suggestTaxableForCustomer(
                              draft.province,
                            );
                            return (
                              <TaxSuggestionsEditor
                                value={draft.taxSuggestions}
                                options={CUSTOMER_TAXABLE_OPTIONS}
                                recommendedLabel={taxable.label}
                                recommendedNote={taxable.note}
                                onChange={(taxSuggestions) =>
                                  patchDraft({ taxSuggestions })
                                }
                              />
                            );
                          })()}
                        </div>
                      ) : null}
                      {option.value === "Tax-exempt" &&
                      draft.taxStatus === "Tax-exempt" ? (
                        <div className="mt-1.5 pl-6">
                          {(() => {
                            const nonTaxable =
                              suggestNonTaxableForCustomer(draft.province);
                            const showRecommended = Boolean(nonTaxable.note);
                            return (
                              <TaxSuggestionsEditor
                                value={draft.taxSuggestions}
                                options={CUSTOMER_NON_TAXABLE_OPTIONS}
                                placeholder="Select a tax category..."
                                ariaLabel="Tax category"
                                recommendedLabel={
                                  showRecommended
                                    ? nonTaxable.label
                                    : undefined
                                }
                                recommendedNote={
                                  showRecommended
                                    ? nonTaxable.note
                                    : undefined
                                }
                                onChange={(taxSuggestions) =>
                                  patchDraft({ taxSuggestions })
                                }
                              />
                            );
                          })()}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SectionEditor>
            ) : (
              <ViewCard
                title="Tax Info"
                onEdit={archived ? undefined : () => startEdit("tax")}
              >
                {(() => {
                  const statusLabel =
                    TAX_SETTING_OPTIONS.find(
                      (option) => option.value === saved.taxStatus,
                    )?.label ?? saved.taxStatus.trim();
                  const status = statusLabel || null;
                  const detail = saved.taxSuggestions.suggestedLabel.trim();
                  if (!status) {
                    return (
                      <p className="type-body-muted">No tax setting set.</p>
                    );
                  }
                  if (detail) {
                    return (
                      <ViewFieldRow>
                        <ViewField label={FIELD.taxSetting} value={status} />
                        <ViewField
                          label={
                            saved.taxStatus === "Tax-exempt"
                              ? "Tax category"
                              : "Tax rate"
                          }
                          value={detail}
                        />
                      </ViewFieldRow>
                    );
                  }
                  return (
                    <p className="type-body whitespace-nowrap">{status}</p>
                  );
                })()}
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
                            <ul className="list-disc space-y-1 pl-5 text-sm font-normal text-black">
                              {method.details.map((detail) => (
                                <li key={`${detail.label}-${detail.text}`}>
                                  <span
                                    className={
                                      detail.italic ? "italic" : undefined
                                    }
                                  >
                                    {detail.label}: {detail.text}
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
                onEdit={archived ? undefined : () => startEdit("paymentPreferences")}
              >
                {saved.paymentPreferences.length ? (
                  <ul className="flex flex-col gap-3">
                    {saved.paymentPreferences.map((option) => (
                      <li key={option} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-prime-blue"
                          aria-hidden
                        >
                          <svg
                            width="14"
                            height="10"
                            viewBox="0 0 14 10"
                            fill="none"
                          >
                            <path
                              d="M1 5.2 4.8 8.8 13 1.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p className="text-sm font-semibold text-black">
                          {option}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="type-body-muted">No payment preferences set.</p>
                )}
              </ViewCard>
            )}

            {editing === "automations" ? (
              <SectionEditor
                title="Default Automations"
                onClose={closeEdit}
                onSave={saveSection}
              >
                <p className="type-body-muted">
                  Overrides organization defaults for this customer&apos;s new
                  quotes and invoices. You can still change reminders on each
                  document.
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
                </div>
              </SectionEditor>
            ) : (
              <ViewCard
                title="Default Automations"
                onEdit={archived ? undefined : () => startEdit("automations")}
              >
                <ViewFieldRow>
                  <ViewField
                    label={FIELD.autoSend}
                    value={saved.autoSend ? "On" : "Off"}
                  />
                  <ViewField
                    label={FIELD.reminders}
                    value={
                      saved.reminders
                        ? saved.reminderDays.trim()
                          ? `On · ${saved.reminderDays} days before`
                          : "On"
                        : "Off"
                    }
                  />
                </ViewFieldRow>
              </ViewCard>
            )}
          </section>

          {showLifecycleActions && !archived ? (
            <div className="mt-8 border-t border-black/10 pt-6">
              {canDeleteCustomer ? (
                <>
                  <p className="type-body-muted max-w-xl">
                    This customer has no invoices or quotes. Deleting removes
                    them permanently and cannot be undone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLifecycleConfirm("delete")}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-[5px] border border-status-danger px-5 text-sm font-semibold text-status-danger transition hover:bg-status-danger/5"
                  >
                    Delete customer
                  </button>
                </>
              ) : canArchiveCustomer ? (
                <>
                  <p className="type-body-muted max-w-xl">
                    {documentLifecycle === "has_sent"
                      ? "This customer has sent invoices or quotes, so they can’t be deleted. Archiving hides them from active lists while keeping financial records for audit and CRA traceability."
                      : "This customer only has draft invoices or quotes. Archiving hides them from active lists while preserving draft history."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setLifecycleConfirm("archive")}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-[5px] border border-status-danger px-5 text-sm font-semibold text-status-danger transition hover:bg-status-danger/5"
                  >
                    Archive customer
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          </>
        )}
          </div>

          <aside className="min-w-0 max-lg:order-first lg:sticky lg:top-6 lg:order-2">
            {/* Customer Details — filled/editing cards above remaining Add links */}
            <section className={sectionShellClass}>
              <SectionHeader title="Customer Details" />
              {(
                [
                  {
                    key: "business",
                    filled: editing === "business" || !businessEmpty,
                    node:
                      editing === "business" ? (
                        <SectionEditor
                          title="Business Details"
                          onClose={closeEdit}
                          onSave={saveSection}
                          saveDisabled={businessSaveDisabled}
                        >
                          <div>
                            <FieldLabel
                              htmlFor="business-name"
                              tip={LEGAL_NAME_TIP}
                            >
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
                            <FieldLabel htmlFor="email">
                              {FIELD.businessEmail}
                            </FieldLabel>
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
                            <FieldLabel htmlFor="phone">
                              {FIELD.phoneNumber}
                            </FieldLabel>
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
                        archived ? null : (
                          <TertiaryButton onClick={() => startEdit("business")}>
                            Add Business Details
                          </TertiaryButton>
                        )
                      ) : (
                        <ViewCard
                          title="Business Details"
                          hideTitle
                          onEdit={archived ? undefined : () => startEdit("business")}
                        >
                          <ViewFieldList>
                            <ViewField
                              label={FIELD.businessLegalName}
                              value={saved.businessName.trim() || null}
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
                                ) : null
                              }
                            />
                            <ViewField
                              label={FIELD.phoneNumber}
                              value={saved.phone.trim() || null}
                            />
                          </ViewFieldList>
                        </ViewCard>
                      ),
                  },
                  {
                    key: "address",
                    filled: editing === "address" || !addressEmpty,
                    node:
                      editing === "address" ? (
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
                            <p className="type-body-muted -mt-2">
                              Add a province or territory later to enable
                              Canadian tax suggestions.
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
                            <div
                              className={`flex flex-col gap-4 ${sectionDividerClass}`}
                            >
                              <h4 className="type-subtitle-1">
                                {FIELD.shippingAddress}
                              </h4>
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
                                      patch.addressLine1 ??
                                      draft.shippingAddressLine1,
                                    shippingAddressLine2:
                                      patch.addressLine2 ??
                                      draft.shippingAddressLine2,
                                    shippingCity:
                                      patch.city ?? draft.shippingCity,
                                    shippingProvince:
                                      patch.province ?? draft.shippingProvince,
                                    shippingPostalCode:
                                      patch.postalCode ??
                                      draft.shippingPostalCode,
                                  })
                                }
                              />
                            </div>
                          ) : null}
                        </SectionEditor>
                      ) : addressEmpty ? (
                        archived ? null : (
                          <TertiaryButton onClick={() => startEdit("address")}>
                            Add Address
                          </TertiaryButton>
                        )
                      ) : (
                        <ViewCard
                          title="Address"
                          hideTitle
                          onEdit={archived ? undefined : () => startEdit("address")}
                        >
                          <ViewFieldList>
                            <ViewField
                              label={FIELD.billingAddress}
                              value={
                                billingLines ? billingLines.join(", ") : null
                              }
                            />
                            <ViewField
                              label={FIELD.shippingAddress}
                              value={
                                saved.hasShippingAddress && shippingLines
                                  ? shippingLines.join(", ")
                                  : null
                              }
                            />
                          </ViewFieldList>
                        </ViewCard>
                      ),
                  },
                  {
                    key: "contact",
                    filled: editing === "contact" || !contactEmpty,
                    node:
                      editing === "contact" ? (
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
                        archived ? null : (
                          <TertiaryButton onClick={() => startEdit("contact")}>
                            Add Contact Info
                          </TertiaryButton>
                        )
                      ) : (
                        <ViewCard
                          title="Contact Info"
                          hideTitle
                          onEdit={archived ? undefined : () => startEdit("contact")}
                        >
                          <ViewFieldList>
                            <ViewField
                              label={FIELD.contactName}
                              value={saved.contactName.trim() || null}
                            />
                            <ViewField
                              label={FIELD.contactEmail}
                              value={
                                saved.contactEmail.trim() ? (
                                  <>
                                    {saved.contactEmail}
                                    {saved.useContactEmailForComms ? (
                                      <p className="type-body-muted mt-0.5">
                                        All communications are sent to this
                                        email.
                                      </p>
                                    ) : null}
                                  </>
                                ) : null
                              }
                            />
                          </ViewFieldList>
                        </ViewCard>
                      ),
                  },
                  {
                    key: "tags",
                    filled: editing === "tags" || !tagsEmpty,
                    node:
                      editing === "tags" ? (
                        <SectionEditor
                          title="Tags"
                          onClose={closeEdit}
                          onSave={saveSection}
                        >
                          <p className="type-body-muted -mt-2">
                            Group accounts for filtering (for example, VIP or
                            Contractor).
                          </p>
                          <div className="flex flex-col gap-2.5">
                            {tagOptions.map((tag) => (
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
                        archived ? null : (
                          <TertiaryButton onClick={() => startEdit("tags")}>
                            Add Tags
                          </TertiaryButton>
                        )
                      ) : (
                        <ViewCard
                          title="Tags"
                          hideTitle
                          onEdit={archived ? undefined : () => startEdit("tags")}
                        >
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
                      ),
                  },
                  {
                    key: "notes",
                    filled: editing === "notes" || !notesEmpty,
                    node: internalNotesBlock,
                  },
                ] as const
              )
                .slice()
                .sort((a, b) => {
                  if (a.filled !== b.filled) {
                    return Number(b.filled) - Number(a.filled);
                  }
                  return (
                    CUSTOMER_DETAIL_ORDER.indexOf(a.key) -
                    CUSTOMER_DETAIL_ORDER.indexOf(b.key)
                  );
                })
                .filter((slot) => slot.node != null)
                .map((slot) => (
                  <div key={slot.key}>{slot.node}</div>
                ))}
            </section>
          </aside>
        </div>

      </main>

      {showCreateModal ? (
        <CreateCustomerModal
          onClose={cancelCreateModal}
          onCreated={(customer) => {
            setCustomerCreated(true);
            router.replace(`/customers/new?id=${customer.id}`);
          }}
        />
      ) : null}

      {lifecycleConfirm === "delete" ? (
        <Modal
          title="Delete customer"
          titleId="delete-customer-title"
          onClose={() => setLifecycleConfirm(null)}
          zClass="z-[220]"
          role="alertdialog"
          confirmLabel="Delete"
          confirmDanger
          onConfirm={() => {
            setLifecycleConfirm(null);
            router.push("/customers");
          }}
          body={`Are you sure you want to permanently delete ${customerDisplayName}? This action cannot be undone.`}
        />
      ) : null}

      {lifecycleConfirm === "archive" ? (
        <Modal
          title="Archive customer"
          titleId="archive-customer-title"
          onClose={() => setLifecycleConfirm(null)}
          zClass="z-[220]"
          role="alertdialog"
          confirmLabel="Archive"
          confirmDanger
          onConfirm={() => {
            if (customerId) {
              archiveCustomer(customerId);
              setArchived(true);
            }
            setLifecycleConfirm(null);
          }}
          body={`Are you sure you want to archive ${customerDisplayName}? They will be hidden from active lists but their financial records will be preserved.`}
        />
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
