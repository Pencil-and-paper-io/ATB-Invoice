const STORAGE_KEY = "atb-invoice-saved-customer-notes";

export type SavedCustomerNote = {
  id: string;
  title: string;
  body: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadSavedCustomerNotes(): SavedCustomerNote[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCustomerNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedCustomerNotes(notes: SavedCustomerNote[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function upsertSavedCustomerNote(
  notes: SavedCustomerNote[],
  next: Omit<SavedCustomerNote, "id"> & { id?: string },
): SavedCustomerNote[] {
  const titleKey = next.title.trim().toLowerCase();
  const existingIndex = notes.findIndex(
    (note) => note.title.trim().toLowerCase() === titleKey,
  );
  const entry: SavedCustomerNote = {
    id:
      existingIndex >= 0
        ? notes[existingIndex].id
        : (next.id ?? `saved-note-${Date.now()}`),
    title: next.title.trim(),
    body: next.body,
  };

  if (existingIndex >= 0) {
    const copy = [...notes];
    copy[existingIndex] = entry;
    return copy;
  }
  return [...notes, entry];
}

export function removeSavedCustomerNote(notes: SavedCustomerNote[], id: string) {
  return notes.filter((note) => note.id !== id);
}

export function matchSavedCustomerNotes(
  notes: SavedCustomerNote[],
  query: string,
): SavedCustomerNote[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return notes.filter((note) => note.title.toLowerCase().includes(q));
}
