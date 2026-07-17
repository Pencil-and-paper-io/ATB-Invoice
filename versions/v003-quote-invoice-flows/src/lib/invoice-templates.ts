const TEMPLATES_STORAGE_KEY = "atb-invoice-templates";
const DEFAULT_TEMPLATE_STORAGE_KEY = "atb-invoice-default-template";

export type InvoiceTemplate = {
  id: string;
  name: string;
  createdAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadInvoiceTemplates(): InvoiceTemplate[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InvoiceTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInvoiceTemplate(
  templates: InvoiceTemplate[],
  name: string,
): { templates: InvoiceTemplate[]; template: InvoiceTemplate } {
  const trimmedName = name.trim();
  const existing = templates.find(
    (template) => template.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  const template: InvoiceTemplate = existing ?? {
    id: `template-${Date.now()}`,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
  const next = existing
    ? templates.map((item) =>
        item.id === existing.id ? { ...item, name: trimmedName } : item,
      )
    : [...templates, template];

  if (canUseStorage()) {
    persistInvoiceTemplates(next);
  }
  return { templates: next, template: { ...template, name: trimmedName } };
}

export function persistInvoiceTemplates(templates: InvoiceTemplate[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

export function loadDefaultTemplateId(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(DEFAULT_TEMPLATE_STORAGE_KEY);
}

export function persistDefaultTemplateId(id: string | null) {
  if (!canUseStorage()) return;
  if (id) {
    localStorage.setItem(DEFAULT_TEMPLATE_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(DEFAULT_TEMPLATE_STORAGE_KEY);
  }
}
