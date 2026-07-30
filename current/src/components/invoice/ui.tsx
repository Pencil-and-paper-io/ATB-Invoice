"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

export function InfoTooltip({
  text,
  onDark = false,
}: {
  text: string;
  onDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold leading-none transition hover:border-prime-blue hover:text-prime-blue ${
          onDark
            ? "border-white/35 text-white/70"
            : "border-black/25 text-black/50"
        }`}
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md bg-midnight-ink px-3 py-2 text-xs leading-4 text-white shadow-lg"
        >
          {text}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-midnight-ink"
            aria-hidden
          />
        </span>
      ) : null}
    </span>
  );
}

function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M11.5 1.8 14.2 4.5 5.4 13.3 2 14l.7-3.4L11.5 1.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 3l8 8M11 3 3 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditCloseButton({
  onClick,
  ariaLabel = "Close",
  className = "absolute right-4 top-4 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70",
}: {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      <CloseIcon />
    </button>
  );
}

/**
 * Shared modal shell — use for all product dialogs.
 * Rules: generous padding (p-8 / sm:p-10), centered `.type-headline-3` title
 * with space below, X top-right, Cancel (`.type-danger`) bottom-left,
 * primary action bottom-right.
 */
export function Modal({
  title,
  titleId,
  onClose,
  children,
  body,
  cancelLabel = "Cancel",
  onCancel,
  hideCancel = false,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmDanger = false,
  confirmChildren,
  footer,
  maxWidthClass = "max-w-md",
  paddingClass = "p-8 sm:p-10",
  zClass = "z-[100]",
  closeOnBackdrop = true,
  role = "dialog",
  describedBy,
  aboveTitle,
  subtitle,
}: {
  title: string;
  titleId?: string;
  onClose: () => void;
  children?: ReactNode;
  /**
   * Centered paragraph-1 body copy under the title (confirm / alert modals).
   * Prefer this over hand-rolling type styles in children.
   */
  body?: ReactNode;
  cancelLabel?: string;
  onCancel?: () => void;
  hideCancel?: boolean;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  confirmDanger?: boolean;
  confirmChildren?: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  paddingClass?: string;
  zClass?: string;
  closeOnBackdrop?: boolean;
  role?: "dialog" | "alertdialog";
  describedBy?: string;
  aboveTitle?: ReactNode;
  /**
   * Centered headline-6 intro under the title (edit-sheet format).
   * When set, title→content spacing is tightened automatically.
   */
  subtitle?: string;
}) {
  const generatedId = useId();
  const resolvedTitleId = titleId ?? generatedId;
  const subtitleId = useId();
  const bodyId = useId();
  const handleCancel = onCancel ?? onClose;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const showDefaultFooter =
    footer === undefined && (Boolean(confirmLabel) || !hideCancel);
  const describedByIds = [
    describedBy,
    subtitle ? subtitleId : null,
    body && !describedBy ? bodyId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center bg-black/35 px-4 py-8`}
      role={role}
      aria-modal="true"
      aria-labelledby={resolvedTitleId}
      aria-describedby={describedByIds || undefined}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto rounded-xl border border-black/15 bg-white shadow-2xl ${paddingClass}`}
      >
        <EditCloseButton
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70 sm:right-7 sm:top-7"
        />
        {aboveTitle ? (
          <div className="mb-5 flex justify-center">{aboveTitle}</div>
        ) : null}
        {subtitle ? (
          <header className="mt-4 mb-10 space-y-5">
            <h2
              id={resolvedTitleId}
              className="type-headline-3 px-8 text-center text-black"
            >
              {title}
            </h2>
            <p
              id={subtitleId}
              className="px-4 text-center type-headline-6 text-black"
            >
              {subtitle}
            </p>
          </header>
        ) : (
          <h2
            id={resolvedTitleId}
            className="type-headline-3 px-8 text-center text-black"
          >
            {title}
          </h2>
        )}
        {body ? (
          <p
            id={bodyId}
            className={`px-4 text-center type-paragraph-1 text-black ${
              subtitle ? "" : "mt-10"
            }`}
          >
            {body}
          </p>
        ) : null}
        {children ? (
          <div
            className={
              subtitle || body ? (body ? "mt-6" : undefined) : "mt-10"
            }
          >
            {children}
          </div>
        ) : null}
        {footer !== undefined ? (
          <div className="mt-10">{footer}</div>
        ) : showDefaultFooter ? (
          <div className="mt-10 flex items-center justify-between gap-3">
            {!hideCancel ? (
              <button
                type="button"
                onClick={handleCancel}
                className="type-danger transition hover:underline"
              >
                {cancelLabel}
              </button>
            ) : (
              <span />
            )}
            {confirmLabel ? (
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirmDisabled}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  confirmDanger
                    ? "bg-delete-red hover:opacity-90"
                    : "bg-prime-blue hover:bg-prime-blue-hover"
                }`}
              >
                {confirmChildren ?? confirmLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Soft pink callout used for incomplete setup / missing required fields. */
export function MissingInfoFlag({
  label = "Missing Information",
  message,
  className = "mt-5",
}: {
  label?: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`${className} flex items-start gap-2.5 rounded-[10px] border border-[#F5C2C0] bg-[#FDECEC] px-3.5 py-3`}
    >
      <span className="mt-0.5 shrink-0 text-[#C62828]" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2.25 16.5 15.75H1.5L9 2.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 7.5v3.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="9" cy="13.5" r="0.75" fill="currentColor" />
        </svg>
      </span>
      <p className="type-body text-midnight-ink">
        <span className="font-semibold">{label}:</span> {message}
      </p>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** White filled circle with dark plus — for primary (blue) create CTAs. */
export function CreatePlusIcon({ className }: { className?: string } = {}) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        className ?? "bg-white text-prime-blue"
      }`}
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 2.5v7M2.5 6h7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-30">
      <path
        d="M3.5 2.5h2l1 3-1.5 1a8 8 0 0 0 4.5 4.5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A10.5 10.5 0 0 1 2 4A1.5 1.5 0 0 1 3.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="opacity-30">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="m2.5 4.5 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-[10px] rounded-[10px] bg-white p-[30px] ${className}`}
    >
      <h2 className="type-headline-5">{title}</h2>
      {children}
    </section>
  );
}

export function ContactBlock({
  name,
  address,
  phone,
  email,
  emailNote,
}: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  emailNote?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="type-emphasis">{name}</p>
        {address ? <p className="type-body">{address}</p> : null}
      </div>
      {phone || email ? (
        <div className="flex flex-col gap-2.5">
          {phone ? (
            <div className="flex items-center gap-2.5 type-body">
              <PhoneIcon />
              <span>{phone}</span>
            </div>
          ) : null}
          {email ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2.5 type-body">
                <MailIcon />
                <span>{email}</span>
              </div>
              {emailNote ? (
                <p className="type-body-muted pl-[26px]">{emailNote}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TextLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-fit type-link transition hover:opacity-80"
    >
      {children}
    </button>
  );
}

export function TertiaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 self-start type-button text-midnight-ink transition hover:text-prime-blue"
    >
      <PlusIcon />
      {children}
    </button>
  );
}

export function EditableNote({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="relative rounded-[10px] border border-black/10 p-[30px]">
      <div className="pr-6">
        <p className="type-emphasis">{title}</p>
        <p className="type-body mt-2.5 leading-5">{body}</p>
      </div>
      <button
        type="button"
        className="absolute right-2.5 top-2.5 text-black/30 transition hover:text-black/60"
        aria-label={`Edit ${title}`}
      >
        <PencilIcon />
      </button>
    </div>
  );
}

export { PencilIcon, CloseIcon };
