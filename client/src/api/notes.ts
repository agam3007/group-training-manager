import { env } from "@/env/env";
import type { Note, NoteTargetType } from "@/shared/types/note";

const API = `${env.apiUrl}/notes`;

// ==========================
// Get notes by target (polymorphic)
// ==========================
export async function getNotesByTarget(
  targetType: NoteTargetType,
  targetId: string
): Promise<Note[]> {
  const res = await fetch(`${API}/target/${targetType}/${targetId}`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

// ==========================
// Get recent notes for target
// ==========================
export async function getRecentNotesByTarget(
  targetType: NoteTargetType,
  targetId: string,
  limit: number = 5
): Promise<Note[]> {
  const res = await fetch(
    `${API}/target/${targetType}/${targetId}/recent?limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to fetch recent notes");
  return res.json();
}

// ==========================
// Get notes by target and category
// ==========================
export async function getNotesByTargetAndCategory(
  targetType: NoteTargetType,
  targetId: string,
  category: string
): Promise<Note[]> {
  const res = await fetch(
    `${API}/target/${targetType}/${targetId}/category/${category}`
  );
  if (!res.ok) throw new Error("Failed to fetch notes by category");
  return res.json();
}

// ==========================
// Create a new note
// ==========================
export async function createNote(noteData: {
  title: string;
  description: string;
  category: string;
  targetType: NoteTargetType;
  targetId: string;
  flagForWorkoutSelection?: boolean;
}): Promise<Note> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(noteData),
  });

  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

// ==========================
// Update a note
// ==========================
export async function updateNote(
  noteId: string,
  updates: Partial<Note>
): Promise<Note> {
  const res = await fetch(`${API}/${noteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

// ==========================
// Delete a note
// ==========================
export async function deleteNote(noteId: string): Promise<void> {
  const res = await fetch(`${API}/${noteId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete note");
}

// ==========================
// Get a single note by ID
// ==========================
export async function getNoteById(noteId: string): Promise<Note> {
  const res = await fetch(`${API}/${noteId}`);
  if (!res.ok) throw new Error("Failed to fetch note");
  return res.json();
}

// ==========================
// Get all notes (admin)
// ==========================
export async function getAllNotes(): Promise<Note[]> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}
