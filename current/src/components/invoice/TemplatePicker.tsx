"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadDefaultTemplateId,
  loadInvoiceTemplates,
  persistDefaultTemplateId,
  persistInvoiceTemplates,
  saveInvoiceTemplate,
  type InvoiceTemplate,
} from "@/lib/invoice-templates";
import { CloseIcon } from "./ui";

function CaretIcon() {
  return (
    <svg width="11" height="6" viewBox="0 0 11 6" fill="none" aria-hidden>
      <path d="M1 1l4.5 4L10 1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SaveTemplateModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function submit() {
    if (!name.trim()) return;
    onSave(name);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-black/40 transition hover:bg-black/5 hover:text-black/70"
          aria-label="Close save template modal"
        >
          <CloseIcon />
        </button>

        <h2
          id="save-template-title"
          className="pr-8 font-display text-xl font-bold text-black"
        >
          Save as Template
        </h2>
        <p className="mt-2 text-sm text-black/60">
          Name this invoice setup so you can reuse it later.
        </p>

        <label className="mt-5 flex flex-col gap-2">
          <span className="text-sm text-black">Template name</span>
          <input
            ref={inputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            className="w-full rounded border border-black/20 bg-input-grey px-3 py-2.5 text-sm text-midnight-ink outline-none transition focus:border-prime-blue"
            placeholder="e.g. Standard consulting invoice"
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded border border-black/20 px-5 text-sm font-semibold text-midnight-ink transition hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="h-11 rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-[#0063d1] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplatePicker() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draftTemplates, setDraftTemplates] = useState<InvoiceTemplate[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const loadedTemplates = loadInvoiceTemplates();
      const storedDefaultId = loadDefaultTemplateId();
      const validDefaultId = loadedTemplates.some(
        (template) => template.id === storedDefaultId,
      )
        ? storedDefaultId
        : null;
      setTemplates(loadedTemplates);
      setDefaultId(validDefaultId);
      setSelectedId(validDefaultId);
      if (storedDefaultId && !validDefaultId) persistDefaultTemplateId(null);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        if (managing) {
          setManaging(false);
          setDraftTemplates([]);
        }
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, managing]);

  const selected = templates.find((template) => template.id === selectedId);

  function handleSave(name: string) {
    const result = saveInvoiceTemplate(templates, name);
    setTemplates(result.templates);
    setSelectedId(result.template.id);
    setModalOpen(false);
  }

  function setDefault(id: string | null) {
    setDefaultId(id);
    persistDefaultTemplateId(id);
  }

  function startManaging() {
    setDraftTemplates(templates.map((template) => ({ ...template })));
    setManaging(true);
  }

  function cancelManaging() {
    setManaging(false);
    setDraftTemplates([]);
  }

  function saveManaging() {
    const cleaned = draftTemplates
      .map((template) => ({
        ...template,
        name: template.name.trim(),
      }))
      .filter((template) => template.name.length > 0);

    persistInvoiceTemplates(cleaned);
    setTemplates(cleaned);

    const nextSelected =
      cleaned.find((template) => template.id === selectedId)?.id ??
      cleaned[0]?.id ??
      null;
    setSelectedId(nextSelected);

    const nextDefault =
      cleaned.find((template) => template.id === defaultId)?.id ?? null;
    if (nextDefault !== defaultId) {
      setDefault(nextDefault);
    }

    setManaging(false);
    setDraftTemplates([]);

    if (cleaned.length === 0) {
      setMenuOpen(false);
    }
  }

  function updateDraftName(id: string, name: string) {
    setDraftTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, name } : template,
      ),
    );
  }

  function deleteDraft(id: string) {
    setDraftTemplates((prev) => prev.filter((template) => template.id !== id));
  }

  if (templates.length === 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-11 items-center self-start rounded border border-black px-5 text-sm font-semibold text-midnight-ink transition hover:bg-black/5"
        >
          Save as Template
        </button>
        {modalOpen ? (
          <SaveTemplateModal
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div ref={pickerRef} className="relative self-start">
        <button
          type="button"
          onClick={() => {
            if (menuOpen && managing) cancelManaging();
            setMenuOpen((open) => !open);
          }}
          className="inline-flex h-11 items-stretch overflow-hidden rounded border border-black text-sm font-semibold text-midnight-ink transition hover:bg-black/5"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex items-center px-5">
            {selected?.name ?? "Select Template"}
          </span>
          <span className="flex w-11 items-center justify-center bg-black/5">
            <CaretIcon />
          </span>
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl"
            role="menu"
          >
            {managing ? (
              <>
                <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-black/40">
                  Manage templates
                </div>
                <ul className="max-h-64 space-y-2 overflow-auto px-3 py-2">
                  {draftTemplates.length === 0 ? (
                    <li className="px-1 py-3 text-sm text-black/50">
                      No templates left. Save to finish.
                    </li>
                  ) : (
                    draftTemplates.map((template) => (
                      <li
                        key={template.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          className="min-w-0 flex-1 rounded border border-black/20 bg-input-grey px-2.5 py-2 text-sm text-midnight-ink outline-none transition focus:border-prime-blue"
                          value={template.name}
                          onChange={(event) =>
                            updateDraftName(template.id, event.target.value)
                          }
                          aria-label={`Rename ${template.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => deleteDraft(template.id)}
                          className="shrink-0 px-1 text-sm font-semibold text-delete-red transition hover:opacity-80"
                        >
                          Delete
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                <div className="flex items-center justify-between gap-2 border-t border-black/10 p-3">
                  <button
                    type="button"
                    onClick={cancelManaging}
                    className="rounded px-2 py-1.5 text-sm font-semibold text-midnight-ink transition hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveManaging}
                    className="rounded bg-prime-blue px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0063d1]"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-black/40">
                  <div className="flex items-center justify-between gap-3">
                    <span>Templates</span>
                    <button
                      type="button"
                      onClick={() => {
                        startManaging();
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded bg-transparent text-black/40 transition hover:text-prime-blue"
                      aria-label="Manage my templates"
                    >
                      <span className="text-lg leading-none">⚙</span>
                    </button>
                  </div>
                </div>
                <ul className="max-h-52 overflow-auto py-1">
                  {templates.map((template) => {
                    const isSelected = template.id === selectedId;
                    const isDefault = template.id === defaultId;

                    return (
                      <li key={template.id}>
                        <div className="group flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-black/[0.04]">
                          <button
                            type="button"
                            role="menuitem"
                            aria-current={isSelected ? "true" : undefined}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm"
                            onClick={() => {
                              setSelectedId(template.id);
                              setMenuOpen(false);
                            }}
                          >
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                              {isSelected ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  aria-hidden
                                  className="text-prime-blue"
                                >
                                  <path
                                    d="m2.5 8.5 3.5 3.5 7.5-8"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : null}
                            </span>
                            <span className="min-w-0 truncate">
                              {template.name}
                            </span>
                          </button>

                          <div className="flex min-w-[92px] shrink-0 justify-end">
                            {isDefault ? (
                              <span className="rounded bg-prime-blue/10 px-2 py-0.5 text-xs font-semibold text-prime-blue">
                                Default
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="whitespace-nowrap rounded px-1 py-0.5 text-xs font-semibold text-prime-blue opacity-0 transition group-hover:opacity-100 hover:underline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDefault(template.id);
                                }}
                              >
                                Set as default
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-black/10 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setModalOpen(true);
                    }}
                    className="w-full rounded px-1 py-1.5 text-left text-sm font-semibold text-prime-blue transition hover:bg-prime-blue/5"
                  >
                    + Save as new template
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <SaveTemplateModal
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      ) : null}
    </>
  );
}
