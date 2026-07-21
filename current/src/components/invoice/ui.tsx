"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black/25 text-[10px] font-semibold leading-none text-black/50 transition hover:border-prime-blue hover:text-prime-blue"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
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
  zClass = "z-[100]",
  closeOnBackdrop = true,
  role = "dialog",
  describedBy,
  aboveTitle,
}: {
  title: string;
  titleId?: string;
  onClose: () => void;
  children: ReactNode;
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
  zClass?: string;
  closeOnBackdrop?: boolean;
  role?: "dialog" | "alertdialog";
  describedBy?: string;
  aboveTitle?: ReactNode;
}) {
  const generatedId = useId();
  const resolvedTitleId = titleId ?? generatedId;
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

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center bg-black/35 px-4 py-8`}
      role={role}
      aria-modal="true"
      aria-labelledby={resolvedTitleId}
      aria-describedby={describedBy}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto rounded-xl border border-black/15 bg-white p-8 shadow-2xl sm:p-10`}
      >
        <EditCloseButton
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70 sm:right-6 sm:top-6"
        />
        {aboveTitle ? (
          <div className="mb-5 flex justify-center">{aboveTitle}</div>
        ) : null}
        <h2
          id={resolvedTitleId}
          className="type-headline-3 px-8 text-center text-black"
        >
          {title}
        </h2>
        <div className="mt-10">{children}</div>
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

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
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
