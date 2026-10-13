/**
 * Notes Service (F0.1 — Postgres)
 * Handles polymorphic note operations for all entity types
 */

import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";
import type { Note, NoteTargetType } from "@shared/types/note";

/**
 * Get all notes for a specific target (ATHLETE, GROUP, ATTENDANCE, or EVENT)
 */
export async function getNotesByTarget(targetType: NoteTargetType, targetId: string): Promise<Note[]> {
  const notes = await listDocs("notes");

  return notes
    .filter((note: any) => {
      // Check new polymorphic system
      if (note.targetType === targetType && note.targetId === targetId) {
        return true;
      }

      // Backwards compatibility - old system
      if (targetType === "ATHLETE" && note.athleteId === targetId) {
        return true;
      }
      if (targetType === "GROUP" && note.groupId === targetId) {
        return true;
      }

      return false;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Newest first
    });
}

/**
 * Get recent notes for a target (limited)
 */
export async function getRecentNotesByTarget(
  targetType: NoteTargetType,
  targetId: string,
  limit: number = 5
): Promise<Note[]> {
  return (await getNotesByTarget(targetType, targetId)).slice(0, limit);
}

/**
 * Get notes filtered by category for a specific target
 */
export async function getNotesByTargetAndCategory(
  targetType: NoteTargetType,
  targetId: string,
  category: string
): Promise<Note[]> {
  return (await getNotesByTarget(targetType, targetId)).filter(
    (note: any) => note.category === category
  );
}

/**
 * Create a new polymorphic note
 */
export async function createNote(noteData: {
  title: string;
  description: string;
  category: string;
  targetType: NoteTargetType;
  targetId: string;
  flagForWorkoutSelection?: boolean;
}): Promise<Note> {
  const now = new Date();
  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: noteData.title,
    description: noteData.description,
    category: noteData.category as any,
    targetType: noteData.targetType,
    targetId: noteData.targetId,
    createdAt: now,
    updatedAt: now,
    flagForWorkoutSelection: noteData.flagForWorkoutSelection || false,
  };

  await upsertDoc("notes", newNote.id, newNote);

  return newNote;
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
  const existing = await getDoc("notes", noteId);
  if (!existing) return null;

  const updated: Note = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await upsertDoc("notes", noteId, updated);

  return updated;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  const existing = await getDoc("notes", noteId);
  if (!existing) return false;

  await deleteDoc("notes", noteId);
  return true;
}

/**
 * Get a single note by ID
 */
export async function getNoteById(noteId: string): Promise<Note | null> {
  return getDoc("notes", noteId);
}

/**
 * Get all notes (for admin purposes)
 */
export async function getAllNotes(): Promise<Note[]> {
  const notes = await listDocs("notes");
  return notes.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}