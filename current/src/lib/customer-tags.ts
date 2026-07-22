import { CUSTOMER_TAG_OPTIONS } from "@/lib/canada";
import { customers } from "@/lib/invoice-demo-data";

const STORAGE_KEY = "atb-customer-tags";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function uniqueTags(tags: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(trimmed);
  }
  return next;
}

export function defaultCustomerTags() {
  return uniqueTags([
    ...CUSTOMER_TAG_OPTIONS,
    ...customers.flatMap((customer) => customer.tags),
  ]);
}

export function loadCustomerTags(): string[] {
  if (!canUseStorage()) return [...CUSTOMER_TAG_OPTIONS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCustomerTags();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultCustomerTags();
    return uniqueTags([
      ...parsed.filter((tag): tag is string => typeof tag === "string"),
      ...customers.flatMap((customer) => customer.tags),
    ]);
  } catch {
    return defaultCustomerTags();
  }
}

export function persistCustomerTags(tags: string[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueTags(tags)));
}

/** Apply managed catalog edits: rename/delete by original id, then persist. */
export function applyCustomerTagEdits(
  drafts: { id: string; name: string }[],
): string[] {
  const cleaned = drafts
    .map((draft) => ({
      id: draft.id,
      name: draft.name.trim(),
    }))
    .filter((draft) => draft.name.length > 0);

  const keptIds = new Set(cleaned.map((draft) => draft.id));
  const previous = loadCustomerTags();

  for (const tag of previous) {
    if (!keptIds.has(tag)) {
      for (const customer of customers) {
        customer.tags = customer.tags.filter((item) => item !== tag);
      }
    }
  }

  for (const draft of cleaned) {
    if (draft.id === draft.name) continue;
    for (const customer of customers) {
      customer.tags = customer.tags.map((item) =>
        item === draft.id ? draft.name : item,
      );
    }
  }

  const next = uniqueTags(cleaned.map((draft) => draft.name));
  persistCustomerTags(next);
  return next;
}
