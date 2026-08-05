/** Demo-only password protection for shared invoice links (sessionStorage). */

const STORAGE_KEY = "atb-invoice-password-protect";
export const DEMO_INVOICE_SHARE_ID = "3001";
export const DEMO_SHARE_PATH = `/pay/invoice/${DEMO_INVOICE_SHARE_ID}`;

export type InvoicePasswordState = {
  enabled: boolean;
  password: string;
  /** Customer-facing unlock succeeded in this browser session. */
  unlocked: boolean;
};

const DEFAULT_STATE: InvoicePasswordState = {
  enabled: false,
  password: "",
  unlocked: false,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function generateInvoicePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function loadInvoicePasswordState(): InvoicePasswordState {
  if (!canUseStorage()) return { ...DEFAULT_STATE };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<InvoicePasswordState>;
    return {
      enabled: Boolean(parsed.enabled),
      password: typeof parsed.password === "string" ? parsed.password : "",
      unlocked: Boolean(parsed.unlocked),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveInvoicePasswordState(state: InvoicePasswordState) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Enable protection with a password when sending (resets unlock). */
export function enableInvoicePassword(password: string) {
  saveInvoicePasswordState({
    enabled: true,
    password: password.trim(),
    unlocked: false,
  });
}

export function clearInvoicePassword() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function markInvoiceUnlocked() {
  const current = loadInvoicePasswordState();
  if (!current.enabled) return;
  saveInvoicePasswordState({ ...current, unlocked: true });
}

export function tryUnlockInvoice(attempt: string): boolean {
  const current = loadInvoicePasswordState();
  if (!current.enabled) return true;
  if (attempt.trim() !== current.password) return false;
  markInvoiceUnlocked();
  return true;
}

/** Absolute share URL for clipboard (falls back to path-only). */
export function invoiceShareUrl(passwordProtected: boolean): string {
  const path = DEMO_SHARE_PATH;
  if (typeof window === "undefined") return path;
  const url = new URL(path, window.location.origin);
  if (passwordProtected) {
    url.searchParams.set("protected", "1");
  }
  return url.toString();
}
