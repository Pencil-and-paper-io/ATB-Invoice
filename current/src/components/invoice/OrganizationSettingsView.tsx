"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  GST_HST_REGISTER_URL,
  GST_REGISTRATION_OPTIONS,
} from "@/lib/place-of-supply";
import {
  DepositAccountBlock,
  paymentRequestSubtitle,
} from "./DepositAccountConnect";
import { TopNav } from "./TopNav";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { EditCloseButton, InfoTooltip, Modal, PencilIcon, TertiaryButton } from "./ui";

const TABS = ["Business Details", "Permissions", "Sub Users"] as const;
type TabId = (typeof TABS)[number];

type SectionKey =
  | "business"
  | "address"
  | "brand"
  | "payments"
  | "settings"
  | "tax"
  | "automations";

const SECTION_IDS = {
  organizationDetails: "organization-details",
  defaults: "default-settings",
  paymentOptions: "payment-options",
} as const;

const INVOICING_PERMISSIONS = [
  { id: "create-quotes", label: "Can create and send quotes" },
  { id: "create-invoices", label: "Can create and send invoices" },
  { id: "edit-customers", label: "Can edit customer details" },
  { id: "manage-payments", label: "Can manage payment options" },
  { id: "void-documents", label: "Can void quotes and invoices" },
  { id: "mark-paid", label: "Can mark invoices as paid" },
  { id: "view-reports", label: "Can view financial reports" },
  { id: "manage-org", label: "Can manage organization settings" },
  { id: "manage-sub-users", label: "Can manage sub-users" },
] as const;

type SubUser = {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  dateJoined: string | null;
};

const INITIAL_SUB_USERS: SubUser[] = [
  {
    id: "1",
    name: "Alex Rivera",
    email: "alex.rivera@horlicks.com",
    enabled: true,
    dateJoined: "Jan 12, 2025",
  },
  {
    id: "2",
    name: "Jordan Lee",
    email: "jordan.lee@horlicks.com",
    enabled: true,
    dateJoined: "Mar 3, 2025",
  },
  {
    id: "3",
    name: "Sam Patel",
    email: "sam.patel@horlicks.com",
    enabled: false,
    dateJoined: null,
  },
];

function tabFromParam(tab: string | null): TabId {
  if (!tab) return "Business Details";
  if (tab === "Permissions") return "Permissions";
  if (tab === "Sub Users" || tab === "Sub-Users") return "Sub Users";
  return "Business Details";
}

function sectionIdFromDeepLink(
  tab: string | null,
  hash: string | null,
): string | null {
  if (
    hash &&
    Object.values(SECTION_IDS).includes(
      hash as (typeof SECTION_IDS)[keyof typeof SECTION_IDS],
    )
  ) {
    return hash;
  }
  if (!tab) return null;
  if (tab === "Business Details" || tab === "Brand") {
    return SECTION_IDS.organizationDetails;
  }
  if (
    tab === "Payment Options" ||
    tab === "Defaults" ||
    tab === "Default Settings"
  ) {
    return SECTION_IDS.defaults;
  }
  return null;
}

const TAX_OPTIONS = ["Taxable", "Tax-exempt"] as const;

const TAX_SETTING_OPTIONS: {
  value: (typeof TAX_OPTIONS)[number];
  label: string;
  details: string;
}[] = [
  {
    value: "Taxable",
    label: "Taxable",
    details:
      "Choose this if you usually charge GST/HST on the goods or services you sell. Most vendors that sell taxable supplies (products, consulting, trades, and similar commercial services) fall here. New customers will inherit this as their default.",
  },
  {
    value: "Tax-exempt",
    label: "Tax-exempt",
    details:
      "Choose this if GST/HST does not apply to what you sell — show tax as blank/N/A (not $0.00). Common exempt vendors include most healthcare and dental practices, many educational providers, child care for ages 14 and under, most financial services, and long-term residential landlords. If you’re unsure, check CRA guidance or your accountant.",
  },
];

const PAYMENT_TERMS_OPTIONS = ["Net 30", "Net 15", "Upon receipt"] as const;

/** Single source for edit FieldLabel + view ViewField copy. */
const FIELD = {
  businessName: "Business Name",
  gstHstNumber: "GST/HST Number",
  gstRegistration:
    "A GST/HST number is needed to charge tax on your invoices once your business has earned $30,000 or more.",
  gstRegistrationStatus: "GST/HST status",
  email: "Email",
  phoneNumber: "Phone Number",
  businessAddress: "Business Address",
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "City",
  province: "Province",
  postalCode: "Postal Code",
  brandColor: "Brand Color",
  brandLogo: "Brand Logo",
  currency: "Currency",
  taxSetting: "Tax Setting",
  quoteExpiry: "Quote Expiry",
  paymentTerms: "Payment Terms",
  autoSend: "Auto-send",
  reminders: "Reminders",
  receipts: "Receipts",
} as const;

const inputClass = UI_CLASS.input;
const hoverCardClass = UI_CLASS.hoverCard;
const sectionShellClass = UI_CLASS.sectionShell;
const sectionDividerClass =
  "mt-6 border-t border-dashed border-black/15 pt-6";

function cloneSettings(settings: OrganizationSettings): OrganizationSettings {
  return {
    ...settings,
    paymentMethods: settings.paymentMethods.map((method) => ({ ...method })),
    paymentPreferences: [...settings.paymentPreferences],
  };
}

