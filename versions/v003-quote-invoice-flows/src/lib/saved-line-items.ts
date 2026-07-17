import type { DiscountType, LineItem } from "./invoice-demo-data";

const STORAGE_KEY = "atb-invoice-saved-line-items";

export type SavedLineItem = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  qty: number;
  discount: number;
  discountType?: DiscountType;
  tax: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadSavedLineItems(): SavedLineItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedLineItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedLineItems(items: SavedLineItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertSavedLineItem(
  items: SavedLineItem[],
  next: Omit<SavedLineItem, "id"> & { id?: string },
): SavedLineItem[] {
  const nameKey = next.name.trim().toLowerCase();
  const existingIndex = items.findIndex(
    (item) => item.name.trim().toLowerCase() === nameKey,
  );
  const entry: SavedLineItem = {
    id: existingIndex >= 0 ? items[existingIndex].id : next.id ?? `saved-${Date.now()}`,
    name: next.name.trim(),
    description: next.description,
    unitPrice: next.unitPrice,
    qty: next.qty,
    discount: next.discount,
    discountType: next.discountType ?? "fixed",
    tax: next.tax,
  };

  if (existingIndex >= 0) {
    const copy = [...items];
    copy[existingIndex] = entry;
    return copy;
  }
  return [...items, entry];
}

export function removeSavedLineItem(items: SavedLineItem[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function matchSavedLineItems(
  items: SavedLineItem[],
  query: string,
): SavedLineItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export function savedToLineItemDraft(
  saved: SavedLineItem,
  id: string,
): Partial<LineItem> & { tax: string } {
  return {
    id,
    name: saved.name,
    description: saved.description,
    unitPrice: saved.unitPrice,
    qty: saved.qty,
    discount: saved.discount,
    total: Math.max(saved.unitPrice * saved.qty - saved.discount, 0),
    tax: saved.tax,
  };
}

export function getInvoiceCurrency(): string {
  return "CAD";
}
