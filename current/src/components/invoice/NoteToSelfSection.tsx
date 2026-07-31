"use client";

import { useEffect, useRef, useState } from "react";
import type { SelfNote } from "@/lib/invoice-demo-data";
import { loadSelfNotes, persistSelfNotes } from "@/lib/invoice-self-notes";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { EditCloseButton, PencilIcon, TertiaryButton } from "./ui";

const hoverCardClass =
  "rounded-[10px] border border-black/10 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue";

const inputClass =
  "w-full rounded border border-black/20 bg-input-grey px-3 py-2.5 text-sm text-midnight-ink outline-none transition focus:border-prime-blue focus:bg-input-grey";

function SelfNoteCard({
  note,
  onClick,
}: {
  note: SelfNote;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full p-5 text-left ${hoverCardClass}`}
    >
      <p className="pr-6 text-sm leading-5 text-black whitespace-pre-wrap">
        {note.body || "Empty note"}
      </p>
      <span className="absolute right-3 top-3 text-black/30" aria-hidden>
        <PencilIcon />
      </span>
    </button>
  );
}

function SelfNoteForm({
  initial,
  isNew,
  onSave,
  onDelete,
  onClose,
  allowDismiss = true,
}: {
  initial: SelfNote;
  isNew: boolean;
  onSave: (note: SelfNote) => void;
  onDelete: () => void;
  onClose: () => void;
  allowDismiss?: boolean;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useDismissOnOutsideClick(formRef, allowDismiss ? onClose : () => undefined);
  const [body, setBody] = useState(initial.body);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 320);
    return () => window.clearTimeout(timer);
  }, []);

  function handleSave() {
    const trimmed = body.trim();
    if (!trimmed && isNew) {
      onClose();
      return;
    }
    onSave({ ...initial, body: trimmed });
  }

  return (
    <div
      ref={formRef}
      className="relative rounded-[10px] border border-black/10 p-5"
    >
      {allowDismiss ? <EditCloseButton onClick={onClose} /> : null}
      <div className="flex flex-col gap-4">
        <textarea
          ref={textareaRef}
          className={`${inputClass} min-h-[160px] resize-y`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a private reminder…"
        />

        <div className="mt-6 border-t border-dashed border-black/15 pt-6">
          <div className="flex items-center justify-between">
            {allowDismiss ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-semibold text-delete-red transition hover:opacity-80"
              >
                {isNew ? "Cancel" : "Delete"}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleSave}
              className="ui-btn-primary"
            >
              {isNew ? "Add" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoteToSelfSection({
  onNoteChange,
  autoOpen = false,
}: {
  onNoteChange?: (note: SelfNote | null) => void;
  /** When true, open the editor immediately (draft composer step). */
  autoOpen?: boolean;
} = {}) {
  const [note, setNote] = useState<SelfNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      const loaded = loadSelfNotes()[0] ?? null;
      setNote(loaded);
      onNoteChange?.(loaded);
      if (autoOpen) {
        if (loaded) {
          setIsCreating(false);
          setEditing(true);
        } else {
          const blank = { id: `self-note-${Date.now()}`, body: "" };
          setNote(blank);
          setIsCreating(true);
          setEditing(true);
        }
      } else {
        setIsCreating(false);
        setEditing(false);
      }
      setHydrated(true);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commit(next: SelfNote | null) {
    setNote(next);
    persistSelfNotes(next ? [next] : []);
    onNoteChange?.(next);
  }

  function closeEditor() {
    if (isCreating) {
      commit(null);
    }
    setEditing(false);
    setIsCreating(false);
  }

  function startAdd() {
    const blank = { id: `self-note-${Date.now()}`, body: "" };
    setNote(blank);
    setIsCreating(true);
    setEditing(true);
  }

  function saveNote(updated: SelfNote) {
    commit(updated);
    setEditing(false);
    setIsCreating(false);
  }

  function deleteNote() {
    commit(null);
    setEditing(false);
    setIsCreating(false);
  }

  if (!hydrated) {
    return (
      <p className="type-paragraph-2 text-black/45">Loading…</p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-black">
        These are for your own reference and will not be visible to the
        customer.
      </p>

      {note && editing ? (
        <SelfNoteForm
          key={note.id}
          initial={note}
          isNew={isCreating}
          onSave={saveNote}
          onDelete={isCreating ? closeEditor : deleteNote}
          onClose={closeEditor}
          allowDismiss={!isCreating}
        />
      ) : null}

      {note && !editing ? (
        <SelfNoteCard
          note={note}
          onClick={() => {
            setIsCreating(false);
            setEditing(true);
          }}
        />
      ) : null}

      {!note && !editing ? (
        <div>
          <TertiaryButton onClick={startAdd}>Add</TertiaryButton>
        </div>
      ) : null}
    </div>
  );
}
