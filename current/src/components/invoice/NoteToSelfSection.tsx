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
}: {
  initial: SelfNote;
  isNew: boolean;
  onSave: (note: SelfNote) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(formRef, onClose);
  const [body, setBody] = useState(initial.body);

  function handleSave() {
    const trimmed = body.trim();
    if (!trimmed && isNew) {
      onClose();
      return;
    }
    onSave({ ...initial, body: trimmed });
  }

  return (
    <div ref={formRef} className={`relative p-5 ${hoverCardClass}`}>
      <EditCloseButton onClick={onClose} />
      <div className="flex flex-col gap-4">
        <textarea
          className={`${inputClass} min-h-[160px] resize-y`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a private reminder…"
          autoFocus
        />

        <div className="border-t border-dashed border-black/15 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-semibold text-delete-red transition hover:opacity-80"
            >
              {isNew ? "Cancel" : "Delete"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center justify-center rounded bg-prime-blue px-5 text-sm font-semibold text-white transition hover:bg-[#0063d1]"
            >
              {isNew ? "Save" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoteToSelfSection() {
  const [note, setNote] = useState<SelfNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadSelfNotes();
    window.setTimeout(() => {
      setNote(loaded[0] ?? null);
      setHydrated(true);
    }, 0);
  }, []);

  function commit(next: SelfNote | null) {
    setNote(next);
    persistSelfNotes(next ? [next] : []);
  }

  function closeEditor() {
    if (isCreating) {
      setNote(null);
    }
    setEditing(false);
    setIsCreating(false);
  }

  function startAdd() {
    setNote({ id: `self-note-${Date.now()}`, body: "" });
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

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-black">
        These are for your own reference and will not be visible to the
        customer.
      </p>

      {hydrated && note && editing ? (
        <SelfNoteForm
          initial={note}
          isNew={isCreating}
          onSave={saveNote}
          onDelete={isCreating ? closeEditor : deleteNote}
          onClose={closeEditor}
        />
      ) : null}

      {hydrated && note && !editing ? (
        <SelfNoteCard
          note={note}
          onClick={() => {
            setIsCreating(false);
            setEditing(true);
          }}
        />
      ) : null}

      {hydrated && !note && !editing ? (
        <div>
          <TertiaryButton onClick={startAdd}>Add note</TertiaryButton>
        </div>
      ) : null}
    </div>
  );
}
