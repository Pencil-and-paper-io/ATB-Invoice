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

export function EditCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-3 z-10 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
      aria-label="Close editor"
    >
      <CloseIcon />
    </button>
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
      className={`flex flex-col gap-5 rounded-[10px] bg-white p-[30px] ${className}`}
    >
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      {children}
    </section>
  );
}

export function ContactBlock({
  name,
  address,
  phone,
  email,
}: {
  name: string;
  address: string;
  phone: string;
  email: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-base font-bold text-black">{name}</p>
        <p className="text-sm text-black">{address}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 text-sm text-black">
          <PhoneIcon />
          <span>{phone}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-black">
          <MailIcon />
          <span>{email}</span>
        </div>
      </div>
    </div>
  );
}

export function TextLink({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-fit text-sm text-prime-blue underline underline-offset-2 transition hover:opacity-80"
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
      className="inline-flex items-center gap-2.5 self-start text-sm font-semibold text-midnight-ink transition hover:text-prime-blue"
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
        <p className="text-base font-bold text-black">{title}</p>
        <p className="mt-2.5 text-sm leading-5 text-black">{body}</p>
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
