"use client";

import { useState } from "react";
import { CA_LOCATION_OPTIONS } from "@/lib/canada";
import {
  createAndPersistCustomer,
  type CreateCustomerInput,
} from "@/lib/custom-customers";
import { UI_CLASS } from "@/lib/design-tokens";
import type { Customer } from "@/lib/invoice-demo-data";
import { InfoTooltip, Modal } from "./ui";

const LEGAL_NAME_TIP =
  "Required for CRA records and Canada Small Business Financing Loan eligibility. Use the customer’s official legal business name.";

const inputClass = UI_CLASS.input;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function CreateCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) {
  const [draft, setDraft] = useState<CreateCustomerInput>({
    businessName: "",
    email: "",
    province: "",
  });

  const emailValid = !draft.email?.trim() || isValidEmail(draft.email);
  const canSave = draft.businessName.trim().length > 0 && emailValid;

  function save() {
    if (!canSave) return;
    const customer = createAndPersistCustomer(draft);
    onCreated(customer);
  }

  return (
    <Modal
      title="Create New Customer"
      titleId="create-customer-title"
      onClose={onClose}
      closeOnBackdrop={false}
      zClass="z-[220]"
      maxWidthClass="max-w-xl"
      confirmLabel="Save"
      onConfirm={save}
      confirmDisabled={!canSave}
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label htmlFor="create-business-name" className="type-label">
              Business Legal Name <span className="type-danger">*</span>
            </label>
            <InfoTooltip text={LEGAL_NAME_TIP} />
          </div>
          <input
            id="create-business-name"
            className={inputClass}
            value={draft.businessName}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                businessName: event.target.value,
              }))
            }
            autoFocus
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label htmlFor="create-email" className="type-label">
              Business Email
            </label>
          </div>
          <input
            id="create-email"
            type="email"
            className={inputClass}
            value={draft.email}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                email: event.target.value,
              }))
            }
          />
          {!emailValid ? (
            <p className="type-danger mt-1.5">Enter a valid email address.</p>
          ) : null}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label htmlFor="create-province" className="type-label">
              Province / Territory
            </label>
            <InfoTooltip text="Used for billing address and tax suggestions (GST/HST place of supply)." />
          </div>
          <select
            id="create-province"
            className={inputClass}
            value={draft.province}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                province: event.target.value,
              }))
            }
            aria-label="Province / Territory"
          >
            <option value="">Select…</option>
            {CA_LOCATION_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code === "OUTSIDE_CA"
                  ? option.name
                  : `${option.name} (${option.code})`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