function formatAddress(parts: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
}) {
  const lines = [
    parts.addressLine1,
    parts.addressLine2,
    [parts.city, parts.province].filter(Boolean).join(", "),
    parts.postalCode,
  ].filter(Boolean);
  return lines.length ? lines.join(", ") : undefined;
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
  tip,
  tone = "view",
}: {
  title: string;
  tip?: string;
  tone?: "view" | "edit";
}) {
  return (
    <div className="mb-5 flex items-center gap-1.5 pr-8">
      <h3
        className={`type-headline-6 ${
          tone === "edit" ? "text-black" : "text-black/45"
        }`}
      >
        {title}
      </h3>
      {tip ? <InfoTooltip text={tip} /> : null}
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

/** Horizontal label/value pairs for compact view-mode rows. */
function ViewFieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function ViewCard({
  title,
  tip,
  onEdit,
  children,
  id,
  asDiv = false,
}: {
  title: string;
  tip?: string;
  onEdit: () => void;
  children: ReactNode;
  id?: string;
  /** Use a div shell when children include links/buttons (avoids nested interactive). */
  asDiv?: boolean;
}) {
  const shellClass = `relative w-full scroll-mt-8 px-7 pb-5 pt-7 text-left ${hoverCardClass}`;

  if (asDiv) {
    return (
      <div
        id={id}
        role="button"
        tabIndex={0}
        onClick={onEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onEdit();
          }
        }}
        className={`${shellClass} cursor-pointer`}
      >
        <BoxTitle title={title} tip={tip} tone="view" />
        <div className="pr-8">{children}</div>
        <span className="absolute right-4 top-4 text-black/30" aria-hidden>
          <PencilIcon />
        </span>
      </div>
    );
  }

  return (
    <button id={id} type="button" onClick={onEdit} className={shellClass}>
      <BoxTitle title={title} tip={tip} tone="view" />
      <div className="pr-8">{children}</div>
      <span className="absolute right-4 top-4 text-black/30" aria-hidden>
        <PencilIcon />
      </span>
    </button>
  );
}

