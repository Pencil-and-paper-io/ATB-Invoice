const STORAGE_KEY = "atb-invoice-saved-addons";

export type SavedInvoiceAddon = {
  id: string;
  kind: "discount" | "shipping";
  name: string;
  amount: number;
  amountType?: "fixed" | "percent";
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadSavedInvoiceAddons(): SavedInvoiceAddon[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedInvoiceAddon[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (addon) =>
        addon &&
        (addon.kind === "discount" || addon.kind === "shipping") &&
        typeof addon.name === "string" &&
        typeof addon.amount === "number",
    );
  } catch {
    return [];
  }
}

export function persistSavedInvoiceAddons(addons: SavedInvoiceAddon[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addons));
}

export function upsertSavedInvoiceAddon(
  addons: SavedInvoiceAddon[],
  next: Omit<SavedInvoiceAddon, "id"> & { id?: string },
): SavedInvoiceAddon[] {
  const nameKey = next.name.trim().toLowerCase();
  const existingIndex = addons.findIndex(
    (addon) =>
      addon.kind === next.kind && addon.name.trim().toLowerCase() === nameKey,
  );
  const entry: SavedInvoiceAddon = {
    id:
      existingIndex >= 0
        ? addons[existingIndex].id
        : (next.id ?? `saved-addon-${Date.now()}`),
    kind: next.kind,
    name: next.name.trim(),
    amount: next.amount,
    amountType: next.amountType ?? "fixed",
  };

  if (existingIndex >= 0) {
    const copy = [...addons];
    copy[existingIndex] = entry;
    return copy;
  }
  return [...addons, entry];
}

export function removeSavedInvoiceAddon(
  addons: SavedInvoiceAddon[],
  id: string,
) {
  return addons.filter((addon) => addon.id !== id);
}

export function matchSavedInvoiceAddons(
  addons: SavedInvoiceAddon[],
  kind: SavedInvoiceAddon["kind"],
  query: string,
): SavedInvoiceAddon[] {
  const q = query.trim().toLowerCase();
  const ofKind = addons.filter((addon) => addon.kind === kind);
  if (!q) return ofKind;
  return ofKind.filter((addon) => addon.name.toLowerCase().includes(q));
}
