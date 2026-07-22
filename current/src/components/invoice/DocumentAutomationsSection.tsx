"use client";

import { UI_CLASS } from "@/lib/design-tokens";

export type DocumentAutomationsState = {
  autoSend: boolean;
  reminders: boolean;
  reminderDays: string;
  receipts: boolean;
};

const inputClass = UI_CLASS.input;

function CheckboxRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-2.5 text-sm text-black">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-prime-blue"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </label>
      {checked && children ? (
        <div className="pl-6">{children}</div>
      ) : null}
    </div>
  );
}

/** Per-document automation overrides (cascaded from org / customer defaults). */
export function DocumentAutomationsSection({
  value,
  onChange,
  documentKind = "invoice",
}: {
  value: DocumentAutomationsState;
  onChange: (next: DocumentAutomationsState) => void;
  documentKind?: "invoice" | "quote";
}) {
  const isInvoice = documentKind === "invoice";

  return (
    <div className="flex flex-col gap-3">
      <p className="type-body-muted">
        Starts from this customer&apos;s defaults. Change them only for this{" "}
        {documentKind}.
      </p>
      {isInvoice ? (
        <CheckboxRow
          checked={value.autoSend}
          onChange={(autoSend) => onChange({ ...value, autoSend })}
          label="Auto-send: Send this invoice automatically on its issuance date."
        />
      ) : null}
      <CheckboxRow
        checked={value.reminders}
        onChange={(reminders) => onChange({ ...value, reminders })}
        label={
          isInvoice
            ? "Reminders: Send a reminder before this invoice is due."
            : "Reminders: Send a reminder before this quote expires."
        }
      >
        <div className="relative max-w-[220px]">
          <input
            inputMode="numeric"
            className={`${inputClass} pr-24`}
            value={value.reminderDays}
            onChange={(event) =>
              onChange({
                ...value,
                reminderDays: event.target.value.replace(/[^\d]/g, ""),
              })
            }
            aria-label="Reminder days before"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-black/45">
            days before
          </span>
        </div>
      </CheckboxRow>
      {isInvoice ? (
        <CheckboxRow
          checked={value.receipts}
          onChange={(receipts) => onChange({ ...value, receipts })}
          label="Receipts: Email a receipt when payment is recorded."
        />
      ) : null}
    </div>
  );
}
