import type { Customer } from "@/lib/invoice-demo-data";
import { provinceLabel } from "@/lib/canada";
import {
  saveCustomerProfileSettings,
  type CustomerProfileSettings,
} from "@/lib/customer-profile-settings";
import { suggestCustomerTaxCascade } from "@/lib/tax-suggestions";

const STORAGE_KEY = "atb-custom-customers";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isCustomer(value: unknown): value is Customer {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.address === "string" &&
    typeof entry.phone === "string" &&
    typeof entry.email === "string" &&
    Array.isArray(entry.tags)
  );
}

export function loadCustomCustomers(): Customer[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCustomer);
  } catch {
    return [];
  }
}

export function persistCustomCustomers(list: Customer[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function findCustomCustomer(id: string | null | undefined) {
  if (!id) return undefined;
  return loadCustomCustomers().find((customer) => customer.id === id);
}

export type CreateCustomerInput = {
  businessName: string;
  email?: string;
  province?: string;
};

function slugifyName(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || "customer";
}

export function createCustomerId(name: string) {
  return `${slugifyName(name)}-${Date.now().toString(36)}`;
}

export function createAndPersistCustomer(
  input: CreateCustomerInput,
): Customer {
  const name = input.businessName.trim();
  const email = (input.email ?? "").trim();
  const province = (input.province ?? "").trim();
  const address = province ? provinceLabel(province) : "";

  const customer: Customer = {
    id: createCustomerId(name),
    name,
    address,
    phone: "",
    email,
    tags: [],
  };

  const existing = loadCustomCustomers().filter(
    (entry) => entry.id !== customer.id,
  );
  persistCustomCustomers([customer, ...existing]);

  const taxCascade = suggestCustomerTaxCascade(province);
  const profile: CustomerProfileSettings = {
    taxStatus: taxCascade.taxStatus,
    taxSuggestions: { ...taxCascade.suggestions },
  };
  saveCustomerProfileSettings(customer.id, profile);

  return customer;
}
