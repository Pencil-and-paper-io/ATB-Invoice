import type { SelfNote } from "@/lib/invoice-demo-data";
import { previewMeta } from "@/lib/invoice-demo-data";

const STORAGE_KEY = "atb-invoice-self-notes";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Demo seed so preview/sent aren't empty on first visit. */
export const DEFAULT_SELF_NOTES: SelfNote[] = [
  {
    id: "self-note-default",
    body: previewMeta.noteToSelf.body,
  },
];

export function loadSelfNotes(): SelfNote[] {
  if (!canUseStorage()) return DEFAULT_SELF_NOTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_SELF_NOTES;
    const parsed = JSON.parse(raw) as SelfNote[];
    if (!Array.isArray(parsed)) return DEFAULT_SELF_NOTES;
    return parsed.filter(
      (note) =>
        note &&
        typeof note.id === "string" &&
        typeof note.body === "string",
    );
  } catch {
    return DEFAULT_SELF_NOTES;
  }
}

export function persistSelfNotes(notes: SelfNote[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