function SectionEditor({
  title,
  tip,
  onClose,
  onSave,
  children,
  outsideDismissEnabled = true,
  saveDisabled = false,
}: {
  title: string;
  tip?: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
  outsideDismissEnabled?: boolean;
  saveDisabled?: boolean;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(formRef, onClose, outsideDismissEnabled);

  return (
    <div ref={formRef} className={`relative px-7 pb-5 pt-7 ${hoverCardClass}`}>
      <EditCloseButton onClick={onClose} />
      <BoxTitle title={title} tip={tip} tone="edit" />
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
            className="ui-btn-primary h-9 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-black">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border ${
            checked
              ? "border-prime-blue bg-prime-blue text-white"
              : "border-black/25 bg-white"
          }`}
          aria-hidden
        >
          {checked ? <CheckMark /> : null}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </label>
      {checked && children ? <div className="pl-7">{children}</div> : null}
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
      <path
        d="M1 5.2 4.2 8.5 11 1.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultCheckIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
      <path
        d="M1 5.2 4.8 8.8 13 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function PaymentOptionDetails({
  details,
  muted = false,
}: {
  details: readonly { label: string; text: string; italic?: boolean }[];
  muted?: boolean;
}) {
  if (!details.length) return null;
  return (
    <ul
      className={`mt-2 list-disc space-y-1 pl-5 text-sm ${
        muted ? "text-black/40" : "text-black"
      }`}
    >
      {details.map((detail) => (
        <li key={`${detail.label}-${detail.text}`}>
          <span className={detail.italic ? "italic" : undefined}>
            {detail.label}: {detail.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function needsDepositAccount(id: PaymentMethodId) {
  return id === "interac" || id === "eft";
}

function OrgPaymentMethodRow({
  methodId,
  label,
  details,
  enabled,
  onToggle,
  subtitle,
  accountDraft = "",
  accountSaved = false,
  onAccountDraftChange,
  onConfirmAccount,
  comingSoon = false,
  readOnly = false,
}: {
  methodId?: PaymentMethodId;
  label: ReactNode;
  details: readonly { label: string; text: string; italic?: boolean }[];
  enabled: boolean;
  onToggle?: () => void;
  subtitle?: ReactNode;
  accountDraft?: string;
  accountSaved?: boolean;
  onAccountDraftChange?: (value: string) => void;
  onConfirmAccount?: () => void;
  comingSoon?: boolean;
  readOnly?: boolean;
}) {
  const showConnect =
    Boolean(methodId) && needsDepositAccount(methodId!) && enabled && !comingSoon;

  return (
    <div
      className={`rounded-[10px] border px-4 py-3 ${
        comingSoon
          ? "border-black/20 bg-[#F3F3F3]"
          : "border-black/10 bg-white"
      }`}
    >
      <label
        className={`flex items-start gap-3 ${
          comingSoon || readOnly || !onToggle
            ? "cursor-default"
            : "cursor-pointer"
        }`}
      >
        {readOnly ? (
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-prime-blue"
            aria-hidden
          >
            {enabled ? <DefaultCheckIcon /> : null}
          </span>
        ) : (
          <input
            type="checkbox"
            checked={enabled}
            disabled={comingSoon || !onToggle}
            onChange={() => onToggle?.()}
            className="mt-0.5 h-4 w-4 rounded border-black/25 accent-prime-blue disabled:cursor-not-allowed disabled:opacity-60"
          />
        )}
        <span className="min-w-0 flex-1">
          <span
            className={`inline-flex flex-wrap items-center gap-2 text-sm font-semibold ${
              comingSoon ? "text-black/55" : "text-black"
            }`}
          >
            {label}
          </span>
          {enabled && subtitle ? (
            <span className="mt-1 block text-sm font-normal leading-5 text-black">
              {subtitle}
            </span>
          ) : null}
        </span>
      </label>
      {enabled && !comingSoon ? (
        <div className="mt-3 pl-7">
          <PaymentOptionDetails details={details} />
          {showConnect ? (
            readOnly ? (
              accountSaved && accountDraft.trim() ? (
                <DepositAccountBlock
                  ariaLabel={`${label} payment destination`}
                  value={accountDraft}
                  onChange={() => undefined}
                  saved
                />
              ) : (
                <p className="mt-3 text-sm text-delete-red">
                  Payment destination not connected.
                </p>
              )
            ) : onAccountDraftChange && onConfirmAccount ? (
              <DepositAccountBlock
                ariaLabel={`${label} payment destination`}
                value={accountDraft}
                onChange={onAccountDraftChange}
                onSave={onConfirmAccount}
                saved={accountSaved}
              />
            ) : null
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PermissionCheckbox({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={onChange}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-[3px] border ${
        disabled
          ? checked
            ? "cursor-default border-black/25 bg-black/35"
            : "cursor-default border-black/20 bg-white"
          : checked
            ? "border-prime-blue bg-prime-blue"
            : "border-black/25 bg-white hover:border-black/40"
      }`}
    >
      {checked ? <CheckMark /> : null}
    </button>
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
  useDismissOnOutsideClick(ref, () => setOpen(false), open);

  const normalized = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : { value: option.code, label: `${option.code} — ${option.name}` },
  );
  const selected =
    normalized.find((entry) => entry.value === value) ?? normalized[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span>{selected?.label}</span>
        <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
          <path
            d="M1 1l4.5 4L10 1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-black/15 bg-white py-1 shadow-lg">
          {normalized.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-black/[0.04]"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path
        d="m5.5 17 4-4.5 3 3 3.5-4.5L18.5 17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusEnabledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="#22A06B" />
      <path
        d="M4.8 8.2 6.7 10.2 11.2 5.6"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusDisabledIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="#9CA3AF" strokeWidth="1.5" />
      <path d="M4.5 4.5 11.5 11.5" stroke="#9CA3AF" strokeWidth="1.5" />
    </svg>
  );
}

export function OrganizationSettingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(() => tabFromParam(tabParam));
  const [saved, setSaved] = useState<OrganizationSettings | null>(null);
  const [draft, setDraft] = useState<OrganizationSettings | null>(null);
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [discardWarning, setDiscardWarning] = useState(false);
  const [gstHstShowError, setGstHstShowError] = useState(false);
  const [accountDrafts, setAccountDrafts] = useState<
    Record<"interac" | "eft", string>
  >({ interac: "", eft: "" });
  const [accountConfirmed, setAccountConfirmed] = useState<
    Record<"interac" | "eft", boolean>
  >({ interac: false, eft: false });
  const pendingActionRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subUserPermissions, setSubUserPermissions] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      INVOICING_PERMISSIONS.map((permission) => [
        permission.id,
        [
          "create-quotes",
          "create-invoices",
          "edit-customers",
          "mark-paid",
        ].includes(permission.id),
      ]),
    ),
  );
  const [subUsers, setSubUsers] = useState<SubUser[]>(INITIAL_SUB_USERS);

  useEffect(() => {
    window.setTimeout(() => {
      const next = loadOrganizationSettings();
      setSaved(cloneSettings(next));
      setDraft(cloneSettings(next));
      setEditing(null);
    }, 0);
  }, []);

  useEffect(() => {
    setTab(tabFromParam(tabParam));
  }, [tabParam]);

  useEffect(() => {
    if (!saved || tab !== "Business Details") return;

    const hash =
      typeof window !== "undefined" && window.location.hash
        ? window.location.hash.replace(/^#/, "")
        : null;
    const targetId = sectionIdFromDeepLink(tabParam, hash);
    if (!targetId) return;

    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, [saved, tab, tabParam]);

  function isDirty() {
    if (!saved || !draft || !editing) return false;
    return JSON.stringify(saved) !== JSON.stringify(draft);
  }

  function runOrWarn(action: () => void) {
    if (isDirty()) {
      pendingActionRef.current = action;
      setDiscardWarning(true);
      return;
    }
    action();
  }

  function confirmDiscard() {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setDiscardWarning(false);
    if (saved) setDraft(cloneSettings(saved));
    setEditing(null);
    action?.();
  }

  function keepEditing() {
    pendingActionRef.current = null;
    setDiscardWarning(false);
  }

  function selectTab(next: TabId) {
    runOrWarn(() => {
      if (saved) setDraft(cloneSettings(saved));
      setEditing(null);
      setTab(next);
      router.replace(`/organization?tab=${encodeURIComponent(next)}`, {
        scroll: false,
      });
    });
  }

  function syncAccountConnectState(settings: OrganizationSettings) {
    const interac =
      settings.paymentMethods.find((method) => method.id === "interac")
        ?.accountLabel ?? "";
    const eft =
      settings.paymentMethods.find((method) => method.id === "eft")
        ?.accountLabel ?? "";
    setAccountDrafts({ interac, eft });
    setAccountConfirmed({
      interac: Boolean(interac.trim()),
      eft: Boolean(eft.trim()),
    });
  }

  function startEdit(section: SectionKey) {
    if (!saved) return;
    if (editing && editing !== section) {
      runOrWarn(() => {
        const next = cloneSettings(saved);
        setDraft(next);
        setGstHstShowError(false);
        if (section === "payments") syncAccountConnectState(next);
        setEditing(section);
      });
      return;
    }
    const next = cloneSettings(saved);
    setDraft(next);
    setGstHstShowError(false);
    if (section === "payments") syncAccountConnectState(next);
    setEditing(section);
  }

  function closeEdit() {
    runOrWarn(() => {
      if (saved) {
        setDraft(cloneSettings(saved));
        syncAccountConnectState(saved);
      }
      setGstHstShowError(false);
      setEditing(null);
    });
  }

  function saveSection() {
    if (!draft) return;
    const next = cloneSettings(draft);
    setSaved(next);
    setDraft(next);
    setEditing(null);
    setDiscardWarning(false);
    pendingActionRef.current = null;
    saveOrganizationSettings(next);
  }

  function patchDraft(patch: Partial<OrganizationSettings>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function togglePaymentMethod(id: PaymentMethodId) {
    const currentlyEnabled = Boolean(
      draft?.paymentMethods.find((method) => method.id === id)?.enabled,
    );
    const enabling = !currentlyEnabled;

    setDraft((prev) => {
      if (!prev) return prev;
      const label = paymentMethodLabel(id);
      const paymentMethods = prev.paymentMethods.map((method) =>
        method.id === id
          ? {
              ...method,
              enabled: enabling,
              accountLabel: enabling
                ? method.accountLabel
                : needsDepositAccount(id)
                  ? ""
                  : method.accountLabel,
            }
          : method,
      );
      const paymentPreferences = enabling
        ? prev.paymentPreferences.includes(label)
          ? prev.paymentPreferences
          : [...prev.paymentPreferences, label]
        : prev.paymentPreferences.filter((item) => item !== label);
      return { ...prev, paymentMethods, paymentPreferences };
    });

    if (needsDepositAccount(id) && (id === "interac" || id === "eft") && !enabling) {
      setAccountDrafts((prev) => ({ ...prev, [id]: "" }));
      setAccountConfirmed((prev) => ({ ...prev, [id]: false }));
    }
  }

  function updateAccountDraft(id: "interac" | "eft", value: string) {
    setAccountDrafts((prev) => ({ ...prev, [id]: value }));
    setAccountConfirmed((prev) => ({ ...prev, [id]: false }));
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        paymentMethods: prev.paymentMethods.map((method) =>
          method.id === id ? { ...method, accountLabel: "" } : method,
        ),
      };
    });
  }

  function confirmAccount(id: "interac" | "eft") {
    const accountLabel = accountDrafts[id].trim();
    if (!accountLabel) return;
    setAccountConfirmed((prev) => ({ ...prev, [id]: true }));
    setDraft((prev) => {
      if (!prev) return prev;
      const label = paymentMethodLabel(id);
      const prefs = prev.paymentPreferences.includes(label)
        ? prev.paymentPreferences
        : [...prev.paymentPreferences, label];
      return {
        ...prev,
        paymentMethods: prev.paymentMethods.map((method) =>
          method.id === id
            ? { ...method, enabled: true, accountLabel }
            : method,
        ),
        paymentPreferences: prefs,
      };
    });
  }

  function handleLogoReplace(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Logo must be 5MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patchDraft({ logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  function toggleSubUserAccess(id: string) {
    setSubUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              enabled: !user.enabled,
              dateJoined: !user.enabled
                ? (user.dateJoined ??
                  new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }))
                : user.dateJoined,
            }
          : user,
      ),
    );
  }

  const enabledSubUserCount = subUsers.filter((user) => user.enabled).length;

  if (!saved || !draft) {
    return (
      <div className="min-h-screen bg-page-grey text-black">
        <TopNav />
        <main className="mx-auto max-w-[960px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
          <p className="type-body-muted">Loading…</p>
        </main>
      </div>
    );
  }

  const businessAddress = formatAddress({
    addressLine1: saved.addressLine1,
    addressLine2: saved.addressLine2,
    city: saved.city,
    province: saved.province,
    postalCode: saved.postalCode,
  });
  const addressEmpty = !businessAddress;

  return (
    <div className="min-h-screen bg-page-grey text-black">
      <TopNav />

      <main className="mx-auto max-w-[960px] px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
        <div className="mb-6">
          <h1 className="type-page-title">Manage Organization</h1>
        </div>

        <div className="mb-6 border-b border-black/15">
          <div className="flex flex-wrap gap-1">
            {TABS.map((id) => {
              const active = tab === id;
              const count =
                id === "Sub Users" ? String(subUsers.length) : null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTab(id)}
                  className={`rounded-t-md px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-midnight-ink text-white"
                      : "bg-transparent text-black hover:bg-black/[0.04]"
                  }`}
                >
                  {id}
                  {count ? (
                    <span
                      className={`ml-1.5 ${
                        active ? "text-white/70" : "text-black/40"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "Business Details" ? (
          <div className="flex flex-col gap-5">
            <section
              id={SECTION_IDS.organizationDetails}
              className={`${sectionShellClass} scroll-mt-8`}
            >
              <SectionHeader title="Organization Details" />

              {editing === "business" ? (
                <SectionEditor
                  title="Business Details"
                  onClose={closeEdit}
                  onSave={saveSection}
                >
                  <div>
                    <FieldLabel
                      htmlFor="org-business-name"
                      tip="The official name of your business—the one you use on government paperwork and contracts."
                    >
                      {FIELD.businessName}
                    </FieldLabel>
                    <input
                      id="org-business-name"
                      className={inputClass}
                      value={draft.businessName}
                      onChange={(event) =>
                        patchDraft({ businessName: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="org-email"
                      tip="The email customers use to reach you about quotes and invoices."
                    >
                      {FIELD.email}
                    </FieldLabel>
                    <input
                      id="org-email"
                      type="email"
                      className={inputClass}
                      value={draft.email}
                      onChange={(event) =>
                        patchDraft({ email: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel
                      htmlFor="org-phone"
                      tip="Your business phone number, shown on quotes and invoices."
                    >
                      {FIELD.phoneNumber}
                    </FieldLabel>
                    <input
                      id="org-phone"
                      type="tel"
                      className={inputClass}
                      value={draft.phone}
                      onChange={(event) =>
                        patchDraft({ phone: event.target.value })
                      }
                    />
                  </div>
                </SectionEditor>
              ) : (
                <ViewCard
                  title="Business Details"
                  onEdit={() => startEdit("business")}
                >
                  <ViewFieldRow>
                    <ViewField
                      label={FIELD.businessName}
                      value={displayOrNa(saved.businessName)}
                    />
                    <ViewField
                      label={FIELD.email}
                      value={displayOrNa(saved.email)}
                    />
                    <ViewField
                      label={FIELD.phoneNumber}
                      value={displayOrNa(saved.phone)}
                    />
                  </ViewFieldRow>
                </ViewCard>
              )}

              {editing === "address" ? (
                <SectionEditor
                  title="Business Address"
                  onClose={closeEdit}
                  onSave={saveSection}
                >
                  <div>
                    <FieldLabel htmlFor="org-line1">
                      {FIELD.addressLine1}
                    </FieldLabel>
                    <input
                      id="org-line1"
                      className={inputClass}
                      value={draft.addressLine1}
                      onChange={(event) =>
                        patchDraft({ addressLine1: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="org-line2">
                      {FIELD.addressLine2}
                    </FieldLabel>
                    <input
                      id="org-line2"
                      className={inputClass}
                      value={draft.addressLine2}
                      onChange={(event) =>
                        patchDraft({ addressLine2: event.target.value })
                      }
                    />
                  </div>
                  <div className="flex w-full flex-col gap-6">
                    <div className="w-full">
                      <FieldLabel htmlFor="org-city">{FIELD.city}</FieldLabel>
                      <input
                        id="org-city"
                        className={inputClass}
                        value={draft.city}
                        onChange={(event) =>
                          patchDraft({ city: event.target.value })
                        }
                      />
                    </div>
                    <div className="w-full">
                      <FieldLabel htmlFor="org-province">
                        {FIELD.province}
                      </FieldLabel>
                      <input
                        id="org-province"
                        className={inputClass}
                        value={draft.province}
                        onChange={(event) =>
                          patchDraft({ province: event.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel htmlFor="org-postal">
                      {FIELD.postalCode}
                    </FieldLabel>
                    <input
                      id="org-postal"
                      className={inputClass}
                      value={draft.postalCode}
                      onChange={(event) =>
                        patchDraft({ postalCode: event.target.value })
                      }
                    />
                  </div>
                </SectionEditor>
              ) : addressEmpty ? (
                <TertiaryButton onClick={() => startEdit("address")}>
                  Add Business Address
                </TertiaryButton>
              ) : (
                <ViewCard
                  title="Business Address"
                  onEdit={() => startEdit("address")}
                >
                  <ViewFieldList>
                    <ViewField
                      label={FIELD.businessAddress}
                      value={businessAddress || <EmptyValue />}
                    />
                  </ViewFieldList>
                </ViewCard>
              )}

              {editing === "brand" ? (
                <SectionEditor
                  title="Brand"
                  tip="These styles apply to new invoices. Sent invoices keep the look they had when they were sent."
                  onClose={closeEdit}
                  onSave={saveSection}
                >
                  <div>
                    <p className="type-subtitle-1">{FIELD.brandColor}</p>
                    <p className="type-body-muted mt-1 mb-3">
                      This color will be shown at the top and bottom of your
                      invoice, and will not appear on or behind any text.
                    </p>
                    <div className="flex max-w-sm items-center gap-3 rounded border border-black/20 bg-input-grey px-3 py-2.5">
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border border-black/10"
                        style={{ background: draft.brandColor }}
                        aria-hidden
                      />
                      <input
                        className="w-full bg-transparent type-body outline-none"
                        value={draft.brandColor}
                        onChange={(event) =>
                          patchDraft({ brandColor: event.target.value })
                        }
                        aria-label={FIELD.brandColor}
                      />
                      <input
                        type="color"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(draft.brandColor)
                            ? draft.brandColor
                            : "#FF7F30"
                        }
                        onChange={(event) =>
                          patchDraft({
                            brandColor: event.target.value.toUpperCase(),
                          })
                        }
                        className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                        aria-label="Pick brand color"
                      />
                    </div>
                  </div>
                  <div className={sectionDividerClass}>
                    <p className="type-subtitle-1">{FIELD.brandLogo}</p>
                    <p className="type-body-muted mt-1 mb-4">
                      Aim for at least 200x200 or larger for best quality. Tip:
                      Square or horizontal logos work best. Files may be up to
                      5mb and in png, jpg, or webp format.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md bg-cloud-grey text-black/35">
                        {draft.logoDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={draft.logoDataUrl}
                            alt="Brand logo"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <ImagePlaceholderIcon />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          className={UI_CLASS.btnPrimary}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {draft.logoDataUrl ? "Replace" : "Upload"}
                        </button>
                        {draft.logoDataUrl ? (
                          <button
                            type="button"
                            className={UI_CLASS.btnSecondary}
                            onClick={() => patchDraft({ logoDataUrl: null })}
                          >
                            Delete
                          </button>
                        ) : null}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            handleLogoReplace(event.target.files?.[0] ?? null);
                            event.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SectionEditor>
              ) : (
                <ViewCard
                  title="Brand"
                  tip="These styles apply to new invoices. Sent invoices keep the look they had when they were sent."
                  onEdit={() => startEdit("brand")}
                >
                  <ViewFieldRow>
                    <ViewField
                      label={FIELD.brandColor}
                      value={
                        <span className="flex items-center gap-3">
                          <span
                            className="h-8 w-8 shrink-0 rounded-full border border-black/10"
                            style={{ background: saved.brandColor }}
                            aria-hidden
                          />
                          {saved.brandColor}
                        </span>
                      }
                    />
                    <ViewField
                      label={FIELD.brandLogo}
                      value={
                        <span className="flex items-center gap-3">
                          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-cloud-grey text-black/35">
                            {saved.logoDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={saved.logoDataUrl}
                                alt="Brand logo"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <ImagePlaceholderIcon />
                            )}
                          </span>
                          {saved.logoDataUrl ? "Uploaded" : "No logo yet"}
                        </span>
                      }
                    />
                  </ViewFieldRow>
                </ViewCard>
              )}
            </section>

            <section
              id={SECTION_IDS.defaults}
              className={`${sectionShellClass} scroll-mt-8`}
            >
              <SectionHeader
                title="Default Settings"
                tip="These cascade to new customers. Customers can still override them on their profile."
              />

              {editing === "payments" ? (
                <SectionEditor
                  title="Payment Options"
                  onClose={closeEdit}
                  onSave={saveSection}
                >
                  <p className="type-body-muted">
                    Choose how you want to receive payments by default. You can
                    always change this for specific customers or invoices later.
                  </p>
                  <div className="flex flex-col gap-3">
                    {draft.paymentMethods.map((method) => {
                      const meta = CORE_PAYMENT_METHODS.find(
                        (entry) => entry.id === method.id,
                      );
                      if (!meta) return null;
                      const label = paymentMethodLabel(method.id);
                      const orgDisplayName = draft.useLegalNameOnInvoices
                        ? draft.businessName
                        : draft.tradingAsName.trim() || draft.businessName;
                      const needsAccount = needsDepositAccount(method.id);

                      return (
                        <OrgPaymentMethodRow
                          key={method.id}
                          methodId={method.id}
                          label={label}
                          details={meta.details}
                          enabled={method.enabled}
                          onToggle={() => togglePaymentMethod(method.id)}
                          subtitle={
                            needsAccount
                              ? paymentRequestSubtitle(
                                  orgDisplayName,
                                  draft.email,
                                )
                              : undefined
                          }
                          accountDraft={
                            method.id === "interac" || method.id === "eft"
                              ? accountDrafts[method.id]
                              : ""
                          }
                          accountSaved={
                            method.id === "interac" || method.id === "eft"
                              ? accountConfirmed[method.id]
                              : false
                          }
                          onAccountDraftChange={
                            method.id === "interac" || method.id === "eft"
                              ? (value) =>
                                  updateAccountDraft(method.id as "interac" | "eft", value)
                              : undefined
                          }
                          onConfirmAccount={
                            method.id === "interac" || method.id === "eft"
                              ? () =>
                                  confirmAccount(method.id as "interac" | "eft")
                              : undefined
                          }
                        />
                      );
                    })}
                    <OrgPaymentMethodRow
                      label={
                        <>
                          Credit Card
                          <span className="rounded-md bg-black/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black/70">
                            Coming Soon
                          </span>
                        </>
                      }
                      details={[]}
                      enabled={false}
                      comingSoon
                    />
                  </div>
                </SectionEditor>
              ) : (
                <ViewCard
                  id={SECTION_IDS.paymentOptions}
                  title="Payment Options"
                  onEdit={() => startEdit("payments")}
                  asDiv
                >
                  <div className="flex flex-col">
                    {saved.paymentMethods
                      .filter((method) => method.enabled)
                      .map((method) => {
                      const label = paymentMethodLabel(method.id);
                      const account = method.accountLabel?.trim();

                      return (
                        <div key={method.id} className="py-3.5">
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-prime-blue"
                              aria-hidden
                            >
                              <DefaultCheckIcon />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="type-subtitle-1 text-black">
                                {label}
                              </p>
                              {account ? (
                                <p className="mt-1 text-sm text-black/70">
                                  {account}
                                </p>
                              ) : needsDepositAccount(method.id) ? (
                                <p className="mt-1 text-sm text-delete-red">
                                  Payment destination not connected
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!saved.paymentMethods.some((method) => method.enabled) ? (
                      <p className="type-body-muted py-3.5">
                        No payment options enabled by default.
                      </p>
                    ) : null}
                  </div>
                </ViewCard>
              )}

              {editing === "settings" ? (
                <SectionEditor
                  title="Invoice and Quote Details"
                  onClose={closeEdit}
                  onSave={saveSection}
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <FieldLabel tip="All quotes and invoices are locked to Canadian Dollars.">
                        {FIELD.currency}
                      </FieldLabel>
                      <div className="flex h-[42px] items-center justify-between gap-3 rounded border border-black/15 bg-[#E8E8E8] px-3.5 text-sm text-midnight-ink">
                        <span>CAD — Canadian Dollar</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden
                          className="shrink-0 text-black/50"
                        >
                          <rect
                            x="3.5"
                            y="7"
                            width="9"
                            height="6.5"
                            rx="1.2"
                            stroke="currentColor"
                            strokeWidth="1.3"
                          />
                          <path
                            d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="sr-only">(locked)</span>
                      </div>
                    </div>
                    <div>
                      <FieldLabel
                        htmlFor="org-quote-expiry"
                        tip="How long new quotes stay open before they expire."
                      >
                        {FIELD.quoteExpiry}
                      </FieldLabel>
                      <div className="relative">
                        <input
                          id="org-quote-expiry"
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
                      <FieldLabel tip="How soon customers are usually expected to pay after you send an invoice.">
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
                  onEdit={() => startEdit("settings")}
                >
                  <ViewFieldRow>
                    <ViewField
                      label={FIELD.currency}
                      value="CAD — Canadian Dollar"
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
                  </ViewFieldRow>
                </ViewCard>
              )}

              {editing === "tax" ? (
                <SectionEditor
                  title="Tax Info"
                  onClose={closeEdit}
                  onSave={saveSection}
                  saveDisabled={
                    draft.gstRegistrationStatus === "registered" &&
                    !isValidGstHstNumber(draft.gstHstNumber)
                  }
                >
                  <div>
                    <p className="type-body mb-3 text-black">
                      {FIELD.gstRegistration}
                    </p>
                    <div className="mt-1 flex flex-col gap-3">
                      {GST_REGISTRATION_OPTIONS.map((option) => (
                        <div key={option.value}>
                          <label className="flex items-start gap-2 text-sm leading-5 text-black">
                            <input
                              type="radio"
                              name="org-gst-registration"
                              className="mt-0.5 accent-prime-blue"
                              checked={
                                draft.gstRegistrationStatus === option.value
                              }
                              onChange={() => {
                                setGstHstShowError(false);
                                patchDraft({
                                  gstRegistrationStatus: option.value,
                                  taxStatus:
                                    option.value === "small_supplier"
                                      ? "Tax-exempt"
                                      : "Taxable",
                                  gstHstNumber:
                                    option.value === "registered"
                                      ? draft.gstHstNumber
                                      : "",
                                });
                              }}
                            />
                            <span>{option.label}</span>
                          </label>
                          {option.value === "pending_number" &&
                          draft.gstRegistrationStatus === "pending_number" ? (
                            <p className="mt-1.5 pl-6 text-sm leading-5 text-black">
                              You need a GST/HST number once you exceed $30,000
                              in revenue.{" "}
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
                          draft.gstRegistrationStatus === "registered" ? (
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
                                  id="org-gst-bn"
                                  inputMode="numeric"
                                  maxLength={9}
                                  className={`${inputClass} !w-[9.5rem] shrink-0`}
                                  value={
                                    parseGstHstNumber(draft.gstHstNumber).bn
                                  }
                                  onChange={(event) => {
                                    const bn = event.target.value
                                      .replace(/[^\d]/g, "")
                                      .slice(0, 9);
                                    const { account } = parseGstHstNumber(
                                      draft.gstHstNumber,
                                    );
                                    setGstHstShowError(false);
                                    patchDraft({
                                      gstHstNumber: formatGstHstNumber(
                                        bn,
                                        account,
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
                                  id="org-gst-account"
                                  inputMode="numeric"
                                  maxLength={4}
                                  className={`${inputClass} !w-[5.5rem] shrink-0`}
                                  value={
                                    parseGstHstNumber(draft.gstHstNumber)
                                      .account
                                  }
                                  onChange={(event) => {
                                    const account = event.target.value
                                      .replace(/[^\d]/g, "")
                                      .slice(0, 4);
                                    const { bn } = parseGstHstNumber(
                                      draft.gstHstNumber,
                                    );
                                    setGstHstShowError(false);
                                    patchDraft({
                                      gstHstNumber: formatGstHstNumber(
                                        bn,
                                        account,
                                      ),
                                    });
                                  }}
                                  placeholder="0001"
                                  aria-label="GST/HST account number, 4 digits"
                                />
                              </div>
                              {gstHstShowError &&
                              !isValidGstHstNumber(draft.gstHstNumber) ? (
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
                  </div>

                  {isValidGstHstNumber(draft.gstHstNumber) ? (
                    <div className={sectionDividerClass}>
                      <FieldLabel>{FIELD.taxSetting}</FieldLabel>
                      <p className="type-body-muted mb-3">
                        This is your organization default for new customers.
                        Pick the option that best matches the kind of vendor you
                        are.
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
                                name="org-tax-setting"
                                className="mt-0.5 h-4 w-4 accent-prime-blue"
                                checked={draft.taxStatus === option.value}
                                onChange={() =>
                                  patchDraft({ taxStatus: option.value })
                                }
                              />
                              <span className="font-semibold">
                                {option.label}
                              </span>
                            </label>
                            <p className="mt-1.5 pl-6 text-sm leading-5 text-black/70">
                              {option.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </SectionEditor>
              ) : (
                <ViewCard title="Tax Info" onEdit={() => startEdit("tax")}>
                  {isValidGstHstNumber(saved.gstHstNumber) ? (
                    <ViewFieldRow>
                      <ViewField
                        label={FIELD.gstHstNumber}
                        value={displayOrNa(saved.gstHstNumber)}
                      />
                      <ViewField
                        label={FIELD.taxSetting}
                        value={
                          TAX_SETTING_OPTIONS.find(
                            (option) => option.value === saved.taxStatus,
                          )?.label ?? saved.taxStatus
                        }
                      />
                    </ViewFieldRow>
                  ) : (
                    <p className="type-body whitespace-nowrap">
                      {GST_REGISTRATION_OPTIONS.find(
                        (option) =>
                          option.value === saved.gstRegistrationStatus,
                      )?.label ?? "—"}
                    </p>
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
                    You can customize these on individual customers, quotes,
                    and invoices later.
                  </p>
                  <div className="flex flex-col gap-3">
                    <CheckboxRow
                      checked={draft.autoSend}
                      onChange={(checked) =>
                        patchDraft({ autoSend: checked })
                      }
                      label={`${FIELD.autoSend}: Send invoices automatically on their issuance date.`}
                    />
                    <CheckboxRow
                      checked={draft.reminders}
                      onChange={(checked) =>
                        patchDraft({ reminders: checked })
                      }
                      label={`${FIELD.reminders}: Send quote and invoice reminders before expiry or due date.`}
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
                      onChange={(checked) =>
                        patchDraft({ receipts: checked })
                      }
                      label={`${FIELD.receipts}: Auto-send a receipt when a payment is marked received.`}
                    />
                  </div>
                </SectionEditor>
              ) : (
                <ViewCard
                  title="Default Automations"
                  onEdit={() => startEdit("automations")}
                >
                  <ViewFieldRow>
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
                  </ViewFieldRow>
                </ViewCard>
              )}
            </section>
          </div>
        ) : null}

        {tab === "Permissions" ? (
          <div>
            <div className="mb-4 rounded-lg border border-[#B9D4F5] bg-[#E8F3FF] px-4 py-3 text-sm text-black">
              Editing sub-user permissions will impact{" "}
              <strong>all {enabledSubUserCount} accounts</strong> with the
              sub-user role on your invoicing platform.
            </div>
            <p className="type-body-muted mb-4">
              Admin permissions are not editable, and are only assigned to{" "}
              {saved.email || "the organization admin"}. Sub-users are all other
              accounts that have been added.
            </p>

            <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
              <div className="grid grid-cols-[1fr_88px_88px] gap-3 border-b border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-black/45">
                <span>Permission</span>
                <span className="text-center">Admin</span>
                <span className="text-center">Sub-User</span>
              </div>
              <ul>
                {INVOICING_PERMISSIONS.map((permission, index) => (
                  <li
                    key={permission.id}
                    className={`grid grid-cols-[1fr_88px_88px] items-center gap-3 px-5 py-4 text-sm ${
                      index < INVOICING_PERMISSIONS.length - 1
                        ? "border-b border-black/10"
                        : ""
                    }`}
                  >
                    <span>{permission.label}</span>
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked
                        disabled
                        ariaLabel={`${permission.label} — Admin (always on)`}
                      />
                    </div>
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={Boolean(subUserPermissions[permission.id])}
                        ariaLabel={`${permission.label} — Sub-User`}
                        onChange={() =>
                          setSubUserPermissions((prev) => ({
                            ...prev,
                            [permission.id]: !prev[permission.id],
                          }))
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "Sub Users" ? (
          <div>
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#B9D4F5] bg-[#E8F3FF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-black">
                To add a new account to your ATB ecosystem, add another sub-user
                through ATB Business.
              </p>
              <button
                type="button"
                className={`${UI_CLASS.btnSecondary} shrink-0 whitespace-nowrap`}
                onClick={() =>
                  window.alert(
                    "Add Sub-User is a prototype stub — wiring comes later.",
                  )
                }
              >
                Add Sub-User
                <span aria-hidden className="ml-1">
                  →
                </span>
              </button>
            </div>

            <p className="type-body-muted mb-4">
              These are accounts that have access to or can be enabled to access
              your invoicing platform.
            </p>

            <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs font-semibold text-black/45">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Date Joined</th>
                    <th className="px-5 py-3 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-black/10 last:border-b-0 ${
                        user.enabled ? "text-black" : "text-black/40"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2">
                          {user.enabled ? (
                            <StatusEnabledIcon />
                          ) : (
                            <StatusDisabledIcon />
                          )}
                          {user.name}
                        </span>
                      </td>
                      <td className="px-5 py-4">{user.email}</td>
                      <td className="px-5 py-4">
                        {user.enabled ? "Sub-User" : "No Access"}
                      </td>
                      <td className="px-5 py-4">
                        {user.enabled ? (
                          user.dateJoined ? (
                            user.dateJoined
                          ) : (
                            <EmptyValue />
                          )
                        ) : (
                          <EmptyValue />
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="underline underline-offset-2 transition hover:text-prime-blue"
                          onClick={() => toggleSubUserAccess(user.id)}
                        >
                          {user.enabled ? "Disable Access" : "Enable Access"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </main>

      {discardWarning ? (
        <Modal
          title="Unsaved changes"
          titleId="discard-warning-title"
          describedBy="discard-warning-desc"
          role="alertdialog"
          onClose={keepEditing}
          closeOnBackdrop={false}
          zClass="z-[220]"
          cancelLabel="Keep editing"
          onCancel={keepEditing}
          confirmLabel="Discard"
          onConfirm={confirmDiscard}
          confirmDanger
        >
          <p
            id="discard-warning-desc"
            className="type-body-muted text-center"
          >
            You have unsaved edits in this section. Discard them?
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
