"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CustomerNote } from "@/lib/invoice-demo-data";
import {
  loadSavedCustomerNotes,
  matchSavedCustomerNotes,
  persistSavedCustomerNotes,
  removeSavedCustomerNote,
  upsertSavedCustomerNote,
  type SavedCustomerNote,
} from "@/lib/saved-customer-notes";
import { useDismissOnOutsideClick } from "./useDismissOnOutsideClick";
import { EditCloseButton, PencilIcon, TertiaryButton } from "./ui";

type EditingId = string | "new" | null;

const hoverCardClass =
  "rounded-[10px] border border-black/10 transition hover:border-prime-blue hover:ring-1 hover:ring-prime-blue";

const inputClass =
  "w-full rounded border border-black/20 bg-input-grey px-3 py-2.5 text-sm text-midnight-ink outline-none transition focus:border-prime-blue focus:bg-input-grey";

function NoteCard({
  note,
  onClick,
}: {
  note: CustomerNote;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full p-[30px] text-left ${hoverCardClass}`}
    >
      <div className="pr-6">
        <p className="text-base font-bold text-black">
          {note.title || "Untitled note"}
        </p>
        {note.body ? (
          <p className="mt-2.5 text-sm leading-5 text-black">{note.body}</p>
        ) : null}
      </div>
      <span className="absolute right-3 top-3 text-black/30" aria-hidden>
        <PencilIcon />
      </span>
    </button>
  );
}

function TitleField({
  value,
  onChange,
  matches,
  onSelectMatch,
  onForgetMatch,
}: {
  value: string;
  onChange: (value: string) => void;
  matches: SavedCustomerNote[];
  onSelectMatch: (note: SavedCustomerNote) => void;
  onForgetMatch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const showMenu = open && matches.length > 0;

  return (
    <div ref={ref} className="relative">
      <input
        className={inputClass}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Note title"
        autoComplete="off"
      />
      {showMenu ? (
        <div
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
          role="listbox"
        >
          <ul className="max-h-56 overflow-auto py-1">
            {matches.map((match) => (
              <li
                key={match.id}
                className="flex items-stretch border-b border-black/5 last:border-b-0"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex min-w-0 flex-1 flex-col px-4 py-2.5 text-left transition hover:bg-black/[0.04]"
                  onClick={() => {
                    onSelectMatch(match);
                    setOpen(false);
                  }}
                >
                  <span className="truncate text-sm font-semibold text-black">
                    {match.title}
                  </span>
                  {match.body ? (
                    <span className="truncate text-xs text-black/50">
                      {match.body}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  className="px-3 text-xs font-semibold text-delete-red transition hover:bg-delete-red/5"
                  aria-label={`Forget ${match.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onForgetMatch(match.id);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NoteForm({
  initial,
  isNew,
  savedNotes,
  onSavedNotesChange,
  onSave,
  onDelete,
  onClose,
}: {
  initial: CustomerNote;
  isNew: boolean;
  savedNotes: SavedCustomerNote[];
  onSavedNotesChange: (notes: SavedCustomerNote[]) => void;
  onSave: (note: CustomerNote) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  useDismissOnOutsideClick(formRef, onClose);

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [saveForFuture, setSaveForFuture] = useState(
    initial.saveForFuture ?? false,
  );

  const matches = useMemo(
    () => matchSavedCustomerNotes(savedNotes, title),
    [savedNotes, title],
  );

  function applySaved(saved: SavedCustomerNote) {
    setTitle(saved.title);
    setBody(saved.body);
  }

  function forgetSaved(id: string) {
    const next = removeSavedCustomerNote(savedNotes, id);
    onSavedNotesChange(next);
    persistSavedCustomerNotes(next);
  }

  function handleSave() {
    const trimmedTitle = title.trim() || "Untitled note";
    const nextNote: CustomerNote = {
      ...initial,
      title: trimmedTitle,
      body: body.trim(),
      saveForFuture,
    };

    if (saveForFuture && trimmedTitle !== "Untitled note") {
      const nextSaved = upsertSavedCustomerNote(savedNotes, {
        title: trimmedTitle,
        body: nextNote.body,
      });
      onSavedNotesChange(nextSaved);
      persistSavedCustomerNotes(nextSaved);
    }

    onSave(nextNote);
  }

  return (
    <div ref={formRef} className={`relative p-[30px] ${hoverCardClass}`}>
      <EditCloseButton onClick={onClose} />
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2.5">
          <span className="text-sm text-black">Title</span>
          <TitleField
            value={title}
            onChange={setTitle}
            matches={matches}
            onSelectMatch={applySaved}
            onForgetMatch={forgetSaved}
          />
        </label>

        <label className="flex flex-col gap-2.5">
          <span className="text-sm text-black">Description</span>
          <textarea
            className={`${inputClass} min-h-[84px] resize-y`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a note for your customer…"
          />
        </label>

        <label className="flex w-fit items-center gap-2.5 text-sm text-black">
          <input
            type="checkbox"
            checked={saveForFuture}
            onChange={(event) => setSaveForFuture(event.target.checked)}
            className="h-5 w-5 rounded-[4px] accent-prime-blue"
          />
          Save for future invoices
        </label>

        <div className="border-t border-dashed border-black/15 pt-5">
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
              className="inline-flex h-11 items-center justify-center rounded bg-prime-blue px-6 text-sm font-semibold text-white transition hover:bg-[#0063d1]"
            >
              {isNew ? "Save" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerNotesSection() {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [editingId, setEditingId] = useState<EditingId>(null);
  const [newNote, setNewNote] = useState<CustomerNote | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedCustomerNote[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setSavedNotes(loadSavedCustomerNotes()),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  function closeEditor() {
    setEditingId(null);
    setNewNote(null);
  }

  function startAdd() {
    setNewNote({
      id: `note-${Date.now()}`,
      title: "",
      body: "",
      saveForFuture: false,
    });
    setEditingId("new");
  }

  function saveExisting(updated: CustomerNote) {
    setNotes((prev) =>
      prev.map((note) => (note.id === updated.id ? updated : note)),
    );
    setEditingId(null);
  }

  function saveNew(created: CustomerNote) {
    setNotes((prev) => [...prev, created]);
    setNewNote(null);
    setEditingId(null);
  }

  function deleteExisting(id: string) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-sm text-black">
        These will appear at the bottom of your invoice.
      </p>

      {notes.length ? (
        <div className="flex flex-col gap-2.5">
          {notes.map((note) =>
            editingId === note.id ? (
              <NoteForm
                key={note.id}
                initial={note}
                isNew={false}
                savedNotes={savedNotes}
                onSavedNotesChange={setSavedNotes}
                onSave={saveExisting}
                onDelete={() => deleteExisting(note.id)}
                onClose={closeEditor}
              />
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => {
                  setNewNote(null);
                  setEditingId(note.id);
                }}
              />
            ),
          )}
        </div>
      ) : null}

      {editingId === "new" && newNote ? (
        <NoteForm
          initial={newNote}
          isNew
          savedNotes={savedNotes}
          onSavedNotesChange={setSavedNotes}
          onSave={saveNew}
          onDelete={closeEditor}
          onClose={closeEditor}
        />
      ) : null}

      <div>
        <TertiaryButton
          onClick={() => {
            if (editingId === "new") return;
            closeEditor();
            startAdd();
          }}
        >
          Add note
        </TertiaryButton>
      </div>
    </div>
  );
}
